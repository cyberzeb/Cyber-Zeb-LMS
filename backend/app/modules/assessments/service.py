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
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.demo_auth import DemoPrincipal
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationAppError
from app.core.permissions import Role
from app.modules.assessments.questions import is_answered, score_question
from app.modules.lms_store.service import LmsStoreService


def score_quiz(
    questions: list[dict[str, Any]], answers: dict[str, Any]
) -> tuple[float, float, dict[str, Optional[float]]]:
    """Auto-graded score, maximum score, and points per question (None = instructor marks it)."""
    per_question: dict[str, Optional[float]] = {}
    score = 0.0
    max_score = 0.0
    for question in questions:
        qid = str(question.get("id"))
        max_score += float(question.get("points") or 0)
        earned = score_question(question, answers.get(qid))
        per_question[qid] = earned
        if earned is not None:
            score += earned
    return round(score, 2), round(max_score, 2), per_question


class AssessmentsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.store = LmsStoreService(db)

    async def submit_quiz_attempt(
        self, principal: DemoPrincipal, quiz_id: str, answers: dict[str, Any]
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
        unanswered = [q for q in questions if not is_answered(q, answers.get(q.get("id")))]
        if unanswered:
            raise ValidationAppError(f"Answer all {len(questions)} questions before submitting")

        score, max_score, per_question = score_quiz(questions, answers)
        max_score = max_score or float(quiz.get("maxPoints") or 0)
        # Essays (and short answers without accepted answers) wait for the instructor.
        pending = [qid for qid, earned in per_question.items() if earned is None]
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
            "status": "submitted" if pending else "graded",
            "score": score,
            "maxScore": max_score,
            "submittedAt": now,
            "gradedBy": None if pending else "system",
            "answers": {str(q.get("id")): answers.get(q.get("id")) for q in questions},
            "questionScores": per_question,
            "pendingReview": pending,
        }
        if existing:
            submissions = [record if s is existing else s for s in submissions]
        else:
            submissions.insert(0, record)
        await self.store.repo.upsert(tenant_id, "student-submissions", submissions)
        await self.db.commit()
        return {
            "submission": record,
            "score": score,
            "max_score": max_score,
            "pending_review": len(pending),
        }
