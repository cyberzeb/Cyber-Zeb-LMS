"""
Assignments, Assessments & Gradebook module - business logic layer.

Quiz attempts are graded here, on the server, against the question bank's answer
key — students never see correct answers and cannot write their own scores.
Works on the tenant's LMS data-store collections (quizzes, question-bank,
student-submissions) that the portals read.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.demo_auth import DemoPrincipal
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationAppError
from app.core.permissions import Role
from app.modules.lms_store.service import LmsStoreService


def score_quiz(questions: list[dict[str, Any]], answers: dict[str, str]) -> tuple[int, int]:
    """Same rules the portal used: true/false is case-insensitive, other types exact."""
    score = 0
    max_score = 0
    for question in questions:
        points = int(question.get("points") or 0)
        max_score += points
        given = str(answers.get(question.get("id"), "")).strip()
        expected = str(question.get("correctAnswer") or "").strip()
        if not given or not expected:
            continue
        if question.get("type") == "true-false":
            if given.lower() == expected.lower():
                score += points
        elif given == expected:
            score += points
    return score, max_score


class AssessmentsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.store = LmsStoreService(db)

    async def submit_quiz_attempt(
        self, principal: DemoPrincipal, quiz_id: str, answers: dict[str, str]
    ) -> dict[str, Any]:
        if principal.role != Role.STUDENT:
            raise PermissionDeniedError("Only students can submit quiz attempts")

        tenant_id = principal.tenant_id
        quizzes = await self.store.get_collection(tenant_id, "quizzes", [])
        quiz = next((q for q in quizzes if isinstance(q, dict) and q.get("id") == quiz_id), None)
        if not quiz:
            raise NotFoundError("Quiz not found")
        if quiz.get("status") not in (None, "published", "active", "open"):
            raise ValidationAppError("This quiz is not open for attempts")

        ctx = self.store.scope_context(tenant_id, principal.person_id, principal.role)
        if quiz.get("courseId") not in await ctx.student_course_ids():
            raise PermissionDeniedError("You are not enrolled in this quiz's course")

        bank = await self.store.get_collection(tenant_id, "question-bank", [])
        by_id = {q.get("id"): q for q in bank if isinstance(q, dict)}
        questions = [by_id[qid] for qid in quiz.get("questionIds") or [] if qid in by_id]
        if not questions:
            raise ValidationAppError("This quiz has no questions")
        unanswered = [q for q in questions if not str(answers.get(q.get("id"), "")).strip()]
        if unanswered:
            raise ValidationAppError(f"Answer all {len(questions)} questions before submitting")

        score, max_score = score_quiz(questions, answers)
        max_score = max_score or int(quiz.get("maxPoints") or 0)
        now = datetime.now(timezone.utc).isoformat()

        row = await self.store.repo.get(tenant_id, "student-submissions", for_update=True)
        submissions = list(row.data) if row is not None and isinstance(row.data, list) else []
        existing = next(
            (
                s
                for s in submissions
                if isinstance(s, dict)
                and s.get("studentId") == principal.person_id
                and s.get("assessmentType") == "quiz"
                and s.get("assessmentId") == quiz_id
            ),
            None,
        )
        record = {
            **(existing or {"id": f"sub-{uuid.uuid4().hex[:12]}"}),
            "studentId": principal.person_id,
            "assessmentType": "quiz",
            "assessmentId": quiz_id,
            "status": "graded",
            "score": score,
            "maxScore": max_score,
            "submittedAt": now,
            "gradedBy": "system",
        }
        if existing:
            submissions = [record if s is existing else s for s in submissions]
        else:
            submissions.insert(0, record)
        await self.store.repo.upsert(tenant_id, "student-submissions", submissions)
        await self.db.commit()
        return {"submission": record, "score": score, "max_score": max_score}
