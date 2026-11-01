"""
Assignments, Assessments & Gradebook module - FastAPI router.

Blueprint reference: Sections 11.2-11.3 (Assessment Types, Gradebook Rules)
"""
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.modules.assessments.service import AssessmentsService

router = APIRouter()


class QuizAttemptIn(BaseModel):
    # Text for most formats; a list (multi-select, fill-blank, ordering) or a
    # mapping (matching) for the others. See assessments/questions.py.
    answers: dict[str, Any] = Field(default_factory=dict)


class QuizAttemptOut(BaseModel):
    submission: dict[str, Any]
    score: float
    max_score: float
    # Answers the instructor still has to mark (essays).
    pending_review: int = 0


@router.post("/quizzes/{quiz_id}/attempts", response_model=QuizAttemptOut)
async def submit_quiz_attempt(
    quiz_id: str,
    payload: QuizAttemptIn,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """Grade a student's quiz attempt on the server and record the submission."""
    service = AssessmentsService(db)
    return await service.submit_quiz_attempt(principal, quiz_id, payload.answers)
