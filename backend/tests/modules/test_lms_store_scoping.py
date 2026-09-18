"""
Read scoping, instructor write scope, server-side quiz grading and checkout.

Reuses the throwaway-database fixture from test_lms_store_security.
"""
from __future__ import annotations

from app.core.config import settings
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)


async def _read(client, tenants, person, role, key):
    res = await client.get(f"/api/v1/data/{key}", headers=_auth(tenants["tenant-a"], person, role))
    assert res.status_code == 200
    return res.json()["data"]


# ── Read scoping ────────────────────────────────────────────────────────────


async def test_student_reads_only_own_records(env):
    client, tenants = env
    assert [p["id"] for p in await _read(client, tenants, "stu-1", "Student", "payments")] == ["pay-1"]
    assert await _read(client, tenants, "stu-1", "Student", "student-submissions") == []
    assert [e["id"] for e in await _read(client, tenants, "stu-1", "Student", "enrollments")] == ["enr-1"]
    assert [s["id"] for s in await _read(client, tenants, "stu-1", "Student", "live-sessions")] == ["ls-1"]


async def test_student_people_view_hides_personal_data(env):
    client, tenants = env
    people = {p["id"]: p for p in await _read(client, tenants, "stu-1", "Student", "people")}
    assert people["stu-1"]["email"] == "sam@example.com"
    assert "email" not in people["stu-2"]
    assert "email" not in people["admin-1"]


async def test_students_never_receive_answer_keys(env):
    client, tenants = env
    bank = await _read(client, tenants, "stu-1", "Student", "question-bank")
    assert {q["id"] for q in bank} == {"q-1", "q-2"}
    assert all("correctAnswer" not in q for q in bank)


async def test_settings_hide_integrations_from_non_admins(env):
    client, tenants = env
    assert "integrations" not in await _read(client, tenants, "stu-1", "Student", "settings")
    assert "integrations" in await _read(client, tenants, "admin-1", "Admin", "settings")


async def test_bulk_read_is_scoped(env):
    client, tenants = env
    res = await client.get("/api/v1/data", headers=_auth(tenants["tenant-a"], "stu-1", "Student"))
    data = res.json()
    assert [p["id"] for p in data["payments"]] == ["pay-1"]
    assert all("correctAnswer" not in q for q in data["question-bank"])


async def test_patch_response_is_scoped(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    res = await client.patch("/api/v1/data/lesson-progress", json={"set": {"stu-1": {"c1": ["l1"]}}}, headers=headers)
    assert set(res.json()["data"]) == {"stu-1"}


async def test_guardian_sees_linked_child(env):
    client, tenants = env
    assert [p["id"] for p in await _read(client, tenants, "par-1", "Guardian", "payments")] == ["pay-1"]
    people = {p["id"]: p for p in await _read(client, tenants, "par-1", "Guardian", "people")}
    assert people["stu-1"]["email"] == "sam@example.com"
    assert "email" not in people["stu-2"]


async def test_instructor_reads_own_course_records(env):
    client, tenants = env
    assert [e["id"] for e in await _read(client, tenants, "ins-1", "Instructor", "enrollments")] == ["enr-1"]
    assert await _read(client, tenants, "ins-1", "Instructor", "student-submissions") == []
    assert await _read(client, tenants, "ins-1", "Instructor", "payments") == []


# ── Instructor write scope ──────────────────────────────────────────────────


async def test_instructor_only_changes_own_courses(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "ins-1", "Instructor")
    url = "/api/v1/data/live-sessions"
    own = {"id": "ls-1", "courseId": "c1", "instructorId": "ins-1", "title": "Updated"}
    assert (await client.patch(url, json={"upserts": [{"record": own}]}, headers=headers)).status_code == 200
    other = {"id": "ls-2", "courseId": "c2", "instructorId": "ins-2", "title": "Hijack"}
    assert (await client.patch(url, json={"upserts": [{"record": other}]}, headers=headers)).status_code == 403
    grade_other = {"id": "sub-2", "studentId": "stu-2", "assessmentType": "quiz", "assessmentId": "quiz-2", "score": 0}
    res = await client.patch(
        "/api/v1/data/student-submissions", json={"upserts": [{"record": grade_other}]}, headers=headers
    )
    assert res.status_code == 403


async def test_instructor_cannot_approve_own_course(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "ins-1", "Instructor")
    course = {"id": "c9", "title": "Mine", "submittedByInstructorId": "ins-1", "approvalStatus": "approved"}
    url = "/api/v1/data/courses"
    assert (await client.patch(url, json={"upserts": [{"record": course}]}, headers=headers)).status_code == 403
    pending = {**course, "approvalStatus": "pending"}
    assert (await client.patch(url, json={"upserts": [{"record": pending}]}, headers=headers)).status_code == 200


# ── Server-side grading ─────────────────────────────────────────────────────


async def test_quiz_attempt_is_graded_on_server(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    res = await client.post(
        "/api/v1/assessments/quizzes/quiz-1/attempts",
        json={"answers": {"q-1": "B", "q-2": "false"}},
        headers=headers,
    )
    assert res.status_code == 200
    assert (res.json()["score"], res.json()["max_score"]) == (5, 8)
    subs = await _read(client, tenants, "stu-1", "Student", "student-submissions")
    assert subs[0]["score"] == 5 and subs[0]["gradedBy"] == "system"

    not_enrolled = await client.post(
        "/api/v1/assessments/quizzes/quiz-2/attempts", json={"answers": {"q-3": "A"}}, headers=headers
    )
    assert not_enrolled.status_code == 403


# ── Payments ────────────────────────────────────────────────────────────────


async def test_checkout_demo_provider_and_ownership(env, monkeypatch):
    client, tenants = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", True)
    monkeypatch.setattr(settings, "CHAPA_SECRET_KEY", "")
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    other = await client.post("/api/v1/payments/invoices/pay-2/checkout", json={}, headers=headers)
    assert other.status_code == 404
    ok = await client.post("/api/v1/payments/invoices/pay-1/checkout", json={}, headers=headers)
    assert ok.status_code == 200
    assert ok.json()["invoice"]["status"] == "paid"


async def test_checkout_refused_without_provider(env, monkeypatch):
    client, tenants = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", False)
    monkeypatch.setattr(settings, "CHAPA_SECRET_KEY", "")
    res = await client.post(
        "/api/v1/payments/invoices/pay-1/checkout", json={}, headers=_auth(tenants["tenant-a"], "stu-1", "Student")
    )
    assert res.status_code == 503


async def test_student_cannot_mark_invoice_paid_directly(env):
    client, tenants = env
    record = {"id": "pay-1", "studentId": "stu-1", "amount": 100, "currency": "ETB", "status": "paid"}
    res = await client.patch(
        "/api/v1/data/payments",
        json={"upserts": [{"record": record}]},
        headers=_auth(tenants["tenant-a"], "stu-1", "Student"),
    )
    assert res.status_code == 403
