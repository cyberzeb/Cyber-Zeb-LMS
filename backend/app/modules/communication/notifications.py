"""
Email notifications for LMS events.

Every change to the portal's data goes through the data store, so one hook sees
them all: after a successful write, `plan_emails` works out which events
happened (a new announcement, an assignment published, work graded, a live class
scheduled, a certificate issued, a new invoice) and who should hear about it.
`dispatch` sends them in the background, off the request path.

Institutions choose which events email people (Settings → Email notifications,
stored as `settings.notifications`), and each person's own notification switches
in their portal settings are respected.
"""
from __future__ import annotations

import html
import logging
from dataclasses import dataclass
from typing import Any, Iterable, Optional

from starlette.concurrency import run_in_threadpool

from app.core.config import settings as app_settings

logger = logging.getLogger(__name__)

Record = dict[str, Any]
Change = tuple[Optional[Record], Record]

# Collections whose changes can trigger an email.
NOTIFY_KEYS = frozenset(
    {"announcements", "assignments", "quizzes", "student-submissions", "live-sessions", "certificates", "payments"}
)
# What planning needs to resolve recipients.
CONTEXT_KEYS = (
    "people",
    "enrollments",
    "courses",
    "assignments",
    "quizzes",
    "settings",
    "student-settings",
    "guardian-settings",
    "instructor-settings",
    "staff-settings",
)
# A single event never fans out further than this.
MAX_RECIPIENTS = 500

EVENT_DEFAULTS = {
    "email": True,
    "announcements": True,
    "assessments": True,
    "grades": True,
    "liveClasses": True,
    "certificates": True,
    "invoices": True,
}

# Portal role names (as stored on people) per settings collection.
_SETTINGS_BY_ROLE = {
    "Student": "student-settings",
    "Guardian": "guardian-settings",
    "Instructor": "instructor-settings",
    "Staff": "staff-settings",
}


@dataclass(frozen=True)
class Email:
    to: str
    subject: str
    body: str
    html: str


def _institution(data: dict[str, Any]) -> str:
    general = (data.get("settings") or {}).get("general") or {}
    name = general.get("name") if isinstance(general, dict) else None
    return name.strip() if isinstance(name, str) and name.strip() else "Berana LMS"


def event_enabled(data: dict[str, Any], event: str) -> bool:
    raw = (data.get("settings") or {}).get("notifications")
    prefs = {**EVENT_DEFAULTS, **(raw if isinstance(raw, dict) else {})}
    return bool(prefs.get("email")) and bool(prefs.get(event, True))


def _wants(data: dict[str, Any], person: Record, pref: Optional[str]) -> bool:
    """A person's own switch in their portal settings (missing means yes)."""
    if not pref:
        return True
    store = data.get(_SETTINGS_BY_ROLE.get(str(person.get("role")), "")) or {}
    mine = store.get(person.get("id")) if isinstance(store, dict) else None
    notes = (mine or {}).get("notifications") if isinstance(mine, dict) else None
    if not isinstance(notes, dict) or pref not in notes:
        return True
    return bool(notes[pref])


def _people(data: dict[str, Any]) -> dict[str, Record]:
    return {p["id"]: p for p in data.get("people") or [] if isinstance(p, dict) and p.get("id")}


def _enrolled(data: dict[str, Any], course_id: Optional[str]) -> set[str]:
    if not course_id:
        return set()
    return {
        e.get("studentId")
        for e in data.get("enrollments") or []
        if isinstance(e, dict) and e.get("courseId") == course_id and e.get("status") not in ("withdrawn", "pending")
    }


def _guardians_of(data: dict[str, Any], student_ids: set[str]) -> list[Record]:
    people = _people(data)
    names = {people[s].get("name") for s in student_ids if s in people}
    out = []
    for p in people.values():
        if p.get("role") != "Guardian":
            continue
        linked = set(p.get("linkedStudentIds") or [])
        if p.get("linkedStudentId"):
            linked.add(p["linkedStudentId"])
        if linked & student_ids or (not linked and p.get("department") in names):
            out.append(p)
    return out


