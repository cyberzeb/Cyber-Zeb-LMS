"""
Training reminders: what goes out on a given day, and never twice.
"""
from __future__ import annotations

from datetime import date

from app.modules.communication.notifications import plan_emails
from app.modules.communication.training_reminders import plan_manual_reminder, plan_reminders
from tests.modules.test_manager_scope import _setup
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)

TODAY = date(2026, 9, 25)
PEOPLE = [
    {"id": "e1", "name": "Due Soon", "email": "soon@x.com", "role": "Student", "teamId": "t1"},
    {"id": "e2", "name": "Late", "email": "late@x.com", "role": "Student", "teamId": "t1"},
    {"id": "e3", "name": "Renew", "email": "renew@x.com", "role": "Student", "jobRoleId": "jr", "teamId": "t2"},
    {"id": "m1", "name": "Mia", "email": "mia@x.com", "role": "Manager"},
]
DATA = {
    "people": PEOPLE,
    "teams": [{"id": "t1", "name": "AML", "managerId": "m1"}, {"id": "t2", "name": "Ops", "managerId": None}],
    "job-roles": [{"id": "jr", "requiredCourseIds": ["c9"], "recertificationMonths": 12}],
    "enrollments": [
        {"id": "a", "studentId": "e1", "courseTitle": "KYC", "dueDate": "2026-09-27", "progress": 10, "status": "active"},
        {"id": "b", "studentId": "e2", "courseTitle": "AML", "dueDate": "2026-09-01", "progress": 0, "status": "active"},
        {"id": "c", "studentId": "e3", "courseId": "c9", "courseTitle": "Safety", "progress": 100, "completedOn": "2025-10-10", "status": "active"},
        {"id": "d", "studentId": "e1", "courseTitle": "Far", "dueDate": "2026-12-01", "progress": 0, "status": "active"},
    ],
    "settings": {"general": {"name": "Horizon Bank"}},
}


def test_reminders_for_due_soon_overdue_renewal_and_manager():
    emails, updates = plan_reminders(DATA, {}, TODAY)
    subjects = sorted((e.to, e.subject.split(" — ")[0]) for e in emails)
    assert subjects == [
        ("late@x.com", "Overdue: AML"),
        ("mia@x.com", "AML: overdue training"),
        ("renew@x.com", "Certification renewal due: Safety"),
        ("soon@x.com", "Due in 2 days: KYC"),
    ]
    # Everything sent is logged, so the same day produces nothing new…
    again, _ = plan_reminders(DATA, updates, TODAY)
    assert again == []
    # A week later: overdue repeats weekly, and KYC (due 27 Sep) is now overdue too.
    week_later, _ = plan_reminders(DATA, updates, date(2026, 10, 2))
    assert sorted((e.to, e.subject.split(" — ")[0]) for e in week_later) == [
        ("late@x.com", "Overdue: AML"),
        ("mia@x.com", "AML: overdue training"),
        ("soon@x.com", "Overdue: KYC"),
    ]


def test_reminders_can_be_turned_off():
    off = {**DATA, "settings": {"notifications": {"reminders": False}}}
    assert plan_reminders(off, {}, TODAY) == ([], {})


def test_manual_reminder_lists_outstanding_training():
    mail = plan_manual_reminder(DATA, "e1", "Mia")
    assert mail and mail.to == "soon@x.com" and "KYC" in mail.body and "Far" in mail.body
    assert plan_manual_reminder(DATA, "e3", "Mia") is None  # nothing outstanding


def test_new_assignment_emails_the_employee():
    new = {"id": "n", "studentId": "e1", "courseTitle": "Fraud", "dueDate": "2026-10-30", "isMandatory": True, "status": "active"}
    emails = plan_emails("enrollments", [(None, new)], DATA)
    assert [e.to for e in emails] == ["soon@x.com"]
    assert "2026-10-30" in emails[0].body


async def test_only_admins_and_the_team_manager_can_remind(env):
    client, tenants = env
    await _setup(tenants)
    t = tenants["tenant-a"]
    student = await client.post("/api/v1/communication/remind", json={"employee_id": "stu-1"}, headers=_auth(t, "stu-2", "Student"))
    assert student.status_code == 403
    other_team = await client.post("/api/v1/communication/remind", json={"employee_id": "stu-2"}, headers=_auth(t, "mgr-1", "Manager"))
    assert other_team.status_code == 403
    own_team = await client.post("/api/v1/communication/remind", json={"employee_id": "stu-1"}, headers=_auth(t, "mgr-1", "Manager"))
    assert own_team.status_code == 200
