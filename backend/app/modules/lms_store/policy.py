"""
Write-permission policy for LMS data-store collections.

Tenant admins (institution / academic / training admin) may change anything in
their own tenant. Every other role may only change the collections listed here,
and only the records the rule allows. A collection or role that is not listed is
read-only for that role. Read access is handled separately in `scope.py`.

Collections come in two shapes:
- list collections: arrays of records, each with a string `id`
- keyed collections: objects whose top-level keys are person ids
  (lesson progress, forum read state, per-person portal settings)

Scores and payments are never written by students directly: quiz attempts are
graded by `POST /assessments/quizzes/{id}/attempts` and invoices are settled by
the payments checkout flow.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional

from app.core.permissions import Role
from app.modules.lms_store.scope import KEYED_COLLECTIONS, ScopeContext

Record = dict[str, Any]
Check = Callable[[Record, ScopeContext], Awaitable[bool]]
UpdateCheck = Callable[[Record, Record, ScopeContext], Awaitable[bool]]


async def _anyone(_record: Record, _ctx: ScopeContext) -> bool:
    return True


def owned_by(*fields: str) -> Check:
    """Record is owned when any of `fields` equals (or, for lists, contains) the person id."""

    async def check(record: Record, ctx: ScopeContext) -> bool:
        for name in fields:
            value = record.get(name)
            if value == ctx.person_id or (isinstance(value, list) and ctx.person_id in value):
                return True
        return False

    return check


@dataclass(frozen=True)
class Rule:
    owner: Check = _anyone
    create: bool = False
    update: bool = False
    delete: bool = False
    # When set, owners may only change these fields on their own records.
    owned_update_fields: Optional[frozenset[str]] = None
    # Fields anyone with this rule may change on records they do not own.
    shared_update_fields: frozenset[str] = field(default_factory=frozenset)
    # Extra validation for newly created records (defaults to the owner check).
    create_check: Optional[Check] = None
    # Extra validation for updates of owned records.
    update_check: Optional[UpdateCheck] = None


# ── Instructor course ownership ─────────────────────────────────────────────


async def _in_taught_course(record: Record, ctx: ScopeContext) -> bool:
    course_id = record.get("courseId")
    if course_id:
        return course_id in await ctx.taught_course_ids()
    return record.get("instructorId") == ctx.person_id


async def _question_owned(record: Record, ctx: ScopeContext) -> bool:
    # Questions without a course are shared bank items any instructor may maintain.
    return not record.get("courseId") or record.get("courseId") in await ctx.taught_course_ids()


async def _submission_for_taught_course(record: Record, ctx: ScopeContext) -> bool:
    return record.get("assessmentId") in await ctx.assessment_ids(await ctx.taught_course_ids())


async def _course_owned(record: Record, ctx: ScopeContext) -> bool:
    return (
        record.get("id") in await ctx.taught_course_ids()
        or record.get("instructorId") == ctx.person_id
        or record.get("submittedByInstructorId") == ctx.person_id
    )


async def _course_create(record: Record, ctx: ScopeContext) -> bool:
    # Instructors may propose courses; only admins approve them.
    proposer = record.get("submittedByInstructorId") == ctx.person_id or record.get("instructorId") == ctx.person_id
    return proposer and record.get("approvalStatus") != "approved"


async def _course_update(old: Record, new: Record, ctx: ScopeContext) -> bool:
    if new.get("approvalStatus") != old.get("approvalStatus") and new.get("approvalStatus") == "approved":
        return False
    return new.get("instructorId") == old.get("instructorId")


# ── Learner submissions (assignments only; quizzes are graded on the server) ─

STUDENT_SUBMISSION_FIELDS = frozenset({"status", "submittedAt", "attachmentName", "maxScore"})
GRADE_FIELDS = ("score", "feedback", "gradedAt", "gradedBy")


async def _student_assignment_create(record: Record, ctx: ScopeContext) -> bool:
    if record.get("studentId") != ctx.person_id or record.get("assessmentType") != "assignment":
        return False
    if record.get("status") != "submitted" or any(record.get(f) is not None for f in GRADE_FIELDS):
        return False
    return record.get("assessmentId") in await ctx.assessment_ids(await ctx.student_course_ids())


async def _student_assignment_update(old: Record, new: Record, _ctx: ScopeContext) -> bool:
    return old.get("assessmentType") == "assignment" and new.get("status") == "submitted"


async def _staff_submission_is_pending(record: Record, ctx: ScopeContext) -> bool:
    return record.get("verificationStatus") == "pending" and record.get("submittedById") == ctx.person_id


async def _forum_message_create(record: Record, ctx: ScopeContext) -> bool:
    # The campus chat welcome message is generated client-side as a "system" message.
    if record.get("senderId") not in (ctx.person_id, "system"):
        return False
    return record.get("chatId") in await ctx.visible_chat_ids()


async def _forum_chat_create(record: Record, ctx: ScopeContext) -> bool:
    if record.get("type") == "course":
        return record.get("createdById") == "system"
    if record.get("type") == "campus":
        return True
    return record.get("createdById") == ctx.person_id


TEACHING_ROLES = (Role.INSTRUCTOR, Role.TEACHING_ASSISTANT)
ALL_PORTAL_ROLES = (
    Role.STUDENT,
    Role.INSTRUCTOR,
    Role.TEACHING_ASSISTANT,
    Role.PARENT_GUARDIAN,
    Role.DEPARTMENT_ADMIN,
    Role.SUPPORT_AGENT,
    Role.FINANCE_OFFICER,
    Role.MANAGER,
)

_course_scoped = Rule(owner=_in_taught_course, create=True, update=True, delete=True)
_teaching = {role: _course_scoped for role in TEACHING_ROLES}
_ticket_requester = Rule(owner=owned_by("requesterId"), create=True, update=True)
_announcement_viewer = Rule(shared_update_fields=frozenset({"views", "viewedBy"}))
_announcement_author = Rule(
    owner=owned_by("authorId"),
    create=True,
    update=True,
    delete=True,
    shared_update_fields=frozenset({"views", "viewedBy"}),
)
_last_message_fields = frozenset(
    {"lastMessageAt", "lastMessagePreview", "lastMessageSenderName", "updatedAt"}
)

POLICY: dict[str, dict[Role, Rule]] = {
    # Teaching content — instructors manage records of the courses they teach.
    "live-sessions": dict(_teaching),
    "assignments": dict(_teaching),
    "quizzes": dict(_teaching),
    "attendances": dict(_teaching),
    "certificates": dict(_teaching),
    "question-bank": {
        role: Rule(owner=_question_owned, create=True, update=True, delete=True) for role in TEACHING_ROLES
    },
    "courses": {
        role: Rule(
            owner=_course_owned,
            create=True,
            update=True,
            create_check=_course_create,
            update_check=_course_update,
        )
        for role in TEACHING_ROLES
    },
    # Learner activity.
    "student-submissions": {
        **{
            role: Rule(owner=_submission_for_taught_course, create=True, update=True)
            for role in TEACHING_ROLES
        },
        Role.STUDENT: Rule(
            owner=owned_by("studentId"),
            create=True,
            update=True,
            owned_update_fields=STUDENT_SUBMISSION_FIELDS,
            create_check=_student_assignment_create,
            update_check=_student_assignment_update,
        ),
    },
    "enrollments": {
        Role.STUDENT: Rule(
            owner=owned_by("studentId"),
            update=True,
            owned_update_fields=frozenset({"progress"}),
        ),
    },
    "payments": {Role.FINANCE_OFFICER: Rule(create=True, update=True, delete=True)},
    # Support.
    "help-desk-tickets": {
        **{role: _ticket_requester for role in ALL_PORTAL_ROLES},
        Role.SUPPORT_AGENT: Rule(create=True, update=True, delete=True),
    },
    # Communication.
    "announcements": {
        **{role: _announcement_viewer for role in ALL_PORTAL_ROLES},
        **{role: _announcement_author for role in TEACHING_ROLES},
    },
    "forum-chats": {
        role: Rule(
            owner=owned_by("createdById", "memberIds"),
            create=True,
            update=True,
            create_check=_forum_chat_create,
            shared_update_fields=_last_message_fields,
        )
        for role in ALL_PORTAL_ROLES
    },
    "forum-messages": {
        role: Rule(
            owner=owned_by("senderId"),
            create=True,
            update=True,
            delete=True,
            create_check=_forum_message_create,
        )
        for role in ALL_PORTAL_ROLES
    },
    # Staff submit new people for admin verification.
    "people": {
        Role.DEPARTMENT_ADMIN: Rule(
            owner=_staff_submission_is_pending,
            create=True,
            update=True,
            delete=True,
        ),
    },
}


class PolicyViolation(Exception):
    """Raised when a caller tries to change data it is not allowed to change."""


def _changed_fields(old: Record, new: Record) -> set[str]:
    keys = set(old) | set(new)
    return {k for k in keys if old.get(k) != new.get(k)}


async def check_record_change(
    collection: str,
    ctx: ScopeContext,
    old: Optional[Record],
    new: Optional[Record],
) -> None:
    """Validate one record-level change (create when old is None, delete when new is None)."""
    rule = POLICY.get(collection, {}).get(ctx.role)
    record_id = (new or old or {}).get("id", "?")
    denied = PolicyViolation(f"You are not allowed to change {collection} record '{record_id}'")
    if rule is None:
        raise denied

    if old is None and new is not None:
        check = rule.create_check or rule.owner
        if not (rule.create and await check(new, ctx)):
            raise denied
        return

    if new is None and old is not None:
        if not (rule.delete and await rule.owner(old, ctx)):
            raise denied
        return

    assert old is not None and new is not None
    changed = _changed_fields(old, new)
    if not changed:
        return
    if rule.update and await rule.owner(old, ctx) and await rule.owner(new, ctx):
        fields_ok = rule.owned_update_fields is None or changed <= rule.owned_update_fields
        if fields_ok and (rule.update_check is None or await rule.update_check(old, new, ctx)):
            return
    if rule.shared_update_fields and changed <= rule.shared_update_fields:
        return
    raise denied


def check_keyed_change(collection: str, person_id: str, key: str) -> None:
    """Keyed collections: callers may only write their own top-level entry."""
    if collection not in KEYED_COLLECTIONS or key != person_id:
        raise PolicyViolation(f"You are not allowed to change {collection} entry '{key}'")
