"""
Certificates & Credentials module - FastAPI routers.

Blueprint reference: Section 14.1 (Certificates & Credentials) + Section 18 Phase 5

`public_router` is mounted without authentication or module gating: whoever
holds a certificate (an employer, another university) must be able to check it.
"""
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.certificates.schemas import CertificateVerificationOut
from app.modules.certificates.service import CertificatesService

router = APIRouter()

public_router = APIRouter()


@public_router.get("/{certificate_id}", response_model=CertificateVerificationOut)
async def verify_certificate(
    certificate_id: str = Path(min_length=3, max_length=80),
    db: AsyncSession = Depends(get_db),
):
    """Public check that a certificate exists, and whether it is still valid."""
    return await CertificatesService(db).verify(certificate_id)
