"""
Write-permission policy for LMS data-store collections.

Tenant admins (institution / academic / training admin) may change anything in
their own tenant. Every other role may only change the collections listed here,
and only the records the rule allows. A collection or role that is not listed is
read-only for that role.

Collections come in two shapes:
- list collections: arrays of records, each with a string `id`
- keyed collections: objects whose top-level keys are person ids
  (lesson progress, forum read state, per-person portal settings)

Known gaps, tracked for Phase 2:
- reads are not scoped yet: every signed-in user can read every collection
- instructors may change teaching records tenant-wide, not only for their courses
- students record their own quiz scores (there is no server-side grading yet)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from app.core.permissions import Role

Record = dict[str, Any]
OwnerCheck = Callable[[Record, str], bool]


def owned_by(*fields: str) -> OwnerCheck:
    """Record is owned when any of `fields` equals (or, for lists, contains) the person id."""

    def check(record: Record, person_id: str) -> bool:
        for name in fields:
            value = record.get(name)
            if value == person_id or (isinstance(value, list) and person_id in value):
                return True
        return False

    return check


def _anyone(_record: Record, _person_id: str) -> bool:
    return True


@dataclass(frozen=True)
class Rule:
    owner: OwnerCheck = _anyone
    create: bool = False
    update: bool = False
    delete: bool = False
    # When set, owners may only change these fields on their own records.
    owned_update_fields: Optional[frozenset[str]] = None
    # Fields anyone with this rule may change on records they do not own.
    shared_update_fields: frozenset[str] = field(default_factory=frozenset)
    # Extra validation for newly created records.
    create_check: Optional[Callable[[Record, str], bool]] = None


FULL = Rule(create=True, update=True, delete=True)

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
TEACHING_ROLES = (Role.INSTRUCTOR, Role.TEACHING_ASSISTANT)

# Keyed collections: top-level key must be the caller's own person id.
KEYED_COLLECTIONS = frozenset(
    {
        "lesson-progress",
        "lesson-responses",
        "forum-read-state",
        "student-settings",
        "instructor-settings",
        "staff-settings",
        "guardian-settings",
        "help-desk-settings",
    }
)
KEYED_SELF_WRITABLE = KEYED_COLLECTIONS  # every portal role may edit its own entry


def _staff_submission_is_pending(record: Record, person_id: str) -> bool:
    return record.get("verificationStatus") == "pending" and record.get("submittedById") == person_id


def _forum_message_create(record: Record, person_id: str) -> bool:
    # The campus chat welcome message is generated client-side as a "system" message.
    return record.get("senderId") in (person_id, "system")


_teaching = {role: FULL for role in TEACHING_ROLES}
_ticket_requester = Rule(owner=owned_by("requesterId"), create=True, update=True)
_announcement_viewer = Rule(shared_update_fields=frozenset({"views", "viewedBy"}))

POLICY: dict[str, dict[Role, Rule]] = {
    # Teaching content — instructors manage it (tenant-wide for now).
    "live-sessions": dict(_teaching),
    "assignments": dict(_teaching),
    "quizzes": dict(_teaching),
    "question-bank": dict(_teaching),
    "attendances": dict(_teaching),
    "certificates": dict(_teaching),
    "courses": dict(_teaching),
    # Learner activity.
    "student-submissions": {
        **_teaching,
        Role.STUDENT: Rule(owner=owned_by("studentId"), create=True, update=True),
    },
    "enrollments": {
        Role.STUDENT: Rule(
            owner=owned_by("studentId"),
            update=True,
            owned_update_fields=frozenset({"progress"}),
        ),
    },
    # Simulated online payment until a real gateway exists (Phase 2).
    "payments": {
        Role.STUDENT: Rule(
            owner=owned_by("studentId"),
            update=True,
            owned_update_fields=frozenset({"status", "paidAt", "method", "reference"}),
        ),
        Role.FINANCE_OFFICER: FULL,
    },
    # Support.
    "help-desk-tickets": {
        **{role: _ticket_requester for role in ALL_PORTAL_ROLES},
        Role.SUPPORT_AGENT: FULL,
    },
    # Communication.
    "announcements": {
        **{role: _announcement_viewer for role in ALL_PORTAL_ROLES},
        **_teaching,
    },
    "forum-chats": {role: Rule(create=True, update=True) for role in ALL_PORTAL_ROLES},
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
            create_check=_staff_submission_is_pending,
        ),
    },
}


class PolicyViolation(Exception):
    """Raised when a caller tries to change data it is not allowed to change."""


def _changed_fields(old: Record, new: Record) -> set[str]:
    keys = set(old) | set(new)
    return {k for k in keys if old.get(k) != new.get(k)}


def check_record_change(
    collection: str,
    role: Role,
    person_id: str,
    old: Optional[Record],
    new: Optional[Record],
) -> None:
    """Validate one record-level change (create when old is None, delete when new is None)."""
    rule = POLICY.get(collection, {}).get(role)
    record_id = (new or old or {}).get("id", "?")
    denied = PolicyViolation(f"You are not allowed to change {collection} record '{record_id}'")
    if rule is None:
        raise denied

    if old is None and new is not None:
        allowed = rule.create and (
            rule.create_check(new, person_id) if rule.create_check else rule.owner(new, person_id)
        )
        if not allowed:
            raise denied
        return

    if new is None and old is not None:
        if not (rule.delete and rule.owner(old, person_id)):
            raise denied
        return

    assert old is not None and new is not None
    changed = _changed_fields(old, new)
    if not changed:
        return
    if rule.update and rule.owner(old, person_id) and rule.owner(new, person_id):
        if rule.owned_update_fields is None or changed <= rule.owned_update_fields:
            return
    if rule.shared_update_fields and changed <= rule.shared_update_fields:
        return
    raise denied


def check_keyed_change(collection: str, person_id: str, key: str) -> None:
    """Keyed collections: callers may only write their own top-level entry."""
    if collection not in KEYED_SELF_WRITABLE or key != person_id:
        raise PolicyViolation(f"You are not allowed to change {collection} entry '{key}'")
