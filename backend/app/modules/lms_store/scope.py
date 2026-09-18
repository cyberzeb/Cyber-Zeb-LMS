"""
Per-role read views of LMS data-store collections.

Tenant admins see everything. Every other role gets a view built on the server:
their own records, the records of courses they teach or take, their linked
children (guardians), and public catalog/structure data. People outside that
scope appear only as a directory entry (name, role — no email or personal data).
Collections without a rule here are hidden from non-admin roles.

`ScopeContext` is also used by the write policy (instructor course ownership).
"""
from __future__ import annotations

from typing import Any, Awaitable, Callable, Optional

from app.core.permissions import Role

Record = dict[str, Any]

# Readable by every signed-in member of the tenant, unchanged.
PUBLIC_COLLECTIONS = frozenset(
    {
        "campuses",
        "colleges",
        "departments",
        "programs",
        "academic-years",
        "academic-terms",
        "course-offerings",
        "courses",
        "selectedCampus",
        "teams",
        "job-roles",
        "skills",
        "training-divisions",
        "training-programs",
        "cohorts",
    }
)

# Keyed by person id: non-admins only receive the entries they are allowed to see.
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

DIRECTORY_FIELDS = ("id", "name", "role", "initials", "department", "departmentId", "campusId", "status")
SECRET_QUESTION_FIELDS = ("correctAnswer", "explanation", "answerKey")
TEACHING_ROLES = (Role.INSTRUCTOR, Role.TEACHING_ASSISTANT)


class ScopeContext:
    """Lazily loads the tenant collections needed to decide what a person may see."""

    def __init__(
        self,
        loader: Callable[[str], Awaitable[Any]],
        person_id: str,
        role: Role,
    ):
        self._loader = loader
        self._cache: dict[str, Any] = {}
        self.person_id = person_id
        self.role = role

    async def load(self, key: str) -> Any:
        if key not in self._cache:
            self._cache[key] = await self._loader(key)
        return self._cache[key]

    async def _list(self, key: str) -> list[Record]:
        data = await self.load(key)
        return [r for r in data if isinstance(r, dict)] if isinstance(data, list) else []

    async def me(self) -> Optional[Record]:
        return next((p for p in await self._list("people") if p.get("id") == self.person_id), None)

    async def children_ids(self) -> set[str]:
        """Students linked to a guardian (by linkedStudentId, or legacy: child's name in `department`)."""
        me = await self.me()
        if not me:
            return set()
        people = await self._list("people")
        linked = me.get("linkedStudentId") or me.get("linkedStudentIds") or []
        ids = {linked} if isinstance(linked, str) else set(linked)
        ids |= {
            p["id"]
            for p in people
            if p.get("role") == "Student" and me.get("department") and p.get("name") == me.get("department")
        }
        return {i for i in ids if i}

    async def learner_ids(self) -> set[str]:
        """The student ids whose records this person may see as "their own"."""
        if self.role == Role.PARENT_GUARDIAN:
            return await self.children_ids()
        return {self.person_id}

    async def student_course_ids(self) -> set[str]:
        learners = await self.learner_ids()
        return {e.get("courseId") for e in await self._list("enrollments") if e.get("studentId") in learners}

    async def taught_course_ids(self) -> set[str]:
        me = await self.me()
        name = (me or {}).get("name")
        ids = {
            c.get("id")
            for c in await self._list("courses")
            if c.get("instructorId") == self.person_id
            or c.get("submittedByInstructorId") == self.person_id
            or (name and c.get("instructor") == name)
        }
        ids |= {
            o.get("courseId")
            for o in await self._list("course-offerings")
            if o.get("primaryInstructorId") == self.person_id
        }
        return {i for i in ids if i}

    async def my_course_ids(self) -> set[str]:
        if self.role in TEACHING_ROLES:
            return await self.taught_course_ids()
        return await self.student_course_ids()

    async def taught_student_ids(self) -> set[str]:
        courses = await self.taught_course_ids()
        return {e.get("studentId") for e in await self._list("enrollments") if e.get("courseId") in courses}

    async def assessment_ids(self, course_ids: set[str]) -> set[str]:
        ids: set[str] = set()
        for key in ("quizzes", "assignments"):
            ids |= {r.get("id") for r in await self._list(key) if r.get("courseId") in course_ids}
        return ids

    async def visible_chat_ids(self) -> set[str]:
        courses = await self.my_course_ids()
        visible = set()
        for chat in await self._list("forum-chats"):
            kind = chat.get("type")
            if kind == "campus":
                visible.add(chat.get("id"))
            elif kind == "course" and chat.get("courseId") in courses:
                visible.add(chat.get("id"))
            elif self.person_id in (chat.get("memberIds") or []) or chat.get("createdById") == self.person_id:
                visible.add(chat.get("id"))
        return visible


