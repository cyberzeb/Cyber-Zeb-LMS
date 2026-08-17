"""
Onboarding / Super Admin tests.

Covers: public create + idempotency, super-admin auth boundary,
state machine, activate idempotency, and cross-tenant isolation proof.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app as fastapi_app
from app.modules.onboarding.models import (
    InstitutionAdminAccount,
    PlatformAdminRole,
    PlatformAdminUser,
    ServiceRequest,
    ServiceRequestStatus,
)
from app.modules.tenants.models import Tenant, TenantStatus, TenantType

# Import models for metadata
import app.modules.identity.models  # noqa: F401
import app.common.audit  # noqa: F401


TEST_MODULES = [
    "tenant_institution_mgmt",
    "identity_access",
    "attendance",
    "course_catalog_authoring",
]


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    Session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine):
    Session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with Session() as session:
            try:
                yield session
            finally:
                await session.close()

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def super_admin(db_session: AsyncSession):
    email = f"sa-{uuid.uuid4().hex[:8]}@example.com"
    admin = PlatformAdminUser(
        email=email,
        password_hash=hash_password("SuperSecret123!"),
        role=PlatformAdminRole.SUPER_ADMIN,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    token = create_access_token(
        subject=str(admin.id),
        extra_claims={
            "principal_type": "platform_admin",
            "role": "super_admin",
            "email": admin.email,
        },
    )
    return admin, token


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_service_request_idempotent(client):
    key = str(uuid.uuid4())
    body = {
        "institution_name": "Test University",
        "institution_type": "university",
        "contact_name": "Ada Lovelace",
        "email": "ada@test.edu",
        "phone": "+251900000001",
        "estimated_users": "500",
        "preferred_slug": "test-uni",
        "requested_modules": TEST_MODULES,
        "message": "Please provision",
    }
    r1 = await client.post(
        "/api/v1/service-requests",
        json=body,
        headers={"Idempotency-Key": key},
    )
    assert r1.status_code == 201, r1.text
    r2 = await client.post(
        "/api/v1/service-requests",
        json=body,
        headers={"Idempotency-Key": key},
    )
    assert r2.status_code == 201
    assert r1.json()["id"] == r2.json()["id"]


@pytest.mark.asyncio
async def test_list_requires_super_admin(client):
    r = await client.get("/api/v1/service-requests")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_institution_token_cannot_access_super_admin_routes(client, super_admin):
    _admin, _ = super_admin
    # Forge a tenant-scoped JWT (as InstitutionAdmin would receive)
    fake_tenant = uuid.uuid4()
    inst_token = create_access_token(
        subject=str(uuid.uuid4()),
        extra_claims={
            "tenant_id": str(fake_tenant),
            "role": "institution_admin",
        },
    )
    r = await client.get(
        "/api/v1/service-requests",
        headers=_auth(inst_token),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_state_machine_and_activate_idempotent(client, super_admin, db_session):
    admin, token = super_admin
    key = str(uuid.uuid4())
    create = await client.post(
        "/api/v1/service-requests",
        json={
            "institution_name": "Activation U",
            "institution_type": "university",
            "contact_name": "Admin",
            "email": f"admin-{uuid.uuid4().hex[:6]}@activation.edu",
            "phone": "+251911111111",
            "estimated_users": "100",
            "preferred_slug": f"act-{uuid.uuid4().hex[:6]}",
            "requested_modules": TEST_MODULES,
        },
        headers={"Idempotency-Key": key},
    )
    assert create.status_code == 201, create.text
    rid = create.json()["id"]

    inv = await client.post(
        f"/api/v1/service-requests/{rid}/send-invoice",
        json={
            "invoice_amount": "1500.00",
            "invoice_currency": "ETB",
            "invoice_notes": "Pay via CBE transfer to account 123",
        },
        headers=_auth(token),
    )
    assert inv.status_code == 200, inv.text
    assert inv.json()["status"] == "invoice_sent"

    pay = await client.post(
        f"/api/v1/service-requests/{rid}/confirm-payment",
        headers=_auth(token),
    )
    assert pay.status_code == 200
    assert pay.json()["status"] == "payment_confirmed"

    act1 = await client.post(
        f"/api/v1/service-requests/{rid}/activate",
        headers={**_auth(token), "Idempotency-Key": str(uuid.uuid4())},
    )
    assert act1.status_code == 200, act1.text
    assert act1.json()["already_activated"] is False
    tenant_id = act1.json()["tenant"]["id"]

    act2 = await client.post(
        f"/api/v1/service-requests/{rid}/activate",
        headers={**_auth(token), "Idempotency-Key": str(uuid.uuid4())},
    )
    assert act2.status_code == 200
    assert act2.json()["already_activated"] is True
    assert act2.json()["tenant"]["id"] == tenant_id


@pytest.mark.asyncio
async def test_cross_tenant_institution_admin_isolation(db_session: AsyncSession):
    """
    Prove two institutions' InstitutionAdminAccount rows are scoped by
    tenant_id and a query for tenant A never returns tenant B's admin.
    """
    t1 = Tenant(
        code=f"t1-{uuid.uuid4().hex[:6]}",
        name="Tenant One",
        tenant_type=TenantType.UNIVERSITY,
        status=TenantStatus.ACTIVE,
        slug=f"t1-{uuid.uuid4().hex[:6]}",
        enabled_modules=["identity_access"],
    )
    t2 = Tenant(
        code=f"t2-{uuid.uuid4().hex[:6]}",
        name="Tenant Two",
        tenant_type=TenantType.SCHOOL,
        status=TenantStatus.ACTIVE,
        slug=f"t2-{uuid.uuid4().hex[:6]}",
        enabled_modules=["identity_access"],
    )
    db_session.add_all([t1, t2])
    await db_session.flush()

    a1 = InstitutionAdminAccount(
        tenant_id=t1.id,
        email="admin1@one.edu",
        temporary_password_hash=hash_password("x"),
        must_change_password=True,
    )
    a2 = InstitutionAdminAccount(
        tenant_id=t2.id,
        email="admin2@two.edu",
        temporary_password_hash=hash_password("y"),
        must_change_password=True,
    )
    db_session.add_all([a1, a2])
    await db_session.commit()

    from sqlalchemy import select

    t1_admins = (
        await db_session.execute(
            select(InstitutionAdminAccount).where(
                InstitutionAdminAccount.tenant_id == t1.id
            )
        )
    ).scalars().all()
    emails = {a.email for a in t1_admins}
    assert "admin1@one.edu" in emails
    assert "admin2@two.edu" not in emails
