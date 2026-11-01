"""
University Edition role permissions: registrar, finance officer and teaching assistant.

Reuses the throwaway-database fixture from test_lms_store_security.
"""
from __future__ import annotations

from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)

STAFF = [
    {"id": "reg-1", "name": "Rita Registrar", "email": "rita@example.com", "role": "Registrar"},
    {"id": "fin-1", "name": "Fred Finance", "email": "fred@example.com", "role": "FinanceOfficer"},
    {"id": "ta-1", "name": "Tom Assistant", "email": "tom@example.com", "role": "TeachingAssistant"},
]


async def _setup(client, tenants):
    """Add the three staff accounts and assign the TA to course c1."""
    admin = _auth(tenants["tenant-a"], "admin-1", "Admin")
    res = await client.patch(
        "/api/v1/data/people",
        json={"upserts": [{"record": p, "after": None} for p in STAFF]},
        headers=admin,
    )
    assert res.status_code == 200
    res = await client.patch(
        "/api/v1/data/courses",
        json={
            "upserts": [
                {
                    "record": {"id": "c1", "title": "Intro", "instructorId": "ins-1", "teachingAssistantIds": ["ta-1"]},
                    "after": None,
                }
            ]
        },
        headers=admin,
    )
    assert res.status_code == 200


async def _patch(client, tenants, person, role, key, record):
    return await client.patch(
        f"/api/v1/data/{key}",
        json={"upserts": [{"record": record, "after": None}]},
        headers=_auth(tenants["tenant-a"], person, role),
    )


async def _read(client, tenants, person, role, key):
    res = await client.get(f"/api/v1/data/{key}", headers=_auth(tenants["tenant-a"], person, role))
    assert res.status_code == 200
    return res.json()["data"]


def test_role_mapping():
    from app.core.demo_auth import map_frontend_role
    from app.core.permissions import Role

    assert map_frontend_role("Registrar") == Role.REGISTRAR
    assert map_frontend_role("FinanceOfficer") == Role.FINANCE_OFFICER
    assert map_frontend_role("TeachingAssistant") == Role.TEACHING_ASSISTANT
    # The registrar is no longer a full tenant admin.
    from app.core.demo_auth import TENANT_ADMIN_ROLES

    assert Role.REGISTRAR not in TENANT_ADMIN_ROLES


# ── Registrar ───────────────────────────────────────────────────────────────


async def test_registrar_reads_academic_data_but_not_secrets(env):
    client, tenants = env
    await _setup(client, tenants)
    assert len(await _read(client, tenants, "reg-1", "Registrar", "enrollments")) == 2
    people = {p["id"]: p for p in await _read(client, tenants, "reg-1", "Registrar", "people")}
    assert people["stu-2"]["email"] == "tia@example.com"
    assert "integrations" not in await _read(client, tenants, "reg-1", "Registrar", "settings")


async def test_registrar_manages_academic_records(env):
    client, tenants = env
    await _setup(client, tenants)
    enrol = {"id": "enr-9", "studentId": "stu-2", "courseId": "c1", "progress": 0, "status": "active"}
    # Allowed by the policy (a 422 here only means University data rules want an offering).
    assert (await _patch(client, tenants, "reg-1", "Registrar", "enrollments", enrol)).status_code != 403
    course = {"id": "c2", "title": "Renamed", "instructorId": "ins-2"}
    assert (await _patch(client, tenants, "reg-1", "Registrar", "courses", course)).status_code == 200
    year = {"id": "ay-9", "name": "2026-2027"}
    assert (await _patch(client, tenants, "reg-1", "Registrar", "academic-years", year)).status_code == 200
    student = {"id": "stu-9", "name": "New Student", "email": "new@example.com", "role": "Student"}
    assert (await _patch(client, tenants, "reg-1", "Registrar", "people", student)).status_code == 200


