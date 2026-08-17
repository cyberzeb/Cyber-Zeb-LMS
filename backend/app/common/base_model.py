"""
Shared ORM mixins.

Every tenant-owned table MUST inherit TenantScopedMixin so it always
carries tenant_id (Section 17.3 - Multi-Tenant Rule). Platform-global
tables (e.g. the Tenant table itself) use TimestampMixin only.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, declared_attr, mapped_column


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TenantScopedMixin(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """
    Standard mixin for every tenant-owned table across all modules.
    Using declared_attr so each subclass gets its own correctly-bound
    tenant_id column/FK instead of sharing one column object.
    """

    @declared_attr
    def tenant_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True
        )
