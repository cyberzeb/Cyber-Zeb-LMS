"""
Certificates & Credentials module - Pydantic request/response schemas.
"""
from pydantic import BaseModel


class CertificateVerificationOut(BaseModel):
    """What the public verification page may show about a certificate."""

    found: bool
    certificate_id: str
    status: str | None = None
    valid: bool = False
    expired: bool = False
    student_name: str | None = None
    course_code: str | None = None
    course_title: str | None = None
    institution_name: str | None = None
    issue_date: str | None = None
    completion_date: str | None = None
    expiration_date: str | None = None
    revoked_at: str | None = None
