"""
Security tests for the portal data store, portal login and Zoom endpoints.

Runs against a throwaway SQLite database (never the dev database) by overriding
`get_db`. Covers: authentication required, tenant taken from the token only,
role/ownership write policy, record-level PATCH, demo-login gating and OTP limits.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.common.audit  # noqa: F401  (register models on Base.metadata)
import app.modules.identity.models  # noqa: F401
import app.modules.onboarding.models  # noqa: F401
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app as fastapi_app
from app.modules.identity import otp_service
from app.modules.lms_store.models import LmsCollection
from app.modules.tenants.models import Tenant, TenantStatus, TenantType

PEOPLE = [
    {"id": "admin-1", "name": "Ada Admin", "email": "admin@example.com", "role": "Admin"},
    {"id": "stu-1", "name": "Sam Student", "email": "sam@example.com", "role": "Student"},
    {"id": "stu-2", "name": "Tia Student", "email": "tia@example.com", "role": "Student"},
    {"id": "ins-1", "name": "Ian Instructor", "email": "ian@example.com", "role": "Instructor"},
    {"id": "staff-1", "name": "Sue Staff", "email": "sue@example.com", "role": "Staff"},
    {"id": "ins-2", "name": "Ina Other", "email": "ina@example.com", "role": "Instructor"},
    {"id": "par-1", "name": "Pat Parent", "email": "pat@example.com", "role": "Guardian", "department": "Sam Student"},
]


@pytest_asyncio.fixture
async def env(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        tenants = {}
        for code in ("tenant-a", "tenant-b"):
            tenant = Tenant(
                code=code,
                name=code.upper(),
                tenant_type=TenantType.COLLEGE_UNIVERSITY,
                institution_type=TenantType.COLLEGE_UNIVERSITY,
                status=TenantStatus.ACTIVE,
                timezone="UTC",
                locale="en",
                currency="ETB",
                settings={},
                slug=code,
            )
            db.add(tenant)
            await db.flush()
            tenants[code] = tenant.id
        seed = {
            "people": PEOPLE,
            "student-submissions": [
                {"id": "sub-2", "studentId": "stu-2", "assessmentType": "quiz", "assessmentId": "quiz-2", "score": 5},
            ],
            "enrollments": [
                {"id": "enr-1", "studentId": "stu-1", "courseId": "c1", "progress": 0, "status": "active"},
                {"id": "enr-2", "studentId": "stu-2", "courseId": "c2", "progress": 0, "status": "active"},
            ],
            "courses": [
                {"id": "c1", "title": "Intro", "instructorId": "ins-1"},
                {"id": "c2", "title": "Next", "instructorId": "ins-2"},
            ],
            "quizzes": [
                {"id": "quiz-1", "courseId": "c1", "status": "published", "questionIds": ["q-1", "q-2"], "maxPoints": 8},
                {"id": "quiz-2", "courseId": "c2", "status": "published", "questionIds": ["q-3"], "maxPoints": 5},
            ],
            "assignments": [{"id": "asg-1", "courseId": "c1", "status": "published", "maxPoints": 100}],
            "question-bank": [
                {"id": "q-1", "courseId": "c1", "type": "mcq", "correctAnswer": "B", "points": 5, "options": ["A", "B"]},
                {"id": "q-2", "courseId": "c1", "type": "true-false", "correctAnswer": "True", "points": 3},
                {"id": "q-3", "courseId": "c2", "type": "mcq", "correctAnswer": "A", "points": 5},
            ],
            "live-sessions": [
                {"id": "ls-1", "courseId": "c1", "instructorId": "ins-1"},
                {"id": "ls-2", "courseId": "c2", "instructorId": "ins-2"},
            ],
            "payments": [
                {"id": "pay-1", "studentId": "stu-1", "amount": 100, "currency": "ETB", "status": "pending"},
                {"id": "pay-2", "studentId": "stu-2", "amount": 200, "currency": "ETB", "status": "pending"},
            ],
            "settings": {"general": {"name": "A"}, "integrations": {"stripe": {"key": "secret"}}},
            "lesson-progress": {},
        }
        for key, data in seed.items():
            db.add(LmsCollection(tenant_id=tenants["tenant-a"], collection_key=key, data=data))
        db.add(LmsCollection(tenant_id=tenants["tenant-b"], collection_key="people", data=[{"id": "b-secret"}]))
        from app.core.security import hash_password
        from app.modules.onboarding.models import InstitutionAdminAccount, PlatformAdminRole, PlatformAdminUser

        root = PlatformAdminUser(
            email="root@example.com", password_hash=hash_password("unused"), role=PlatformAdminRole.SUPER_ADMIN
        )
        db.add(root)
        db.add(
            InstitutionAdminAccount(
                tenant_id=tenants["tenant-a"],
                email="owner@example.com",
                temporary_password_hash=hash_password("111111"),
                must_change_password=False,
            )
        )
        await db.flush()
        tenants["_platform_admin"] = root.id
        await db.commit()

    async def override_get_db():
        async with Session() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, tenants
    fastapi_app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


def _auth(tenant_id, person_id: str, frontend_role: str) -> dict[str, str]:
    from app.core.demo_auth import map_frontend_role

    token = create_access_token(
        subject=person_id,
        extra_claims={
            "tenant_id": str(tenant_id),
            "role": map_frontend_role(frontend_role).value,
            "frontend_role": frontend_role,
        },
    )
    return {"Authorization": f"Bearer {token}"}


# ── Authentication and tenant isolation ─────────────────────────────────────


async def test_data_requires_token_even_with_tenant_header(env):
    client, _ = env
    assert (await client.get("/api/v1/data")).status_code == 401
    assert (await client.get("/api/v1/data", headers={"X-Tenant-Code": "tenant-a"})).status_code == 401
    bad = {"Authorization": "Bearer not-a-jwt"}
    assert (await client.get("/api/v1/data/people", headers=bad)).status_code == 401


async def test_tenant_comes_from_token_not_header(env):
    client, tenants = env
    headers = {**_auth(tenants["tenant-a"], "stu-1", "Student"), "X-Tenant-Code": "tenant-b"}
    res = await client.get("/api/v1/data/people", headers=headers)
    assert res.status_code == 200
    assert {p["id"] for p in res.json()["data"]} == {p["id"] for p in PEOPLE}


async def test_unknown_tenant_code_is_not_auto_created(env):
    client, _ = env
    res = await client.get("/api/v1/data/bootstrap", params={"tenant_code": "made-up"})
    assert res.status_code == 404


async def test_bootstrap_exposes_no_people(env):
    client, _ = env
    res = await client.get("/api/v1/data/bootstrap", params={"tenant_code": "tenant-a"})
    assert res.status_code == 200
    assert "people" not in res.json()


async def test_seed_requires_super_admin(env):
    client, tenants = env
    res = await client.post(
        "/api/v1/data/seed",
        params={"tenant_code": "tenant-a"},
        json={"collections": {}},
        headers=_auth(tenants["tenant-a"], "admin-1", "Admin"),
    )
    assert res.status_code in (401, 403)


# ── Write policy ────────────────────────────────────────────────────────────


async def test_only_admin_can_replace_collection(env):
    client, tenants = env
    body = {"data": [{"id": "x"}]}
    student = await client.put(
        "/api/v1/data/people", json=body, headers=_auth(tenants["tenant-a"], "stu-1", "Student")
    )
    assert student.status_code == 403
    admin = await client.put(
        "/api/v1/data/courses", json=body, headers=_auth(tenants["tenant-a"], "admin-1", "Admin")
    )
    assert admin.status_code == 200


async def test_student_cannot_edit_people(env):
    client, tenants = env
    res = await client.patch(
        "/api/v1/data/people",
        json={"upserts": [{"record": {**PEOPLE[1], "role": "Admin"}}]},
        headers=_auth(tenants["tenant-a"], "stu-1", "Student"),
    )
    assert res.status_code == 403


async def test_student_cannot_write_quiz_scores(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    forged = {
        "id": "sub-1", "studentId": "stu-1", "assessmentType": "quiz",
        "assessmentId": "quiz-1", "status": "graded", "score": 8,
    }
    res = await client.patch(
        "/api/v1/data/student-submissions", json={"upserts": [{"record": forged}]}, headers=headers
    )
    assert res.status_code == 403


async def test_student_can_submit_own_assignment_without_score(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    url = "/api/v1/data/student-submissions"
    base = {
        "id": "sub-a", "studentId": "stu-1", "assessmentType": "assignment", "assessmentId": "asg-1",
        "status": "submitted", "attachmentName": "work.py", "maxScore": 100,
    }
    assert (await client.patch(url, json={"upserts": [{"record": base}]}, headers=headers)).status_code == 200
    graded = {**base, "score": 100, "status": "graded"}
    assert (await client.patch(url, json={"upserts": [{"record": graded}]}, headers=headers)).status_code == 403
    other = {**base, "id": "sub-b", "studentId": "stu-2"}
    assert (await client.patch(url, json={"upserts": [{"record": other}]}, headers=headers)).status_code == 403


async def test_student_enrollment_only_progress(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    base = {"id": "enr-1", "studentId": "stu-1", "courseId": "c1", "progress": 0, "status": "active"}
    ok = await client.patch(
        "/api/v1/data/enrollments", json={"upserts": [{"record": {**base, "progress": 40}}]}, headers=headers
    )
    assert ok.status_code == 200
    denied = await client.patch(
        "/api/v1/data/enrollments",
        json={"upserts": [{"record": {**base, "progress": 40, "status": "completed"}}]},
        headers=headers,
    )
    assert denied.status_code == 403


async def test_keyed_collection_only_own_entry(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "stu-1", "Student")
    ok = await client.patch("/api/v1/data/lesson-progress", json={"set": {"stu-1": {"c1": ["l1"]}}}, headers=headers)
    assert ok.status_code == 200
    denied = await client.patch("/api/v1/data/lesson-progress", json={"set": {"stu-2": {}}}, headers=headers)
    assert denied.status_code == 403


async def test_staff_can_only_submit_pending_people(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "staff-1", "Staff")
    pending = {"id": "new-1", "role": "Student", "verificationStatus": "pending", "submittedById": "staff-1"}
    assert (
        await client.patch("/api/v1/data/people", json={"upserts": [{"record": pending}]}, headers=headers)
    ).status_code == 200
    verified = {**pending, "id": "new-2", "verificationStatus": "verified"}
    assert (
        await client.patch("/api/v1/data/people", json={"upserts": [{"record": verified}]}, headers=headers)
    ).status_code == 403


async def test_patch_keeps_other_records_and_positions_new_ones(env):
    client, tenants = env
    headers = _auth(tenants["tenant-a"], "admin-1", "Admin")
    first = await client.patch(
        "/api/v1/data/courses", json={"upserts": [{"record": {"id": "c0"}, "after": None}]}, headers=headers
    )
    assert [c["id"] for c in first.json()["data"]] == ["c0", "c1", "c2"]
    middle = await client.patch(
        "/api/v1/data/courses",
        json={"upserts": [{"record": {"id": "c1b"}, "after": "c1"}], "deletes": ["c0"]},
        headers=headers,
    )
    assert [c["id"] for c in middle.json()["data"]] == ["c1", "c1b", "c2"]


# ── Zoom ────────────────────────────────────────────────────────────────────


async def test_zoom_meetings_require_instructor(env):
    client, tenants = env
    body = {"topic": "t", "start_at": "2026-01-01T10:00:00Z", "duration_minutes": 30}
    assert (await client.post("/api/v1/live-sessions/zoom/meetings", json=body)).status_code == 401
    student = await client.post(
        "/api/v1/live-sessions/zoom/meetings", json=body, headers=_auth(tenants["tenant-a"], "stu-1", "Student")
    )
    assert student.status_code == 403


# ── Login ───────────────────────────────────────────────────────────────────


async def test_demo_login_disabled_by_default(env, monkeypatch):
    client, _ = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", False)
    res = await client.post("/api/v1/auth/demo-login", json={"person_id": "admin-1", "tenant_code": "tenant-a"})
    assert res.status_code == 404


async def test_otp_is_random_emailed_and_attempt_limited(env, monkeypatch):
    client, _ = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", False)
    monkeypatch.setattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 0)
    otp_service._challenges.clear()
    sent: list[str] = []

    def fake_send(*, to_email, subject, body, html_body=None):
        sent.append(body)
        from app.modules.onboarding.email_service import EmailSendResult

        return EmailSendResult(ok=True, body=body, subject=subject, to_email=to_email)

    monkeypatch.setattr("app.modules.onboarding.email_service.send_email_sync", fake_send)
    login = {"email": "sam@example.com", "role": "Student", "tenant_code": "tenant-a"}

    res = await client.post("/api/v1/auth/otp/send", json=login)
    assert res.status_code == 200
    assert res.json().get("demo_code") is None
    assert len(sent) == 1

    for _ in range(settings.OTP_MAX_ATTEMPTS):
        bad = await client.post("/api/v1/auth/otp/verify", json={**login, "code": "000000"})
        assert bad.status_code == 422
    # Challenge is gone after too many attempts, even with the right code.
    code = next(word for word in sent[0].split() if word.isdigit() and len(word) == 6)
    res = await client.post("/api/v1/auth/otp/verify", json={**login, "code": code})
    assert res.status_code == 422

    await client.post("/api/v1/auth/otp/send", json=login)
    code = next(word for word in sent[-1].split() if word.isdigit() and len(word) == 6)
    res = await client.post("/api/v1/auth/otp/verify", json={**login, "code": code})
    assert res.status_code == 200
    assert res.json()["person_id"] == "stu-1"


async def test_super_admin_otp_is_emailed_even_on_a_demo_server(env, monkeypatch):
    """The platform console never accepts the fixed demo code (SUPER_ADMIN_OTP_REQUIRE_EMAIL)."""
    client, _ = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", True)
    monkeypatch.setattr(settings, "SUPER_ADMIN_OTP_REQUIRE_EMAIL", True)
    monkeypatch.setattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 0)
    otp_service._challenges.clear()
    sent: list[str] = []

    def fake_send(*, to_email, subject, body, html_body=None):
        sent.append(body)
        from app.modules.onboarding.email_service import EmailSendResult

        return EmailSendResult(ok=True, body=body, subject=subject, to_email=to_email)

    monkeypatch.setattr("app.modules.onboarding.email_service.send_email_sync", fake_send)

    login = {"email": "root@example.com", "role": "SuperAdmin", "tenant_code": "tenant-a"}
    res = await client.post("/api/v1/auth/otp/send", json=login)
    assert res.status_code == 200
    # No code is echoed back to the browser, and one was actually emailed.
    assert res.json().get("demo_code") is None
    assert len(sent) == 1

    code = next(word for word in sent[0].split() if word.isdigit() and len(word) == 6)
    assert code != otp_service.DEMO_OTP_CODE

    bad = await client.post("/api/v1/auth/otp/verify", json={**login, "code": otp_service.DEMO_OTP_CODE})
    assert bad.status_code == 422

    ok = await client.post("/api/v1/auth/otp/verify", json={**login, "code": code})
    assert ok.status_code == 200
    assert ok.json()["frontend_role"] == "SuperAdmin"

    # Tenant portal logins keep the demo shortcut on the same server.
    student = await client.post(
        "/api/v1/auth/otp/send",
        json={"email": "sam@example.com", "role": "Student", "tenant_code": "tenant-a"},
    )
    assert student.json()["demo_code"] == otp_service.DEMO_OTP_CODE


async def test_super_admin_otp_send_fails_loudly_when_email_is_down(env, monkeypatch):
    """A failed send must not leave a challenge behind, or the retry hits the cooldown."""
    client, _ = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", True)
    monkeypatch.setattr(settings, "SUPER_ADMIN_OTP_REQUIRE_EMAIL", True)
    monkeypatch.setattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 300)
    otp_service._challenges.clear()

    def failing_send(*, to_email, subject, body, html_body=None):
        from app.modules.onboarding.email_service import EmailSendResult

        return EmailSendResult(
            ok=False, body=body, subject=subject, to_email=to_email, error_message="boom"
        )

    monkeypatch.setattr("app.modules.onboarding.email_service.send_email_sync", failing_send)

    login = {"email": "root@example.com", "role": "SuperAdmin", "tenant_code": "tenant-a"}
    first = await client.post("/api/v1/auth/otp/send", json=login)
    assert first.status_code == 422
    assert "could not send" in first.json()["error"]["message"].lower()

    # Retrying reports the same mail failure, not "please wait N seconds".
    second = await client.post("/api/v1/auth/otp/send", json=login)
    assert second.status_code == 422
    assert "wait" not in second.json()["error"]["message"].lower()


async def test_portal_refresh_rechecks_account(env):
    client, tenants = env
    _, refresh = otp_service.issue_portal_tokens("stu-1", str(tenants["tenant-a"]), "Student")
    ok = await client.post("/api/v1/auth/portal/refresh", json={"refresh_token": refresh})
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    # An access token cannot be used as a refresh token.
    access, _ = otp_service.issue_portal_tokens("stu-1", str(tenants["tenant-a"]), "Student")
    assert (await client.post("/api/v1/auth/portal/refresh", json={"refresh_token": access})).status_code == 422

    # A suspended person can no longer renew their session.
    admin = _auth(tenants["tenant-a"], "admin-1", "Admin")
    suspended = {**PEOPLE[1], "status": "suspended"}
    await client.patch("/api/v1/data/people", json={"upserts": [{"record": suspended}]}, headers=admin)
    denied = await client.post("/api/v1/auth/portal/refresh", json={"refresh_token": refresh})
    assert denied.status_code == 422