def _render(institution: str, heading: str, lines: Iterable[str], cta: Optional[tuple[str, str]]) -> tuple[str, str]:
    # Events pass optional lines as empty strings.
    text_lines = [line for line in lines if line.strip()]
    body = f"{heading}\n\n" + "\n".join(text_lines)
    if cta:
        body += f"\n\n{cta[0]}: {cta[1]}"
    body += f"\n\n— {institution}\nYou can turn these emails off in your portal settings.\n"
    paragraphs = "".join(
        f'<p style="margin:0 0 12px;font-size:14px;line-height:1.6">{html.escape(line)}</p>' for line in text_lines
    )
    button = (
        f'<p style="margin:20px 0 0"><a href="{html.escape(cta[1])}" '
        'style="display:inline-block;background:#A3CF3F;color:#0f172a;font-weight:700;'
        f'text-decoration:none;padding:10px 18px;border-radius:10px">{html.escape(cta[0])}</a></p>'
        if cta
        else ""
    )
    page = f"""<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b">{html.escape(institution)}</p>
      <h1 style="margin:0 0 16px;font-size:19px">{html.escape(heading)}</h1>
      {paragraphs}{button}
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">You can turn these emails off in your portal settings.</p>
    </div>
  </body>
</html>"""
    return body, page


def _link(path: str) -> str:
    return f"{app_settings.FRONTEND_BASE_URL.rstrip('/')}{path}"


def _published_now(old: Optional[Record], new: Record) -> bool:
    return new.get("status") == "published" and (old is None or old.get("status") != "published")


def plan_emails(key: str, changes: list[Change], data: dict[str, Any]) -> list[Email]:
    """Which emails this change calls for. Pure: no I/O."""
    people = _people(data)
    institution = _institution(data)
    out: list[Email] = []

    def send(recipients: Iterable[Record], pref_for: dict[str, Optional[str]], subject: str, heading: str, lines: list[str], cta: Optional[tuple[str, str]]):
        seen: set[str] = set()
        count = 0
        for person in recipients:
            email = str(person.get("email") or "").strip().lower()
            if not email or email in seen or person.get("status") == "suspended":
                continue
            if not _wants(data, person, pref_for.get(str(person.get("role")))):
                continue
            seen.add(email)
            body, page = _render(institution, heading, lines, cta)
            out.append(Email(to=email, subject=f"{subject} — {institution}", body=body, html=page))
            count += 1
            if count >= MAX_RECIPIENTS:
                logger.warning("Notification '%s' capped at %s recipients", subject, MAX_RECIPIENTS)
                return

    for old, new in changes:
        if key == "announcements" and old is None and event_enabled(data, "announcements"):
            roles = set(new.get("targetRoles") or [])
            targets = set(new.get("targetPersonIds") or [])
            course_students = _enrolled(data, new.get("courseId")) if new.get("instructorAudience") == "course" else set()
            recipients = [
                p
                for pid, p in people.items()
                if pid != new.get("authorId")
                and (
                    pid in targets
                    or (course_students and pid in course_students)
                    or (not course_students and not targets and p.get("role") in roles)
                )
            ]
            text = str(new.get("body") or "")
            send(
                recipients,
                {"Student": "announcements", "Guardian": "announcements"},
                f"Announcement: {new.get('title', '')}",
                str(new.get("title") or "New announcement"),
                [text[:600] + ("…" if len(text) > 600 else ""), f"Posted by {new.get('authorName') or 'your institution'}."],
                ("Open the portal", _link("/login")),
            )

        elif key in ("assignments", "quizzes") and _published_now(old, new) and event_enabled(data, "assessments"):
            kind = "assignment" if key == "assignments" else "quiz"
            students = [people[s] for s in _enrolled(data, new.get("courseId")) if s in people]
            due = str(new.get("dueAt") or "")[:16].replace("T", " ")
            send(
                students,
                {"Student": "assignments"},
                f"New {kind}: {new.get('title', '')}",
                f"New {kind} in {new.get('courseCode') or 'your course'}",
                [f"“{new.get('title', '')}” has been published.", f"Due: {due}." if due else ""],
                ("View it in the portal", _link(f"/student/{'assignments' if kind == 'assignment' else 'quizzes'}")),
            )

        elif key == "student-submissions" and new.get("status") == "graded" and (old is None or old.get("status") != "graded") and event_enabled(data, "grades"):
            student = people.get(new.get("studentId"))
            if not student:
                continue
            assessments = [*(data.get("assignments") or []), *(data.get("quizzes") or [])]
            item = next((a for a in assessments if isinstance(a, dict) and a.get("id") == new.get("assessmentId")), {})
            title = item.get("title") or "Your work"
            score = new.get("score")
            max_score = new.get("maxScore")
            result = f"Score: {score} / {max_score}." if score is not None and max_score else "It has been graded."
            send([student], {"Student": "grades"}, f"Graded: {title}", f"{title} has been graded", [result, str(new.get("feedback") or "")[:400]], ("See your grades", _link("/student/grades")))
            send(
                _guardians_of(data, {student["id"]}),
                {"Guardian": "progressUpdates"},
                f"{student.get('name', 'Your child')}: {title} graded",
                f"{student.get('name', 'Your child')} received a grade",
                [f"{title} — {result}"],
                ("Open the guardian portal", _link("/guardian/grades")),
            )

        elif key == "live-sessions" and old is None and event_enabled(data, "liveClasses"):
            students = [people[s] for s in _enrolled(data, new.get("courseId")) if s in people]
            when = str(new.get("startAt") or "")[:16].replace("T", " ")
            send(
                students,
                {"Student": "liveClasses"},
                f"Live class scheduled: {new.get('title', '')}",
                f"Live class in {new.get('courseCode') or 'your course'}",
                [f"“{new.get('title', '')}” starts {when} (UTC).", f"Length: {new.get('durationMinutes', 60)} minutes."],
                ("Open live classes", _link("/student/live-classes")),
            )

        elif key == "certificates" and new.get("status") == "issued" and (old is None or old.get("status") != "issued") and event_enabled(data, "certificates"):
            student = people.get(new.get("studentId"))
            if not student:
                continue
            verify = _link(f"/verify/{new.get('certificateId', '')}")
            send(
                [student],
                {},
                f"Your certificate for {new.get('courseTitle', '')}",
                "Congratulations — your certificate is ready",
                [
                    f"You have been awarded a certificate for {new.get('courseCode', '')} — {new.get('courseTitle', '')}.",
                    f"Certificate ID: {new.get('certificateId', '')}. Anyone can check it at {verify}",
                ],
                ("Download it", _link("/student/certificates")),
            )
            send(
                _guardians_of(data, {student["id"]}),
                {"Guardian": "progressUpdates"},
                f"{student.get('name', 'Your child')} earned a certificate",
                f"{student.get('name', 'Your child')} earned a certificate",
                [f"For {new.get('courseCode', '')} — {new.get('courseTitle', '')}."],
                ("Open the guardian portal", _link("/guardian")),
            )

        elif key == "payments" and old is None and new.get("status") in ("pending", "overdue") and event_enabled(data, "invoices"):
            student = people.get(new.get("studentId"))
            if not student:
                continue
            amount = f"{new.get('amount', '')} {new.get('currency', '')}".strip()
            due = str(new.get("dueAt") or "")[:10]
            lines = [f"{new.get('label') or 'Invoice'}: {amount}.", f"Due {due}." if due else ""]
            send([student], {}, f"New invoice: {new.get('label') or amount}", "You have a new invoice", lines, ("Pay online", _link("/student/payments")))
            send(
                _guardians_of(data, {student["id"]}),
                {},
                f"New invoice for {student.get('name', 'your child')}",
                f"New invoice for {student.get('name', 'your child')}",
                lines,
                ("Pay online", _link("/guardian/payments")),
            )

    return out


