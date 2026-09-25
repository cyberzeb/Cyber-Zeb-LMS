"""
Who gets an email for which LMS event, and when nobody should.
"""
from __future__ import annotations

from app.modules.communication.notifications import changes_between, plan_emails

PEOPLE = [
    {"id": "stu-1", "name": "Sam Student", "email": "sam@example.com", "role": "Student", "status": "active"},
    {"id": "stu-2", "name": "Tia Student", "email": "tia@example.com", "role": "Student", "status": "active"},
    {"id": "stu-3", "name": "Off Student", "email": "off@example.com", "role": "Student", "status": "suspended"},
    {"id": "ins-1", "name": "Ian Instructor", "email": "ian@example.com", "role": "Instructor"},
    {"id": "par-1", "name": "Pat Parent", "email": "pat@example.com", "role": "Guardian", "linkedStudentIds": ["stu-1"]},
]


def _data(**extra):
    base = {
        "people": PEOPLE,
        "enrollments": [
            {"studentId": "stu-1", "courseId": "c1", "status": "active"},
            {"studentId": "stu-2", "courseId": "c1", "status": "withdrawn"},
            {"studentId": "stu-3", "courseId": "c1", "status": "active"},
        ],
        "assignments": [{"id": "asg-1", "title": "Essay", "courseId": "c1"}],
        "quizzes": [],
        "settings": {"general": {"name": "Test University"}},
    }
    base.update(extra)
    return base


def _to(emails):
    return sorted(e.to for e in emails)


def test_published_assignment_emails_active_enrolled_students_only():
    draft = {"id": "asg-1", "title": "Essay", "courseId": "c1", "status": "draft"}
    published = {**draft, "status": "published", "dueAt": "2026-10-01T09:00"}
    emails = plan_emails("assignments", [(draft, published)], _data())
    assert _to(emails) == ["sam@example.com"]
    assert "Essay" in emails[0].subject and "Test University" in emails[0].subject
    # Editing an already published assignment is not news.
    assert plan_emails("assignments", [(published, {**published, "title": "Essay v2"})], _data()) == []


def test_grade_goes_to_student_and_guardian():
    old = {"id": "s1", "studentId": "stu-1", "assessmentId": "asg-1", "status": "submitted"}
    new = {**old, "status": "graded", "score": 18, "maxScore": 20}
    emails = plan_emails("student-submissions", [(old, new)], _data())
    assert _to(emails) == ["pat@example.com", "sam@example.com"]
    assert any("18 / 20" in e.body for e in emails)


def test_personal_and_institution_switches_are_respected():
    old = {"id": "s1", "studentId": "stu-1", "assessmentId": "asg-1", "status": "submitted"}
    new = {**old, "status": "graded", "score": 1, "maxScore": 2}
    opted_out = _data(**{"student-settings": {"stu-1": {"notifications": {"grades": False}}}})
    assert _to(plan_emails("student-submissions", [(old, new)], opted_out)) == ["pat@example.com"]
    off = _data(settings={"notifications": {"grades": False}})
    assert plan_emails("student-submissions", [(old, new)], off) == []
    all_off = _data(settings={"notifications": {"email": False}})
    assert plan_emails("student-submissions", [(old, new)], all_off) == []


def test_announcement_by_role_skips_the_author():
    ann = {"id": "a1", "title": "Exam week", "body": "Good luck", "authorId": "ins-1", "targetRoles": ["Student", "Instructor"]}
    emails = plan_emails("announcements", [(None, ann)], _data())
    # Suspended students and the author get nothing.
    assert _to(emails) == ["sam@example.com", "tia@example.com"]


def test_issued_certificate_and_invoice():
    cert = {"id": "c", "certificateId": "BER-CERT-2026-AAAA-BBBB", "studentId": "stu-1", "courseCode": "CS-101", "courseTitle": "Intro", "status": "issued"}
    emails = plan_emails("certificates", [(None, cert)], _data())
    assert _to(emails) == ["pat@example.com", "sam@example.com"]
    assert any("/verify/BER-CERT-2026-AAAA-BBBB" in e.body for e in emails)
    # Pending certificates wait for approval: no email yet.
    assert plan_emails("certificates", [(None, {**cert, "status": "pending"})], _data()) == []

    invoice = {"id": "p1", "studentId": "stu-1", "label": "Tuition", "amount": 1000, "currency": "ETB", "status": "pending", "dueAt": "2026-11-01"}
    assert _to(plan_emails("payments", [(None, invoice)], _data())) == ["pat@example.com", "sam@example.com"]


def test_changes_between_reports_only_added_or_changed_records():
    before = [{"id": "a", "v": 1}, {"id": "b", "v": 1}]
    after = [{"id": "a", "v": 1}, {"id": "b", "v": 2}, {"id": "c", "v": 1}]
    assert changes_between(before, after) == [({"id": "b", "v": 1}, {"id": "b", "v": 2}), (None, {"id": "c", "v": 1})]
    assert changes_between(before, after, ids=["c"]) == [(None, {"id": "c", "v": 1})]