async def test_registrar_cannot_touch_payments_admins_or_settings(env):
    client, tenants = env
    await _setup(client, tenants)
    payment = {"id": "pay-1", "studentId": "stu-1", "amount": 0, "currency": "ETB", "status": "paid"}
    assert (await _patch(client, tenants, "reg-1", "Registrar", "payments", payment)).status_code == 403
    admin = {"id": "adm-9", "name": "Sneaky", "email": "x@example.com", "role": "Admin"}
    assert (await _patch(client, tenants, "reg-1", "Registrar", "people", admin)).status_code == 403
    # Promoting an existing student to admin is refused too.
    promoted = {"id": "stu-1", "name": "Sam Student", "email": "sam@example.com", "role": "Admin"}
    assert (await _patch(client, tenants, "reg-1", "Registrar", "people", promoted)).status_code == 403
    res = await client.put(
        "/api/v1/data/settings",
        json={"data": {}},
        headers=_auth(tenants["tenant-a"], "reg-1", "Registrar"),
    )
    assert res.status_code == 403


# ── Finance officer ─────────────────────────────────────────────────────────


async def test_finance_manages_payments_only(env):
    client, tenants = env
    await _setup(client, tenants)
    assert len(await _read(client, tenants, "fin-1", "FinanceOfficer", "payments")) == 2
    assert len(await _read(client, tenants, "fin-1", "FinanceOfficer", "enrollments")) == 2
    payment = {"id": "pay-1", "studentId": "stu-1", "amount": 100, "currency": "ETB", "status": "paid"}
    assert (await _patch(client, tenants, "fin-1", "FinanceOfficer", "payments", payment)).status_code == 200
    enrol = {"id": "enr-9", "studentId": "stu-2", "courseId": "c1", "progress": 0, "status": "active"}
    assert (await _patch(client, tenants, "fin-1", "FinanceOfficer", "enrollments", enrol)).status_code == 403
    assert await _read(client, tenants, "fin-1", "FinanceOfficer", "student-submissions") == []


# ── Teaching assistant ──────────────────────────────────────────────────────


async def test_teaching_assistant_sees_assigned_course(env):
    client, tenants = env
    await _setup(client, tenants)
    assert [e["id"] for e in await _read(client, tenants, "ta-1", "TeachingAssistant", "enrollments")] == ["enr-1"]
    assert await _read(client, tenants, "ta-1", "TeachingAssistant", "payments") == []
    people = {p["id"]: p for p in await _read(client, tenants, "ta-1", "TeachingAssistant", "people")}
    assert people["stu-1"]["email"] == "sam@example.com"
    assert "email" not in people["stu-2"]


async def test_teaching_assistant_grades_and_takes_attendance(env):
    client, tenants = env
    await _setup(client, tenants)
    attendance = {"id": "att-1", "courseId": "c1", "studentId": "stu-1", "status": "present"}
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "attendances", attendance)).status_code == 200
    other = {"id": "att-2", "courseId": "c2", "studentId": "stu-2", "status": "present"}
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "attendances", other)).status_code == 403
    grade = {
        "id": "sub-1",
        "studentId": "stu-1",
        "assessmentType": "assignment",
        "assessmentId": "asg-1",
        "status": "graded",
        "score": 90,
    }
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "student-submissions", grade)).status_code == 200


async def test_teaching_assistant_cannot_author_content(env):
    client, tenants = env
    await _setup(client, tenants)
    quiz = {"id": "quiz-9", "courseId": "c1", "status": "draft"}
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "quizzes", quiz)).status_code == 403
    assignment = {"id": "asg-9", "courseId": "c1", "status": "draft"}
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "assignments", assignment)).status_code == 403
    announcement = {"id": "ann-9", "authorId": "ta-1", "title": "Hi"}
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "announcements", announcement)).status_code == 403
    course = {"id": "c9", "title": "Mine", "instructorId": "ta-1", "approvalStatus": "pending"}
    assert (await _patch(client, tenants, "ta-1", "TeachingAssistant", "courses", course)).status_code == 403