def changes_between(old_list: Any, new_list: Any, ids: Optional[Iterable[str]] = None) -> list[Change]:
    """(old, new) pairs for records that were added or changed, optionally only for `ids`."""
    wanted = set(ids) if ids is not None else None
    before = {r.get("id"): r for r in old_list or [] if isinstance(r, dict)}
    out: list[Change] = []
    for record in new_list or []:
        if not isinstance(record, dict):
            continue
        rid = record.get("id")
        if wanted is not None and rid not in wanted:
            continue
        previous = before.get(rid)
        if previous != record:
            out.append((previous, record))
    return out


async def dispatch(tenant_id, key: str, changes: list[Change]) -> None:
    """Background task: plan and send the emails for these changes. Never raises."""
    if not changes or key not in NOTIFY_KEYS or not app_settings.EMAIL_ENABLED:
        return
    try:
        from app.core.database import AsyncSessionLocal
        from app.modules.lms_store.service import LmsStoreService
        from app.modules.onboarding.email_service import send_email_sync

        async with AsyncSessionLocal() as db:
            store = LmsStoreService(db)
            data = {k: await store.get_collection(tenant_id, k) for k in CONTEXT_KEYS}
        emails = plan_emails(key, changes, data)
        for email in emails:
            await run_in_threadpool(
                send_email_sync, to_email=email.to, subject=email.subject, body=email.body, html_body=email.html
            )
        if emails:
            logger.info("Sent %s notification email(s) for %s", len(emails), key)
    except Exception:  # noqa: BLE001 - a notification must never break a write
        logger.exception("Notification dispatch failed for %s", key)
