"""
Training Edition: public registration → payment → cohort enrollment → attendance
→ program certificate, and who may see and change cohort data.
"""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select

from app.core.config import settings
from app.modules.certificates.auto_issue import Rules, evaluate_training
from app.modules.onboarding.institution_types import InstitutionType
from app.modules.tenants.models import Tenant
from app.modules.training import logic
from tests.modules.test_certificates import _replace
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)

TODAY = date.today()


def _d(days: int) -> str:
    return (TODAY + timedelta(days=days)).isoformat()


PROGRAM = {
    "id": "prg-1",
    "code": "PMP",
    "name": "Project Management",
    "courseIds": ["c1", "c2"],
    "price": 5000,
    "currency": "ETB",
    "minAttendance": 75,
    "status": "active",
}
FREE_PROGRAM = {**PROGRAM, "id": "prg-free", "code": "FREE", "name": "Open Day", "courseIds": ["c1"], "price": 0}
COHORT = {
    "id": "coh-1",
    "programId": "prg-1",
    "name": "October intake",
    "startDate": _d(10),
    "endDate": _d(60),
    "seatCapacity": 2,
    "trainerId": "ins-2",
    "enrollmentOpen": True,
}


async def _make_training(tenants) -> None:
    sf, t = tenants["_session_factory"], tenants["tenant-a"]
    async with sf() as db:
        tenant = (await db.execute(select(Tenant).where(Tenant.id == t))).scalar_one()
        tenant.institution_type = InstitutionType.TRAINING
        await db.commit()
    await _replace(sf, t, "training-programs", [PROGRAM, FREE_PROGRAM])
    await _replace(
        sf,
        t,
        "cohorts",
        [
            COHORT,
            {**COHORT, "id": "coh-free", "programId": "prg-free", "name": "Open day"},
            {**COHORT, "id": "coh-closed", "name": "Closed", "enrollmentOpen": False},
        ],
    )
    await _replace(sf, t, "cohort-registrations", [])
    await _replace(sf, t, "cohort-attendance", [])


async def _register(client, cohort="coh-1", email="new@learner.et", name="New Learner"):
    return await client.post(
        "/api/v1/public/training/tenant-a/register",
        json={"cohort_id": cohort, "name": name, "email": email, "phone": "0911"},
    )


# ── Pure rules ───────────────────────────────────────────────────────────────


def test_attendance_rate_counts_late_and_skips_excused():
    sessions = [
        {"cohortId": "c", "marks": {"s": "present"}},
        {"cohortId": "c", "marks": {"s": "late"}},
        {"cohortId": "c", "marks": {"s": "absent"}},
        {"cohortId": "c", "marks": {"s": "excused"}},
        {"cohortId": "other", "marks": {"s": "absent"}},
    ]
    assert logic.attendance_rate("s", "c", sessions) == 67
    assert logic.attendance_rate("nobody", "c", sessions) is None


def test_unpaid_hold_expires_and_frees_the_seat():
    old = {"cohortId": "coh-1", "status": "pending_payment", "createdAt": _d(-logic.HOLD_DAYS - 1)}
    fresh = {"cohortId": "coh-1", "status": "pending_payment", "createdAt": _d(0)}
    assert logic.seats_left(COHORT, [old, fresh], TODAY) == 1


# ── Registration and payment ─────────────────────────────────────────────────


async def test_public_catalog_lists_open_cohorts_without_personal_data(env):
    client, tenants = env
    await _make_training(tenants)
    res = await client.get("/api/v1/public/training/tenant-a/catalog")
    assert res.status_code == 200, res.text
    body = res.json()
    program = next(p for p in body["programs"] if p["id"] == "prg-1")
    cohorts = {c["id"]: c for c in program["cohorts"]}
    assert cohorts["coh-1"]["open"] and cohorts["coh-1"]["seatsLeft"] == 2
    assert not cohorts["coh-closed"]["open"]
    assert cohorts["coh-1"]["trainerName"] == "Ina Other"
    assert "email" not in res.text


async def test_university_tenant_has_no_public_registration(env):
    client, _ = env
    assert (await client.get("/api/v1/public/training/tenant-a/catalog")).status_code == 404


