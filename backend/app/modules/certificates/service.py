"""
Certificates & Credentials module - business logic layer.

Blueprint reference: Section 14.1 (Certificates & Credentials) + Section 18 Phase 5

Certificates are issued in the portal and stored in the tenant's `certificates`
data-store collection. Verification reads them from there so anyone holding a
certificate (or scanning its QR code) can check it is genuine and still valid.
"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Role
from app.modules.certificates.auto_issue import Rules, evaluate
from app.modules.certificates.schemas import AutoIssueOut, CertificateVerificationOut
from app.modules.lms_store.models import LmsCollection
from app.modules.lms_store.service import LmsStoreService
from app.modules.tenants.models import Tenant

# What the completion rules read.
_AUTO_ISSUE_KEYS = (
    "people",
    "courses",
    "enrollments",
    "certificates",
    "lesson-progress",
    "assignments",
    "quizzes",
    "student-submissions",
    "certificate-templates",
    "settings",
)


class CertificatesService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _institution_name(self, tenant_id) -> str | None:
        settings = (
            await self.db.execute(
                select(LmsCollection.data).where(
                    LmsCollection.tenant_id == tenant_id,
                    LmsCollection.collection_key == "settings",
                )
            )
        ).scalar_one_or_none()
        if isinstance(settings, dict):
            name = (settings.get("general") or {}).get("name")
            if isinstance(name, str) and name.strip():
                return name.strip()
        tenant = await self.db.get(Tenant, tenant_id)
        return tenant.name if tenant else None

    async def verify(self, certificate_id: str) -> CertificateVerificationOut:
        wanted = certificate_id.strip().upper()
        rows = (
            await self.db.execute(
                select(LmsCollection.tenant_id, LmsCollection.data).where(
                    LmsCollection.collection_key == "certificates"
                )
            )
        ).all()
        for tenant_id, data in rows:
            if not isinstance(data, list):
                continue
            for cert in data:
                if not isinstance(cert, dict):
                    continue
                if str(cert.get("certificateId", "")).strip().upper() != wanted:
                    continue
                status = str(cert.get("status") or "")
                expiration = cert.get("expirationDate") or None
                expired = False
                if expiration:
                    try:
                        expired = date.fromisoformat(str(expiration)[:10]) < date.today()
                    except ValueError:
                        expired = False
                # A pending certificate has not been awarded yet, so it shows as
                # not found rather than leaking in-progress records.
                if status == "pending":
                    return CertificateVerificationOut(found=False, certificate_id=certificate_id)
                return CertificateVerificationOut(
                    found=True,
                    certificate_id=str(cert.get("certificateId")),
                    status=status,
                    valid=status == "issued" and not expired,
                    expired=expired,
                    student_name=cert.get("studentName"),
                    course_code=cert.get("courseCode"),
                    course_title=cert.get("courseTitle"),
                    institution_name=await self._institution_name(tenant_id),
                    issue_date=cert.get("issueDate"),
                    completion_date=cert.get("completionDate"),
                    expiration_date=expiration,
                    revoked_at=cert.get("revokedAt"),
                )
        return CertificateVerificationOut(found=False, certificate_id=certificate_id)

    async def auto_issue(
        self,
        tenant_id,
        *,
        student_id: str | None = None,
        course_id: str | None = None,
    ) -> AutoIssueOut:
        """Create every certificate the institution's completion rules now call for."""
        store = LmsStoreService(self.db)
        collections = {key: await store.get_collection(tenant_id, key) for key in _AUTO_ISSUE_KEYS}
        rules = Rules.from_settings(collections.get("settings"))
        new = evaluate(collections, rules, student_id=student_id, course_id=course_id)
        if new:
            # The server is the authority here, so the write skips the per-role
            # policy — the rules above decided what may be created.
            await store.patch_collection(
                tenant_id,
                "certificates",
                role=Role.INSTITUTION_ADMIN,
                person_id="system:auto-issue",
                is_admin=True,
                upserts=[(record, None) for record in new],
                deletes=[],
                set_entries={},
                unset_keys=[],
            )
        return AutoIssueOut(
            enabled=rules.enabled,
            issued=[r["certificateId"] for r in new if r["status"] == "issued"],
            pending=[r["certificateId"] for r in new if r["status"] == "pending"],
            records=new,
        )
