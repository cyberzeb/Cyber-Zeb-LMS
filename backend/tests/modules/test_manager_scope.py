"""
Corporate line managers see and assign training for their own team only.
"""
from __future__ import annotations

from tests.modules.test_certificates import _replace
from tests.modules.test_corporate_assignments import _make_corporate
from tests.modules.test_lms_store_security import PEOPLE, _auth, env  # noqa: F401  (fixture)


async def _setup(tenants):
    sf, t = tenants["_session_factory"], tenants["tenant-a"]
    await _make_corporate(sf, t)
    people = [
        *[{**p, "teamId": "team-1"} if p["id"] == "stu-1" else ({**p, "teamId": "team-2"} if p["id"] == "stu-2" else p) for p in PEOPLE],
        {"id": "mgr-1", "name": "Mia Manager", "email": "mia@example.com", "role": "Manager", "teamId": "team-1"},
    ]
    await _replace(sf, t, "people", people)
    await _replace(
        sf,
        t,
        "teams",
        [{"id": "team-1", "name": "AML", "managerId": "mgr-1"}, {"id": "team-2", "name": "Retail", "managerId": None}],
    )
    await _replace(sf, t, "certificates", [
        {"id": "c-1", "studentId": "stu-1", "courseId": "c1", "status": "issued"},
        {"id": "c-2", "studentId": "stu-2", "courseId": "c2", "status": "issued"},
    ])


async def test_manager_reads_only_their_team(env):
    client, tenants = env
    await _setup(tenants)
    mgr = _auth(tenants["tenant-a"], "mgr-1", "Manager")

    enrollments = (await client.get("/api/v1/data/enrollments", headers=mgr)).json()["data"]
    assert {e["studentId"] for e in enrollments} == {"stu-1"}
    certificates = (await client.get("/api/v1/data/certificates", headers=mgr)).json()["data"]
    assert [c["id"] for c in certificates] == ["c-1"]

    people = {p["id"]: p for p in (await client.get("/api/v1/data/people", headers=mgr)).json()["data"]}
    assert people["stu-1"].get("email") == "sam@example.com"
    # Everyone else is only a directory entry.
    assert "email" not in people["stu-2"]


async def test_manager_assigns_training_to_their_team_only(env):
    client, tenants = env
    await _setup(tenants)
    mgr = _auth(tenants["tenant-a"], "mgr-1", "Manager")
    mine = {"id": "enr-m1", "studentId": "stu-1", "courseId": "c1", "status": "active", "progress": 0, "dueDate": "2026-12-01"}
    ok = await client.patch("/api/v1/data/enrollments", json={"upserts": [{"record": mine}]}, headers=mgr)
    assert ok.status_code == 200, ok.text
    other = {**mine, "id": "enr-m2", "studentId": "stu-2"}
    denied = await client.patch("/api/v1/data/enrollments", json={"upserts": [{"record": other}]}, headers=mgr)
    assert denied.status_code == 403


async def test_learner_can_record_completion_date(env):
    client, tenants = env
    stu = _auth(tenants["tenant-a"], "stu-1", "Student")
    enrollments = (await client.get("/api/v1/data/enrollments", headers=stu)).json()["data"]
    mine = {**enrollments[0], "progress": 100, "completedOn": "2026-09-01"}
    res = await client.patch("/api/v1/data/enrollments", json={"upserts": [{"record": mine}]}, headers=stu)
    assert res.status_code == 200, res.text
