"""
Per-tenant module entitlement.

An institution only gets the modules it selected at registration. These tests
pin the two halves of that: the routers refuse a module the tenant did not take,
and GET /tenants/me/modules reports the split so the workspace can lock the rest.
"""
from __future__ import annotations

from sqlalchemy import select

from app.modules.onboarding.constants import ALWAYS_ON_MODULES, ModuleKey
from app.modules.tenants.models import Tenant
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)


async def _set_modules(session_factory, tenant_id, modules: list[str]) -> None:
    async with session_factory() as db:
        tenant = (
            await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        ).scalar_one()
        tenant.enabled_modules = modules
        await db.commit()


async def test_module_not_taken_is_refused_with_its_key(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(
        tenants["_session_factory"],
        tenant,
        [ModuleKey.COURSE_CATALOG_AUTHORING.value],
    )
    admin = _auth(tenant, "admin-1", "Admin")

    blocked = await client.get("/api/v1/payments/provider", headers=admin)
    assert blocked.status_code == 403
    error = blocked.json()["error"]
    assert error["code"] == "module_not_enabled"
    # The client needs the key so it can offer "Request this module".
    assert error["details"][0]["module"] == ModuleKey.PAYMENTS_BILLING.value
    assert error["details"][0]["label"] == "Payments & Billing"


async def test_selected_module_is_not_refused(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(
        tenants["_session_factory"],
        tenant,
        [ModuleKey.PAYMENTS_BILLING.value],
    )
    admin = _auth(tenant, "admin-1", "Admin")

    allowed = await client.get("/api/v1/payments/provider", headers=admin)
    assert allowed.status_code == 200


async def test_core_modules_cannot_be_switched_off(env):
    """Identity and tenant management stay on, or nobody could sign in at all."""
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(tenants["_session_factory"], tenant, [ModuleKey.ATTENDANCE.value])
    admin = _auth(tenant, "admin-1", "Admin")

    modules = (await client.get("/api/v1/tenants/me/modules", headers=admin)).json()
    for core in ALWAYS_ON_MODULES:
        assert core.value in modules["enabled"]
        assert core.value not in modules["locked"]


async def test_modules_endpoint_splits_enabled_from_locked(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(
        tenants["_session_factory"],
        tenant,
        [ModuleKey.ATTENDANCE.value, ModuleKey.REPORTS_ANALYTICS.value],
    )
    admin = _auth(tenant, "admin-1", "Admin")

    body = (await client.get("/api/v1/tenants/me/modules", headers=admin)).json()
    assert ModuleKey.ATTENDANCE.value in body["enabled"]
    assert ModuleKey.REPORTS_ANALYTICS.value in body["enabled"]
    assert ModuleKey.PAYMENTS_BILLING.value in body["locked"]
    # Every module is accounted for exactly once, and each carries a label.
    assert set(body["enabled"]) | set(body["locked"]) == {m.value for m in ModuleKey}
    assert not set(body["enabled"]) & set(body["locked"])
    assert body["labels"][ModuleKey.PAYMENTS_BILLING.value] == "Payments & Billing"


async def test_tenant_without_a_selection_keeps_every_module(env):
    """Institutions that predate module selection must not lose their workspace."""
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(tenants["_session_factory"], tenant, [])
    admin = _auth(tenant, "admin-1", "Admin")

    body = (await client.get("/api/v1/tenants/me/modules", headers=admin)).json()
    assert body["locked"] == []
    assert (await client.get("/api/v1/payments/provider", headers=admin)).status_code == 200


async def test_module_gate_does_not_leak_to_anonymous_callers(env):
    """An unauthenticated caller gets 401, never a hint about what was bought."""
    client, tenants = env
    await _set_modules(tenants["_session_factory"], tenants["tenant-a"], [])

    anonymous = await client.get("/api/v1/payments/provider")
    assert anonymous.status_code == 401


# ── Data store: where the portal actually reads and writes ───────────────────


async def test_locked_collection_is_refused_and_named(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(
        tenants["_session_factory"], tenant, [ModuleKey.COURSE_CATALOG_AUTHORING.value]
    )
    admin = _auth(tenant, "admin-1", "Admin")

    blocked = await client.get("/api/v1/data/quizzes", headers=admin)
    assert blocked.status_code == 403
    assert blocked.json()["error"]["details"][0]["module"] == (
        ModuleKey.ASSIGNMENTS_ASSESSMENTS.value
    )

    # Writes are refused too, not just reads.
    put = await client.put("/api/v1/data/quizzes", json={"data": []}, headers=admin)
    assert put.status_code == 403
    patch = await client.patch("/api/v1/data/quizzes", json={"deletes": ["quiz-1"]}, headers=admin)
    assert patch.status_code == 403


async def test_bulk_read_omits_locked_collections(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_modules(
        tenants["_session_factory"],
        tenant,
        [ModuleKey.COURSE_CATALOG_AUTHORING.value, ModuleKey.ENROLLMENT_COHORTS.value],
    )
    admin = _auth(tenant, "admin-1", "Admin")

    body = (await client.get("/api/v1/data", headers=admin)).json()
    assert "courses" in body
    assert "enrollments" in body
    assert "quizzes" not in body
    assert "payments" not in body
    # Core collections are never module-gated, or the workspace cannot function.
    assert "people" in body
    assert "settings" in body


async def test_core_collections_stay_readable_with_no_modules(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    # Only the always-on modules.
    await _set_modules(
        tenants["_session_factory"],
        tenant,
        [m.value for m in ALWAYS_ON_MODULES],
    )
    admin = _auth(tenant, "admin-1", "Admin")

    assert (await client.get("/api/v1/data/people", headers=admin)).status_code == 200
    assert (await client.get("/api/v1/data/settings", headers=admin)).status_code == 200
    assert (await client.get("/api/v1/data/courses", headers=admin)).status_code == 403
