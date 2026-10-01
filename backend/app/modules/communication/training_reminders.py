"""
Training reminders (Corporate Edition, but any tenant with due dates benefits).

Once a day the API looks at every assignment with a due date and emails:

* the employee, three days before it is due ("due-soon");
* the employee, when it becomes overdue and then weekly while it stays overdue;
* the employee, when a certification is within 30 days of needing renewal;
* each team manager, weekly, a summary of their team's overdue training.

A small log (`reminder-log`, keyed by assignment or manager) records what was
sent, so nobody is reminded twice for the same thing.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import date, timedelta
from typing import Any, Optional

from app.modules.communication.notifications import (
    CONTEXT_KEYS,
    Email,
    _institution,
    _link,
    _render,
    event_enabled,
)

logger = logging.getLogger(__name__)

Record = dict[str, Any]
LOG_KEY = "reminder-log"
DUE_SOON_DAYS = 3
REPEAT_DAYS = 7
RECERT_WINDOW_DAYS = 30


def _parse(value: Any) -> Optional[date]:
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def _add_months(start: date, months: int) -> date:
    from app.modules.certificates.auto_issue import add_months

    return add_months(start, months)


def _email(person: Record, subject: str, heading: str, lines: list[str], cta: tuple[str, str], institution: str) -> Optional[Email]:
    to = str(person.get("email") or "").strip().lower()
    if not to or person.get("status") == "suspended":
        return None
    body, page = _render(institution, heading, lines, cta)
    return Email(to=to, subject=f"{subject} — {institution}", body=body, html=page)


def _sent_recently(log: dict, key: str, kind: str, today: date, every_days: Optional[int]) -> bool:
    last = _parse((log.get(key) or {}).get(kind))
    if last is None:
        return False
    if every_days is None:
        return True  # once only
    return (today - last).days < every_days


def plan_reminders(data: dict[str, Any], log: dict, today: date) -> tuple[list[Email], dict[str, dict]]:
    """Emails to send today and the log entries to record. Pure: no I/O."""
    if not event_enabled(data, "reminders"):
        return [], {}
    institution = _institution(data)
    people = {p["id"]: p for p in data.get("people") or [] if isinstance(p, dict) and p.get("id")}
    courses = {c.get("id"): c for c in data.get("courses") or [] if isinstance(c, dict)}
    roles = {r.get("id"): r for r in data.get("job-roles") or [] if isinstance(r, dict)}
    teams = [t for t in data.get("teams") or [] if isinstance(t, dict)]

    emails: list[Email] = []
    updates: dict[str, dict] = {}
    overdue_by_employee: dict[str, list[str]] = {}

    def mark(key: str, kind: str) -> None:
        updates.setdefault(key, dict(log.get(key) or {}))[kind] = today.isoformat()

    for e in data.get("enrollments") or []:
        if not isinstance(e, dict) or e.get("status") == "withdrawn" or not e.get("id"):
            continue
        person = people.get(e.get("studentId"))
        if not person:
            continue
        title = e.get("courseTitle") or (courses.get(e.get("courseId")) or {}).get("title") or "Training"
        complete = float(e.get("progress") or 0) >= 100
        due = _parse(e.get("dueDate"))
        key = str(e["id"])

        if not complete and due:
            days = (due - today).days
            if 0 <= days <= DUE_SOON_DAYS and not _sent_recently(log, key, "due-soon", today, None):
                mail = _email(
                    person,
                    f"Due in {days} day{'s' if days != 1 else ''}: {title}",
                    f"“{title}” is due {'today' if days == 0 else f'in {days} day' + ('s' if days != 1 else '')}",
                    [f"Please complete it by {due.isoformat()}."],
                    ("Continue training", _link("/student/courses")),
                    institution,
                )
                if mail:
                    emails.append(mail)
                    mark(key, "due-soon")
            elif days < 0:
                overdue_by_employee.setdefault(person["id"], []).append(f"{title} (due {due.isoformat()})")
                if not _sent_recently(log, key, "overdue", today, REPEAT_DAYS):
                    mail = _email(
                        person,
                        f"Overdue: {title}",
                        f"“{title}” is overdue",
                        [f"It was due {due.isoformat()} ({-days} day{'s' if days != -1 else ''} ago). Please complete it as soon as you can."],
                        ("Continue training", _link("/student/courses")),
                        institution,
                    )
                    if mail:
                        emails.append(mail)
                        mark(key, "overdue")

        if complete:
            role = roles.get(person.get("jobRoleId"))
            months = int((role or {}).get("recertificationMonths") or 0)
            finished = _parse(e.get("completedOn")) or _parse(e.get("enrolledOn"))
            if months > 0 and finished and e.get("courseId") in ((role or {}).get("requiredCourseIds") or []):
                expires = _add_months(finished, months)
                if 0 <= (expires - today).days <= RECERT_WINDOW_DAYS and not _sent_recently(log, key, "recert", today, None):
                    mail = _email(
                        person,
                        f"Certification renewal due: {title}",
                        f"Your “{title}” certification expires soon",
                        [f"It expires on {expires.isoformat()}. Your learning admin will assign the renewal training."],
                        ("Open My Certificates", _link("/student/certificates")),
                        institution,
                    )
                    if mail:
                        emails.append(mail)
                        mark(key, "recert")

    # Weekly overdue summary for each team manager.
    for team in teams:
        manager = people.get(team.get("managerId"))
        if not manager:
            continue
        members = [p for p in people.values() if p.get("teamId") == team.get("id") and p["id"] in overdue_by_employee]
        if not members:
            continue
        key = f"manager:{manager['id']}:{team.get('id')}"
        if _sent_recently(log, key, "digest", today, REPEAT_DAYS):
            continue
        lines = [f"{p.get('name')}: " + "; ".join(overdue_by_employee[p["id"]]) for p in members]
        mail = _email(
            manager,
            f"{team.get('name', 'Your team')}: overdue training",
            f"{len(members)} team member{'s have' if len(members) != 1 else ' has'} overdue training",
            lines,
            ("Open the manager portal", _link("/manager")),
            institution,
        )
        if mail:
            emails.append(mail)
            mark(key, "digest")

    return emails, updates


def plan_manual_reminder(data: dict[str, Any], employee_id: str, sender_name: str) -> Optional[Email]:
    """One nudge to an employee listing everything they still owe."""
    person = next((p for p in data.get("people") or [] if isinstance(p, dict) and p.get("id") == employee_id), None)
    if not person:
        return None
    outstanding = [
        e
        for e in data.get("enrollments") or []
        if isinstance(e, dict)
        and e.get("studentId") == employee_id
        and e.get("status") != "withdrawn"
        and float(e.get("progress") or 0) < 100
    ]
    if not outstanding:
        return None
    lines = [
        f"{e.get('courseTitle') or 'Training'}" + (f" — due {str(e.get('dueDate'))[:10]}" if e.get("dueDate") else "")
        for e in outstanding
    ]
    return _email(
        person,
        "Reminder: training to complete",
        f"{sender_name} sent you a reminder",
        ["You still have this training to complete:", *lines],
        ("Continue training", _link("/student/courses")),
        _institution(data),
    )


REMINDER_KEYS = (*CONTEXT_KEYS, "job-roles", "teams")


async def run_for_tenant(tenant_id, today: Optional[date] = None) -> int:
    """Send today's reminders for one tenant. Returns how many emails were sent."""
    from starlette.concurrency import run_in_threadpool

    from app.core.database import AsyncSessionLocal
    from app.core.permissions import Role
    from app.modules.lms_store.service import LmsStoreService
    from app.modules.onboarding.email_service import send_email_sync

    async with AsyncSessionLocal() as db:
        store = LmsStoreService(db)
        data = {k: await store.get_collection(tenant_id, k) for k in REMINDER_KEYS}
        log = await store.get_collection(tenant_id, LOG_KEY, default={})
        emails, updates = plan_reminders(data, log if isinstance(log, dict) else {}, today or date.today())
        sent = 0
        for mail in emails:
            result = await run_in_threadpool(
                send_email_sync, to_email=mail.to, subject=mail.subject, body=mail.body, html_body=mail.html
            )
            sent += 1 if result.ok else 0
        if updates:
            await store.patch_collection(
                tenant_id,
                LOG_KEY,
                role=Role.INSTITUTION_ADMIN,
                person_id="system:reminders",
                is_admin=True,
                upserts=[],
                deletes=[],
                set_entries=updates,
                unset_keys=[],
            )
        return sent


async def run_all_tenants() -> None:
    from sqlalchemy import select

    from app.core.database import AsyncSessionLocal
    from app.modules.tenants.models import Tenant

    async with AsyncSessionLocal() as db:
        tenant_ids = [row for (row,) in (await db.execute(select(Tenant.id))).all()]
    for tenant_id in tenant_ids:
        try:
            await run_for_tenant(tenant_id)
        except Exception:  # noqa: BLE001 - one tenant must not stop the others
            logger.exception("Training reminders failed for tenant %s", tenant_id)


async def reminder_loop(every: timedelta = timedelta(hours=6)) -> None:
    """Background job started with the API. The log makes repeated runs harmless."""
    from app.core.config import settings

    await asyncio.sleep(60)
    while True:
        if settings.EMAIL_ENABLED:
            await run_all_tenants()
        await asyncio.sleep(every.total_seconds())
