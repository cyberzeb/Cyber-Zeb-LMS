"""
Training Edition rules, as pure functions over collection data.

The flow is: a training program (a bundle of catalog courses with a price) runs
as cohorts (dated intakes with a seat limit and a trainer). A learner registers
for a cohort; a paid program creates an invoice and holds the seat for a few
days, and once the invoice is paid the learner is enrolled in every course of
the program. Trainers take attendance per cohort session, and the certificate
is issued for the whole program (see `certificates/auto_issue.py`).

Collections (camelCase fields, as the portal stores them):

* ``training-programs``    — id, code, name, courseIds, price, currency, minAttendance …
* ``cohorts``              — id, programId, name, startDate, endDate, seatCapacity,
                             trainerId, enrollmentOpen, registrationDeadline, price …
* ``cohort-registrations`` — id, cohortId, programId, studentId, status, invoiceId …
* ``cohort-attendance``    — id, cohortId, date, topic, marks {studentId: status}
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Iterable, Optional

Record = dict[str, Any]

# An unpaid registration keeps its seat this long.
HOLD_DAYS = 7
# A program with no attendance rule of its own.
DEFAULT_MIN_ATTENDANCE = 75

ACTIVE_REGISTRATION = ("pending_payment", "enrolled")
ATTENDED = ("present", "late")


def _parse(value: Any) -> Optional[date]:
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def records(data: Any) -> list[Record]:
    return [r for r in data if isinstance(r, dict)] if isinstance(data, list) else []


def by_id(data: Any) -> dict[str, Record]:
    return {str(r.get("id")): r for r in records(data) if r.get("id")}


def cohort_price(cohort: Record, program: Optional[Record]) -> float:
    """A cohort may override its program's price (an early-bird intake, say)."""
    for source in (cohort, program or {}):
        value = source.get("price")
        if value is None or value == "":
            continue
        try:
            return max(0.0, float(value))
        except (TypeError, ValueError):
            continue
    return 0.0


def cohort_currency(cohort: Record, program: Optional[Record]) -> str:
    return str(cohort.get("currency") or (program or {}).get("currency") or "ETB")


def cohort_state(cohort: Record, today: date) -> str:
    """upcoming / active / completed / cancelled — from the dates unless set by hand."""
    status = cohort.get("status")
    if status in ("cancelled", "completed"):
        return status
    start, end = _parse(cohort.get("startDate")), _parse(cohort.get("endDate"))
    if end and end < today:
        return "completed"
    if start and start <= today:
        return "active"
    return "upcoming"


def hold_expired(registration: Record, today: date) -> bool:
    if registration.get("status") != "pending_payment":
        return False
    created = _parse(registration.get("createdAt"))
    return bool(created and created + timedelta(days=HOLD_DAYS) < today)


def holds_seat(registration: Record, today: date) -> bool:
    return registration.get("status") in ACTIVE_REGISTRATION and not hold_expired(registration, today)


def seats_taken(cohort_id: str, registrations: Iterable[Record], today: date) -> int:
    return sum(1 for r in registrations if r.get("cohortId") == cohort_id and holds_seat(r, today))


def seats_left(cohort: Record, registrations: Iterable[Record], today: date) -> Optional[int]:
    """None means no seat limit."""
    try:
        capacity = int(cohort.get("seatCapacity") or 0)
    except (TypeError, ValueError):
        capacity = 0
    if capacity <= 0:
        return None
    return max(0, capacity - seats_taken(str(cohort.get("id")), registrations, today))


def registration_closed_reason(
    cohort: Optional[Record],
    program: Optional[Record],
    registrations: Iterable[Record],
    today: date,
) -> Optional[str]:
    """Why a learner cannot register for this cohort now, or None when they can."""
    if not cohort or not program:
        return "This cohort does not exist."
    if program.get("status") not in (None, "", "active"):
        return "This program is not open for registration."
    if not cohort.get("enrollmentOpen"):
        return "Registration for this cohort is closed."
    if cohort_state(cohort, today) in ("completed", "cancelled"):
        return "This cohort has already finished."
    deadline = _parse(cohort.get("registrationDeadline"))
    if deadline and deadline < today:
        return "The registration deadline for this cohort has passed."
    left = seats_left(cohort, registrations, today)
    if left is not None and left <= 0:
        return "This cohort is full."
    return None


def active_registration(
    registrations: Iterable[Record], cohort_id: str, student_id: str, today: date
) -> Optional[Record]:
    return next(
        (
            r
            for r in registrations
            if r.get("cohortId") == cohort_id and r.get("studentId") == student_id and holds_seat(r, today)
        ),
        None,
    )


def enrollment_rows(
    registration: Record,
    program: Record,
    cohort: Record,
    courses: dict[str, Record],
    existing: Iterable[Record],
    today: date,
) -> list[Record]:
    """One enrollment per program course, tagged with the cohort. Skips ones that exist."""
    have = {r.get("id") for r in existing}
    rows: list[Record] = []
    for course_id in program.get("courseIds") or []:
        course = courses.get(str(course_id))
        if not course:
            continue
        row_id = f"enr-{registration['id']}-{course_id}"
        if row_id in have:
            continue
        rows.append(
            {
                "id": row_id,
                "studentId": registration.get("studentId"),
                "studentName": registration.get("studentName", ""),
                "courseId": course_id,
                "courseCode": course.get("code", ""),
                "courseTitle": course.get("title", ""),
                "enrolledOn": today.isoformat(),
                "status": "active",
                "progress": 0,
                "cohortId": cohort.get("id"),
                "programId": program.get("id"),
                "registrationId": registration.get("id"),
            }
        )
    return rows


def invoice_for(registration: Record, program: Record, cohort: Record, amount: float, currency: str, today: date) -> Record:
    """The registration fee. Due within the seat hold, and never after the cohort starts."""
    due = today + timedelta(days=HOLD_DAYS)
    start = _parse(cohort.get("startDate"))
    if start and today <= start < due:
        due = start
    return {
        "id": f"inv-{registration['id']}",
        "studentId": registration.get("studentId"),
        "studentName": registration.get("studentName", ""),
        "label": f"{program.get('name', 'Training program')} — {cohort.get('name', '')}".strip(" —"),
        "amount": round(amount, 2),
        "currency": currency,
        "dueAt": due.isoformat(),
        "status": "pending",
        "category": "registration",
        "term": cohort.get("name", ""),
        "campusId": "c1",
        "registrationId": registration.get("id"),
        "cohortId": cohort.get("id"),
        "programId": program.get("id"),
        "createdAt": today.isoformat(),
    }


def attendance_rate(student_id: str, cohort_id: str, sessions: Iterable[Record]) -> Optional[int]:
    """Share of recorded sessions attended (late counts, excused is left out). None with no sessions."""
    attended = counted = 0
    for session in sessions:
        if session.get("cohortId") != cohort_id:
            continue
        mark = (session.get("marks") or {}).get(student_id)
        if not mark or mark == "excused":
            continue
        counted += 1
        attended += 1 if mark in ATTENDED else 0
    if counted == 0:
        return None
    return round(attended / counted * 100)


def min_attendance(program: Optional[Record]) -> int:
    try:
        value = int((program or {}).get("minAttendance", DEFAULT_MIN_ATTENDANCE))
    except (TypeError, ValueError):
        value = DEFAULT_MIN_ATTENDANCE
    return max(0, min(100, value))
