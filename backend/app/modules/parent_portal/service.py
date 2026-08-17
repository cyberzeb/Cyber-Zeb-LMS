"""
Parent / Guardian Portal module - business logic layer.

Blueprint reference: Section 8.3 (Parent / Guardian Portal)

Rules to enforce here (not in the router):
- Validate every business rule from the blueprint section above.
- Call app.common.audit.write_audit_log(...) for any high-risk action
  (Section 16.1: grade changes after publish, refunds, guardian-link
  changes, impersonation, role changes, certificate overrides, etc).
- Never trust tenant_id/amount/ownership from client input - always use
  the Principal from app.core.dependencies.
"""
from sqlalchemy.ext.asyncio import AsyncSession


class ParentPortalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # TODO(Sprint 9): implement service methods backing: GET /parent-portal/children, GET /parent-portal/children/{id}/attendance, GET /parent-portal/children/{id}/grades
