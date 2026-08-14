"""
Audit logging.

Section 16.1 lists high-risk actions that MUST be audited: grade changes
after publication, manual attendance correction, refunds, guardian-link
changes, impersonation, role changes, certificate overrides, integration
secret changes, bulk exports.

Call `write_audit_log(...)` from the service layer (not the router) right
after the state-changing operation succeeds, inside the same transaction
where practical.
"""
import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), index=True, nullable=False)
    actor_user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(120), index=True)          # e.g. "grade.updated_after_publish"
    resource_type: Mapped[str] = mapped_column(String(80))                # e.g. "GradeItem"
    resource_id: Mapped[str] = mapped_column(String(80))
    before_state: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    after_state: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


async def write_audit_log(
    db: AsyncSession,
    *,
    tenant_id: uuid.UUID,
    actor_user_id: uuid.UUID,
    action: str,
    resource_type: str,
    resource_id: str,
    before_state: Optional[dict[str, Any]] = None,
    after_state: Optional[dict[str, Any]] = None,
    reason: Optional[str] = None,
) -> None:
    entry = AuditLog(
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        before_state=before_state,
        after_state=after_state,
        reason=reason,
    )
    db.add(entry)
    await db.flush()
