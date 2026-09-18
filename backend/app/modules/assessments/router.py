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
    answers: dict[str, str] = Field(default_factory=dict)


class QuizAttemptOut(BaseModel):
    submission: dict[str, Any]
    score: int
    max_score: int


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
