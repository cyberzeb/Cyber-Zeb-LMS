"""
Corporate training assignments point at a catalog course, not a university
term offering — the rule that requires an offering is University-only.
"""
from __future__ import annotations

from sqlalchemy import select

from app.modules.onboarding.institution_types import InstitutionType
from app.modules.tenants.models import Tenant
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)

ASSIGNMENT = {
    "id": "enr-new",
    "studentId": "stu-1",
    "courseId": "c1",
    "status": "active",
    "progress": 0,
    "isMandatory": True,
    "dueDate": "2026-12-01",
}


async def _make_corporate(session_factory, tenant_id) -> None:
    async with session_factory() as db:
        tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one()
        tenant.institution_type = InstitutionType.CORPORATE
        await db.commit()


async def test_corporate_assignment_needs_no_offering(env):
    client, tenants = env
    await _make_corporate(tenants["_session_factory"], tenants["tenant-a"])
    admin = _auth(tenants["tenant-a"], "admin-1", "Admin")
    res = await client.patch("/api/v1/data/enrollments", json={"upserts": [{"record": ASSIGNMENT}]}, headers=admin)
    assert res.status_code == 200, res.text

    # It must still point at a real course.
    bad = {**ASSIGNMENT, "id": "enr-bad", "courseId": "nope"}
    res = await client.patch("/api/v1/data/enrollments", json={"upserts": [{"record": bad}]}, headers=admin)
    assert res.status_code == 422


async def test_university_enrollment_still_needs_an_offering(env):
    client, tenants = env
    admin = _auth(tenants["tenant-a"], "admin-1", "Admin")
    res = await client.patch("/api/v1/data/enrollments", json={"upserts": [{"record": ASSIGNMENT}]}, headers=admin)
    assert res.status_code == 422
    assert "offering" in res.json()["error"]["message"].lower()


async def test_recertification_round_starts_from_zero(env):
    from tests.modules.test_certificates import _replace

    client, tenants = env
    sf, t = tenants["_session_factory"], tenants["tenant-a"]
    await _make_corporate(sf, t)
    done = {"id": "enr-old", "studentId": "stu-1", "courseId": "c1", "status": "active", "progress": 100}
    await _replace(sf, t, "enrollments", [done])
    await _replace(sf, t, "lesson-progress", {"stu-1": {"c1": ["l1", "l2"], "c2": ["x"]}})
    admin = _auth(t, "admin-1", "Admin")
    renewal = {"id": "enr-new", "studentId": "stu-1", "courseId": "c1", "status": "active", "progress": 0}
    res = await client.patch(
        "/api/v1/data/enrollments",
        json={"upserts": [{"record": renewal}], "deletes": ["enr-old"]},
        headers=admin,
    )
    assert res.status_code == 200, res.text
    progress = (await client.get("/api/v1/data/lesson-progress", headers=admin)).json()["data"]
    assert progress["stu-1"] == {"c1": [], "c2": ["x"]}
