"""
Certificate templates and public verification.

Templates are designs every member needs in order to render their own
certificates, but only admins may change them. Verification is public so an
employer can scan the QR code without an account, and must never reveal a
certificate that has not been awarded.
"""
from __future__ import annotations

from app.modules.lms_store.models import LmsCollection
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)

TEMPLATE = {"id": "tpl-custom", "name": "Our design", "orientation": "landscape"}


async def _put(session_factory, tenant_id, key: str, data) -> None:
    async with session_factory() as db:
        db.add(LmsCollection(tenant_id=tenant_id, collection_key=key, data=data))
        await db.commit()


async def test_students_can_read_templates_but_not_change_them(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    admin = _auth(tenant, "admin-1", "Admin")
    student = _auth(tenant, "stu-1", "Student")

    saved = await client.patch(
        "/api/v1/data/certificate-templates",
        json={"upserts": [{"record": TEMPLATE}]},
        headers=admin,
    )
    assert saved.status_code == 200

    read = await client.get("/api/v1/data/certificate-templates", headers=student)
    assert read.status_code == 200
    assert read.json()["data"] == [TEMPLATE]

    edited = {**TEMPLATE, "name": "Hijacked"}
    denied = await client.patch(
        "/api/v1/data/certificate-templates",
        json={"upserts": [{"record": edited}]},
        headers=student,
    )
    assert denied.status_code == 403


async def test_verification_reports_issued_revoked_and_unknown(env):
    client, tenants = env
    await _put(
        tenants["_session_factory"],
        tenants["tenant-a"],
        "certificates",
        [
            {
                "certificateId": "BER-CERT-2026-00001",
                "studentName": "Selam Girma",
                "courseCode": "CS-101",
                "courseTitle": "Intro",
                "issueDate": "2026-01-10",
                "status": "issued",
            },
            {"certificateId": "BER-CERT-2026-00002", "studentName": "X", "status": "revoked", "revokedAt": "2026-02-01"},
            {"certificateId": "BER-CERT-2026-00003", "studentName": "Y", "status": "pending"},
            {
                "certificateId": "BER-CERT-2026-00004",
                "studentName": "Z",
                "status": "issued",
                "expirationDate": "2020-01-01",
            },
        ],
    )

    issued = (await client.get("/api/v1/public/certificates/ber-cert-2026-00001")).json()
    assert issued["found"] and issued["valid"]
    assert issued["student_name"] == "Selam Girma"
    # The institution's own display name (settings) wins over the tenant code.
    assert issued["institution_name"] == "A"

    revoked = (await client.get("/api/v1/public/certificates/BER-CERT-2026-00002")).json()
    assert revoked["found"] and not revoked["valid"] and revoked["status"] == "revoked"

    # Not awarded yet: indistinguishable from an unknown id.
    pending = (await client.get("/api/v1/public/certificates/BER-CERT-2026-00003")).json()
    assert pending == {**pending, "found": False, "student_name": None}

    expired = (await client.get("/api/v1/public/certificates/BER-CERT-2026-00004")).json()
    assert expired["found"] and expired["expired"] and not expired["valid"]

    unknown = (await client.get("/api/v1/public/certificates/NOPE-123")).json()
    assert unknown["found"] is False


# ── Automatic certificates ────────────────────────────────────────────────────

from sqlalchemy import select  # noqa: E402

COURSE = {
    "id": "c1",
    "code": "CS-101",
    "title": "Intro",
    "department": "CS",
    "instructorId": "ins-1",
    "modules": [{"id": "m1", "lessons": [{"id": "l1"}, {"id": "l2"}]}],
}


async def _replace(session_factory, tenant_id, key: str, data) -> None:
    async with session_factory() as db:
        row = (
            await db.execute(
                select(LmsCollection).where(LmsCollection.tenant_id == tenant_id, LmsCollection.collection_key == key)
            )
        ).scalar_one_or_none()
        if row is None:
            db.add(LmsCollection(tenant_id=tenant_id, collection_key=key, data=data))
        else:
            row.data = data
        await db.commit()


async def _setup(tenants, *, rules: dict, score: float, lessons: list[str]):
    sf, t = tenants["_session_factory"], tenants["tenant-a"]
    await _replace(sf, t, "courses", [COURSE])
    await _replace(sf, t, "assignments", [{"id": "asg-1", "courseId": "c1", "maxPoints": 100}])
    await _replace(sf, t, "quizzes", [])
    await _replace(
        sf,
        t,
        "student-submissions",
        [{"id": "s1", "studentId": "stu-1", "assessmentId": "asg-1", "status": "graded", "score": score, "maxScore": 100}],
    )
    await _replace(sf, t, "lesson-progress", {"stu-1": {"c1": lessons}})
    await _replace(sf, t, "settings", {"general": {"name": "A"}, "certificates": rules})
    await _replace(sf, t, "certificates", [])


async def test_student_passing_gets_a_pending_certificate_by_default(env):
    client, tenants = env
    await _setup(tenants, rules={}, score=80, lessons=[])
    res = await client.post(
        "/api/v1/certificates/auto-issue", json={}, headers=_auth(tenants["tenant-a"], "stu-1", "Student")
    )
    assert res.status_code == 200, res.text
    body = res.json()
    # Default rules: passed ≥ 50%, admin approval required.
    assert body["issued"] == [] and len(body["pending"]) == 1
    cert = body["records"][0]
    assert cert["studentId"] == "stu-1" and cert["status"] == "pending"
    assert cert["certificateId"].startswith("BER-CERT-") and len(cert["certificateId"]) == 23

    # Running again does not issue a duplicate.
    again = await client.post(
        "/api/v1/certificates/auto-issue", json={}, headers=_auth(tenants["tenant-a"], "stu-1", "Student")
    )
    assert again.json()["pending"] == []


async def test_rules_lessons_and_both(env):
    client, tenants = env
    admin = _auth(tenants["tenant-a"], "admin-1", "Admin")

    await _setup(tenants, rules={"rule": "both", "requireApproval": False}, score=90, lessons=["l1"])
    assert (await client.post("/api/v1/certificates/auto-issue", json={}, headers=admin)).json()["issued"] == []

    await _setup(tenants, rules={"rule": "both", "requireApproval": False}, score=90, lessons=["l1", "l2"])
    assert len((await client.post("/api/v1/certificates/auto-issue", json={}, headers=admin)).json()["issued"]) == 1

    await _setup(tenants, rules={"rule": "passed", "minPercent": 85, "requireApproval": False}, score=80, lessons=[])
    assert (await client.post("/api/v1/certificates/auto-issue", json={}, headers=admin)).json()["issued"] == []

    await _setup(tenants, rules={"autoIssue": False}, score=100, lessons=["l1", "l2"])
    assert (await client.post("/api/v1/certificates/auto-issue", json={}, headers=admin)).json()["records"] == []


async def test_a_student_cannot_trigger_someone_elses_certificate(env):
    client, tenants = env
    await _setup(tenants, rules={"requireApproval": False}, score=90, lessons=[])
    # stu-2 asks for stu-1: the request is narrowed to stu-2, who has nothing to earn.
    res = await client.post(
        "/api/v1/certificates/auto-issue",
        json={"student_id": "stu-1"},
        headers=_auth(tenants["tenant-a"], "stu-2", "Student"),
    )
    assert res.json()["records"] == []


async def test_revoked_certificates_are_not_reissued(env):
    client, tenants = env
    await _setup(tenants, rules={"requireApproval": False}, score=90, lessons=[])
    await _replace(
        tenants["_session_factory"],
        tenants["tenant-a"],
        "certificates",
        [{"id": "x", "certificateId": "OLD", "studentId": "stu-1", "courseId": "c1", "status": "revoked"}],
    )
    res = await client.post(
        "/api/v1/certificates/auto-issue", json={}, headers=_auth(tenants["tenant-a"], "admin-1", "Admin")
    )
    assert res.json()["records"] == []