async def test_paid_registration_holds_seat_until_paid_then_enrolls(env, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", True)
    monkeypatch.setattr(settings, "CHAPA_SECRET_KEY", "")
    client, tenants = env
    await _make_training(tenants)
    t = tenants["tenant-a"]
    admin = _auth(t, "admin-1", "Admin")

    res = await _register(client)
    assert res.status_code == 200, res.text
    reg = res.json()
    assert reg["status"] == "pending_payment" and reg["amount"] == 5000

    people = (await client.get("/api/v1/data/people", headers=admin)).json()["data"]
    learner = next(p for p in people if p["email"] == "new@learner.et")
    assert learner["role"] == "Student"
    invoices = (await client.get("/api/v1/data/payments", headers=admin)).json()["data"]
    invoice = next(i for i in invoices if i.get("registrationId") == reg["registrationId"])
    enrollments = (await client.get("/api/v1/data/enrollments", headers=admin)).json()["data"]
    assert not [e for e in enrollments if e["studentId"] == learner["id"]]

    # Registering again returns the same seat rather than a second invoice.
    again = await _register(client)
    assert again.json()["alreadyRegistered"] and again.json()["registrationId"] == reg["registrationId"]

    # The learner signs in and pays; the seat is confirmed and they are enrolled.
    learner_auth = _auth(t, learner["id"], "Student")
    paid = await client.post(f"/api/v1/payments/invoices/{invoice['id']}/checkout", json={}, headers=learner_auth)
    assert paid.status_code == 200, paid.text
    enrollments = (await client.get("/api/v1/data/enrollments", headers=admin)).json()["data"]
    mine = [e for e in enrollments if e["studentId"] == learner["id"]]
    assert {e["courseId"] for e in mine} == {"c1", "c2"}
    assert all(e["cohortId"] == "coh-1" for e in mine)
    regs = (await client.get("/api/v1/data/cohort-registrations", headers=learner_auth)).json()["data"]
    assert [r["status"] for r in regs] == ["enrolled"]


async def test_free_program_enrolls_at_once(env):
    client, tenants = env
    await _make_training(tenants)
    res = await _register(client, cohort="coh-free")
    assert res.json()["status"] == "enrolled"


async def test_closed_and_full_cohorts_refuse_registration(env):
    client, tenants = env
    await _make_training(tenants)
    closed = await _register(client, cohort="coh-closed")
    assert closed.status_code == 422 and "closed" in closed.json()["error"]["message"].lower()
    assert (await _register(client, email="a@x.et")).status_code == 200
    assert (await _register(client, email="b@x.et")).status_code == 200
    full = await _register(client, email="c@x.et")
    assert full.status_code == 422 and "full" in full.json()["error"]["message"].lower()


async def test_staff_email_cannot_register_as_learner(env):
    client, tenants = env
    await _make_training(tenants)
    res = await _register(client, email="ian@example.com", name="Ian")
    assert res.status_code == 409


async def test_admin_enroll_without_charge_and_cancel(env):
    client, tenants = env
    await _make_training(tenants)
    t = tenants["tenant-a"]
    admin = _auth(t, "admin-1", "Admin")
    res = await client.post(
        "/api/v1/training/cohorts/coh-closed/enroll", json={"student_ids": ["stu-1"], "charge": False}, headers=admin
    )
    assert res.status_code == 200, res.text
    reg = res.json()["results"][0]
    assert reg["status"] == "enrolled"

    # Learners and trainers cannot enroll people.
    student = _auth(t, "stu-2", "Student")
    denied = await client.post("/api/v1/training/cohorts/coh-1/enroll", json={"student_ids": ["stu-2"]}, headers=student)
    assert denied.status_code == 403

    # A learner cannot cancel an enrolled seat themselves; an admin can.
    own = _auth(t, "stu-1", "Student")
    assert (await client.post(f"/api/v1/training/registrations/{reg['registrationId']}/cancel", json={}, headers=own)).status_code == 403
    ok = await client.post(f"/api/v1/training/registrations/{reg['registrationId']}/cancel", json={}, headers=admin)
    assert ok.status_code == 200 and ok.json()["status"] == "cancelled"
    enrollments = (await client.get("/api/v1/data/enrollments", headers=admin)).json()["data"]
    assert all(e["status"] == "withdrawn" for e in enrollments if e.get("registrationId") == reg["registrationId"])


async def test_admin_marks_invoice_paid_and_learner_is_enrolled(env):
    client, tenants = env
    await _make_training(tenants)
    t = tenants["tenant-a"]
    admin = _auth(t, "admin-1", "Admin")
    reg = (await _register(client)).json()
    res = await client.post(f"/api/v1/training/registrations/{reg['registrationId']}/confirm", json={}, headers=admin)
    assert res.status_code == 200 and res.json()["status"] == "enrolled"
    invoices = (await client.get("/api/v1/data/payments", headers=admin)).json()["data"]
    assert next(i for i in invoices if i.get("registrationId") == reg["registrationId"])["status"] == "paid"


# ── Scoping ──────────────────────────────────────────────────────────────────


async def test_trainer_takes_attendance_only_for_their_cohort(env):
    client, tenants = env
    await _make_training(tenants)
    t = tenants["tenant-a"]
    admin = _auth(t, "admin-1", "Admin")
    await client.post("/api/v1/training/cohorts/coh-1/enroll", json={"student_ids": ["stu-1"], "charge": False}, headers=admin)

    trainer = _auth(t, "ins-2", "Instructor")
    session = {"id": "att-1", "cohortId": "coh-1", "date": _d(0), "marks": {"stu-1": "present"}}
    res = await client.patch("/api/v1/data/cohort-attendance", json={"upserts": [{"record": session}]}, headers=trainer)
    assert res.status_code == 200, res.text

    other = _auth(t, "ins-1", "Instructor")
    res = await client.patch(
        "/api/v1/data/cohort-attendance",
        json={"upserts": [{"record": {**session, "id": "att-2"}}]},
        headers=other,
    )
    assert res.status_code == 403

    # The trainer now sees the learner's full record and the program's courses.
    people = (await client.get("/api/v1/data/people", headers=trainer)).json()["data"]
    assert "email" in next(p for p in people if p["id"] == "stu-1")


async def test_learner_sees_only_their_own_attendance_mark(env):
    client, tenants = env
    await _make_training(tenants)
    t = tenants["tenant-a"]
    admin = _auth(t, "admin-1", "Admin")
    await client.post(
        "/api/v1/training/cohorts/coh-1/enroll", json={"student_ids": ["stu-1", "stu-2"], "charge": False}, headers=admin
    )
    session = {"id": "att-1", "cohortId": "coh-1", "date": _d(0), "marks": {"stu-1": "present", "stu-2": "absent"}}
    await client.patch("/api/v1/data/cohort-attendance", json={"upserts": [{"record": session}]}, headers=admin)
    mine = (await client.get("/api/v1/data/cohort-attendance", headers=_auth(t, "stu-1", "Student"))).json()["data"]
    assert mine[0]["marks"] == {"stu-1": "present"}
    regs = (await client.get("/api/v1/data/cohort-registrations", headers=_auth(t, "stu-1", "Student"))).json()["data"]
    assert {r["studentId"] for r in regs} == {"stu-1"}


# ── Program certificate ──────────────────────────────────────────────────────


def _cert_data(progress: int, marks: list[str]) -> dict:
    return {
        "people": [{"id": "s", "name": "Sam", "role": "Student"}, {"id": "t", "name": "Tess", "role": "Instructor"}],
        "courses": [{"id": "c1", "title": "A"}, {"id": "c2", "title": "B"}],
        "training-programs": [PROGRAM],
        "cohorts": [{**COHORT, "trainerId": "t"}],
        "cohort-registrations": [{"id": "r", "cohortId": "coh-1", "programId": "prg-1", "studentId": "s", "status": "enrolled"}],
        "enrollments": [
            {"id": "e1", "studentId": "s", "courseId": "c1", "cohortId": "coh-1", "progress": 100, "completedOn": _d(-2)},
            {"id": "e2", "studentId": "s", "courseId": "c2", "cohortId": "coh-1", "progress": progress},
        ],
        "cohort-attendance": [{"id": f"a{i}", "cohortId": "coh-1", "marks": {"s": m}} for i, m in enumerate(marks)],
    }


def test_program_certificate_needs_every_course_and_attendance():
    rules = Rules.from_settings({}, edition="training")
    assert rules.rule == "both" and not rules.require_approval

    assert evaluate_training(_cert_data(60, ["present"] * 4), rules) == []
    assert evaluate_training(_cert_data(100, ["present", "absent", "absent", "absent"]), rules) == []

    [cert] = evaluate_training(_cert_data(100, ["present", "present", "late", "absent"]), rules)
    assert cert["programId"] == "prg-1" and cert["courseTitle"] == "Project Management"
    assert cert["instructorName"] == "Tess" and cert["attendancePercent"] == 75
    assert cert["status"] == "issued"

    # Issued once per program.
    data = _cert_data(100, ["present"])
    data["certificates"] = [cert]
    assert evaluate_training(data, rules) == []
