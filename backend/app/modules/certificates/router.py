"""
Certificates & Credentials module - FastAPI routers.

Blueprint reference: Section 14.1 (Certificates & Credentials) + Section 18 Phase 5

`public_router` is mounted without authentication or module gating: whoever
holds a certificate (an employer, another university) must be able to check it.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.core.permissions import Role
from app.modules.certificates.schemas import AutoIssueOut, AutoIssueRequest, CertificateVerificationOut
from app.modules.certificates.service import CertificatesService
from app.modules.communication.notifications import dispatch

router = APIRouter()


@router.post("/auto-issue", response_model=AutoIssueOut)
async def auto_issue_certificates(
    body: AutoIssueRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """
    Apply the completion rules now. Learners may only trigger their own check
    (the portal calls this when they finish a lesson); staff may check anyone.
    """
    student_id = body.student_id
    if principal.role in (Role.STUDENT, Role.PARENT_GUARDIAN):
        student_id = principal.person_id if principal.role == Role.STUDENT else None
        if student_id is None:
            return AutoIssueOut(enabled=True, issued=[], pending=[], records=[])
    result = await CertificatesService(db).auto_issue(
        principal.tenant_id, student_id=student_id, course_id=body.course_id
    )
    if result.issued:
        background.add_task(dispatch, principal.tenant_id, "certificates", [(None, r) for r in result.records])
    return result

public_router = APIRouter()


@public_router.get("/{certificate_id}", response_model=CertificateVerificationOut)
async def verify_certificate(
    certificate_id: str = Path(min_length=3, max_length=80),
    db: AsyncSession = Depends(get_db),
):
    """Public check that a certificate exists, and whether it is still valid."""
    return await CertificatesService(db).verify(certificate_id)
