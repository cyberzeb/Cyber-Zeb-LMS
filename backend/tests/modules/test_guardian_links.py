"""
A guardian with several children sees every one of them, however the link is
recorded (a list of ids, a single id, or the legacy child's name).
"""
from __future__ import annotations

from sqlalchemy import select

from app.modules.lms_store.models import LmsCollection
from tests.modules.test_lms_store_security import PEOPLE, _auth, env  # noqa: F401  (fixture)


async def _set_guardian(session_factory, tenant_id, guardian: dict) -> None:
    async with session_factory() as db:
        row = (
            await db.execute(
                select(LmsCollection).where(
                    LmsCollection.tenant_id == tenant_id, LmsCollection.collection_key == "people"
                )
            )
        ).scalar_one()
        row.data = [p for p in PEOPLE if p["id"] != "par-1"] + [guardian]
        await db.commit()


async def _visible_enrollments(client, tenant_id) -> set[str]:
    res = await client.get("/api/v1/data/enrollments", headers=_auth(tenant_id, "par-1", "Guardian"))
    assert res.status_code == 200
    return {r["studentId"] for r in res.json()["data"]}


async def test_guardian_sees_all_linked_children(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    await _set_guardian(
        tenants["_session_factory"],
        tenant,
        {
            "id": "par-1",
            "name": "Pat Parent",
            "role": "Guardian",
            "department": "Sam Student, Tia Student",
            "linkedStudentId": "stu-1",
            "linkedStudentIds": ["stu-1", "stu-2"],
        },
    )
    assert await _visible_enrollments(client, tenant) == {"stu-1", "stu-2"}


async def test_single_and_legacy_links_still_work(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    # Legacy fixture: the child is named in `department`.
    assert await _visible_enrollments(client, tenant) == {"stu-1"}
    await _set_guardian(
        tenants["_session_factory"],
        tenant,
        {"id": "par-1", "name": "Pat Parent", "role": "Guardian", "department": "", "linkedStudentId": "stu-2"},
    )
    assert await _visible_enrollments(client, tenant) == {"stu-2"}
