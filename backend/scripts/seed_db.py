"""
Seed the demo tenant, LMS collections, and identity users from backend/seed_data/demo.json.

Usage (from backend/):
    python scripts/seed_db.py
"""
import asyncio
import json
import sys
from collections import Counter
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, select
import bcrypt

from app.core.database import AsyncSessionLocal, init_db
from app.core.demo_auth import map_frontend_role
from app.modules.identity.models import GuardianLink, GuardianRelationship, User, UserRoleAssignment, UserStatus
from app.modules.lms_store.service import LmsStoreService
from app.modules.tenants.models import Tenant, TenantStatus, TenantType


SEED_FILE = Path(__file__).resolve().parents[1] / "seed_data" / "demo.json"
TENANT_CODE = "berana"
TENANT_NAME = "Berana University"
DEMO_PASSWORD = "Demo123!"

STATUS_MAP = {
    "active": UserStatus.ACTIVE,
    "invited": UserStatus.INVITED,
    "suspended": UserStatus.SUSPENDED,
}


async def ensure_tenant(db) -> Tenant:
    result = await db.execute(select(Tenant).where(Tenant.code == TENANT_CODE))
    tenant = result.scalar_one_or_none()
    if tenant:
        return tenant

    tenant = Tenant(
        code=TENANT_CODE,
        name=TENANT_NAME,
        tenant_type=TenantType.UNIVERSITY,
        status=TenantStatus.ACTIVE,
        timezone="Africa/Addis_Ababa",
        locale="en",
        currency="ETB",
        settings={"demo": True},
    )
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    await db.commit()
    print(f"Created tenant: {tenant.code} ({tenant.id})")
    return tenant


def _person_status(person: dict) -> UserStatus:
    return STATUS_MAP.get(str(person.get("status", "active")).lower(), UserStatus.ACTIVE)


async def seed_identity_users(db, tenant: Tenant, people: list) -> None:
    await db.execute(delete(GuardianLink).where(GuardianLink.tenant_id == tenant.id))
    await db.execute(delete(UserRoleAssignment).where(UserRoleAssignment.tenant_id == tenant.id))
    await db.execute(delete(User).where(User.tenant_id == tenant.id))
    await db.flush()

    password_hash = bcrypt.hashpw(DEMO_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    users_by_person_id: dict[str, User] = {}
    users_by_name: dict[str, User] = {}
    role_counts: Counter[str] = Counter()
    seen_emails: set[str] = set()

    for person in people:
        if not isinstance(person, dict):
            continue
        email = str(person.get("email", "")).strip().lower()
        if not email or email in seen_emails:
            continue
        seen_emails.add(email)

        frontend_role = str(person.get("role", "Student"))
        user = User(
            tenant_id=tenant.id,
            email=email,
            display_name=str(person.get("name", email)),
            hashed_password=password_hash,
            status=_person_status(person),
        )
        db.add(user)
        await db.flush()
        db.add(
            UserRoleAssignment(
                tenant_id=tenant.id,
                user_id=user.id,
                role=map_frontend_role(frontend_role),
            )
        )
        users_by_person_id[str(person.get("id", ""))] = user
        users_by_name[str(person.get("name", "")).strip().lower()] = user
        role_counts[frontend_role] += 1

    for person in people:
        if not isinstance(person, dict) or str(person.get("role")) != "Guardian":
            continue
        guardian = users_by_person_id.get(str(person.get("id", "")))
        child_name = str(person.get("department", "")).strip().lower()
        student = users_by_name.get(child_name)
        if not guardian or not student or guardian.id == student.id:
            continue
        db.add(
            GuardianLink(
                tenant_id=tenant.id,
                guardian_user_id=guardian.id,
                student_user_id=student.id,
                relationship_type=GuardianRelationship.PARENT,
                is_active=str(person.get("status")) == "active",
            )
        )

    await db.commit()

    print(f"Seeded {sum(role_counts.values())} identity users (password: {DEMO_PASSWORD})")
    for role, count in sorted(role_counts.items()):
        print(f"  {role}: {count}")


async def main() -> None:
    if not SEED_FILE.exists():
        print(f"Seed file not found: {SEED_FILE}")
        print("Run from repo root: npm run export-seed")
        sys.exit(1)

    with SEED_FILE.open(encoding="utf-8") as f:
        payload = json.load(f)

    collections = payload.get("collections", payload)
    if not isinstance(collections, dict):
        print("Invalid seed file: expected 'collections' object")
        sys.exit(1)

    await init_db()

    async with AsyncSessionLocal() as db:
        tenant = await ensure_tenant(db)
        service = LmsStoreService(db)
        count = await service.seed_collections(tenant.id, collections)
        print(f"Seeded {count} collections for tenant '{TENANT_CODE}'")

        people = collections.get("people", [])
        if isinstance(people, list):
            await seed_identity_users(db, tenant, people)
        else:
            print("Skipped identity users: people collection is not a list")


if __name__ == "__main__":
    asyncio.run(main())
