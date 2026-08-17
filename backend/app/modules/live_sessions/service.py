"""
Virtual Classroom / Zoom Integration module - business logic layer.

Blueprint reference: Section 10 (Virtual Learning and Zoom Integration)

Rules to enforce here (not in the router):
- Validate every business rule from the blueprint section above.
- Call app.common.audit.write_audit_log(...) for any high-risk action
  (Section 16.1: grade changes after publish, refunds, guardian-link
  changes, impersonation, role changes, certificate overrides, etc).
- Never trust tenant_id/amount/ownership from client input - always use
  the Principal from app.core.dependencies.
"""
from sqlalchemy.ext.asyncio import AsyncSession


class LiveSessionsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # TODO(Sprint 6): implement service methods backing: POST /courses/{id}/live-sessions, POST /live-sessions/{id}/join, POST /integrations/zoom/webhook