def _directory(person: Record) -> Record:
    return {k: person[k] for k in DIRECTORY_FIELDS if k in person}


async def _people_view(data: list[Record], ctx: ScopeContext) -> list[Record]:
    role = ctx.role
    if role in (Role.DEPARTMENT_ADMIN, Role.FINANCE_OFFICER, Role.ACADEMIC_ADMIN):
        return data
    full_ids = {ctx.person_id}
    if role == Role.PARENT_GUARDIAN:
        full_ids |= await ctx.children_ids()
    elif role in TEACHING_ROLES:
        full_ids |= await ctx.taught_student_ids()
    return [p if p.get("id") in full_ids else _directory(p) for p in data]


async def filter_collection(key: str, data: Any, ctx: ScopeContext) -> Any:
    """Return the part of collection `key` that a non-admin principal may read."""
    if key in PUBLIC_COLLECTIONS:
        return data
    role = ctx.role
    pid = ctx.person_id

    if key in KEYED_COLLECTIONS:
        if not isinstance(data, dict):
            return {}
        allowed = {pid}
        if key in ("lesson-progress", "lesson-responses"):
            if role == Role.PARENT_GUARDIAN:
                allowed |= await ctx.children_ids()
            elif role in TEACHING_ROLES:
                allowed |= await ctx.taught_student_ids()
        return {k: v for k, v in data.items() if k in allowed}

    if key == "settings":
        # Institution settings minus integration credentials/config.
        return {k: v for k, v in data.items() if k != "integrations"} if isinstance(data, dict) else {}

    if not isinstance(data, list):
        return {} if isinstance(data, dict) else []
    records = [r for r in data if isinstance(r, dict)]

    if key == "forum-chats":
        # Campus and course chats are shared (the client creates missing course
        # chats); direct/thread chats only for their members.
        return [
            r
            for r in records
            if r.get("type") in ("campus", "course")
            or pid in (r.get("memberIds") or [])
            or r.get("createdById") == pid
        ]

    if key == "people":
        return await _people_view(records, ctx)

    if key == "help-desk-tickets":
        if role == Role.SUPPORT_AGENT:
            return records
        return [r for r in records if r.get("requesterId") == pid]

    if key == "payments":
        if role == Role.FINANCE_OFFICER:
            return records
        if role in (Role.STUDENT, Role.PARENT_GUARDIAN):
            learners = await ctx.learner_ids()
            return [r for r in records if r.get("studentId") in learners]
        return []

    if key == "announcements":
        return records

    if key == "forum-messages":
        chats = await ctx.visible_chat_ids()
        return [r for r in records if r.get("chatId") in chats]

    if role in (Role.STUDENT, Role.PARENT_GUARDIAN):
        learners = await ctx.learner_ids()
        courses = await ctx.student_course_ids()
        if key in ("enrollments", "student-submissions", "attendances", "certificates"):
            return [r for r in records if r.get("studentId") in learners]
        if key in ("quizzes", "assignments", "live-sessions"):
            return [r for r in records if r.get("courseId") in courses]
        if key == "question-bank":
            quiz_questions = {
                qid
                for quiz in await ctx._list("quizzes")
                if quiz.get("courseId") in courses
                for qid in (quiz.get("questionIds") or [])
            }
            return [
                {k: v for k, v in r.items() if k not in SECRET_QUESTION_FIELDS}
                for r in records
                if r.get("id") in quiz_questions
            ]
        return []

    if role in TEACHING_ROLES:
        courses = await ctx.taught_course_ids()
        if key in ("enrollments", "attendances", "certificates"):
            return [r for r in records if r.get("courseId") in courses or r.get("instructorId") == pid]
        if key == "student-submissions":
            assessments = await ctx.assessment_ids(courses)
            return [r for r in records if r.get("assessmentId") in assessments]
        if key in ("quizzes", "assignments", "live-sessions", "question-bank"):
            return records
        return []

    if role == Role.DEPARTMENT_ADMIN and key == "enrollments":
        return records
    return []

