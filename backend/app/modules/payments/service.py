"""
Payments, Billing and Financial Controls module - business logic layer.

Blueprint reference: Section 13 (Payments, Billing and Financial Controls)

Rules to enforce here (not in the router):
- Validate every business rule from the blueprint section above.
- Call app.common.audit.write_audit_log(...) for any high-risk action
  (Section 16.1: grade changes after publish, refunds, guardian-link
  changes, impersonation, role changes, certificate overrides, etc).
- Never trust tenant_id/amount/ownership from client input - always use
  the Principal from app.core.dependencies.
"""
from sqlalchemy.ext.asyncio import AsyncSession


class PaymentsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # TODO(Sprint 8): implement service methods backing: POST /orders, POST /payments/checkout, POST /webhooks/payments/{provider}, POST /refunds
