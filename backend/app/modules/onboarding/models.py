"""
Onboarding ORM models.

PlatformAdminUser and InstitutionAdminAccount are intentionally separate
tables — never merge platform and tenant admins into one users table
(Blueprint tenant-isolation rule).
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import TimestampMixin, UUIDPrimaryKeyMixin
from app.core.database import Base


def _enum_values(enum_cls: type) -> list[str]:
    return [member.value for member in enum_cls]


class InstitutionType(str, Enum):
    UNIVERSITY = "university"
    SCHOOL = "school"
    BUSINESS = "business"
    GOVERNMENT = "government"
    NGO = "ngo"
    TRAINING_PROVIDER = "training_provider"


class ServiceRequestStatus(str, Enum):
    NEW = "new"
    INVOICE_SENT = "invoice_sent"
    PAYMENT_CONFIRMED = "payment_confirmed"
    ACTIVATED = "activated"
    REJECTED = "rejected"


class RequestKind(str, Enum):
    NEW_INSTITUTION = "new_institution"
    ADD_MODULES = "add_modules"


class PlatformAdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"


class PlatformActorType(str, Enum):
    PLATFORM_ADMIN = "platform_admin"
    SYSTEM = "system"


class EmailType(str, Enum):
    PAYMENT_INVOICE = "payment_invoice"
    ACTIVATION_WELCOME = "activation_welcome"
    SUPER_ADMIN_ALERT = "super_admin_alert"


class EmailStatus(str, Enum):
    SENT = "sent"
    FAILED = "failed"


class PlatformAdminUser(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Cyber-Zeb Super Admin — NOT tenant-scoped."""

    __tablename__ = "platform_admin_users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[PlatformAdminRole] = mapped_column(
        SAEnum(
            PlatformAdminRole,
            name="platform_admin_role",
            values_callable=_enum_values,
        ),
        default=PlatformAdminRole.SUPER_ADMIN,
    )


class ServiceRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "service_requests"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_service_requests_idempotency"),)

    institution_name: Mapped[str] = mapped_column(String(200))
    request_kind: Mapped[RequestKind] = mapped_column(
        SAEnum(RequestKind, name="request_kind", values_callable=_enum_values),
        default=RequestKind.NEW_INSTITUTION,
        index=True,
    )
    institution_type: Mapped[InstitutionType] = mapped_column(
        SAEnum(InstitutionType, name="institution_type", values_callable=_enum_values)
    )
    contact_name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str] = mapped_column(String(50))
    estimated_users: Mapped[str] = mapped_column(String(100))
    preferred_slug: Mapped[str | None] = mapped_column(String(80), nullable=True)
    requested_modules: Mapped[list] = mapped_column(JSONB, default=list)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ServiceRequestStatus] = mapped_column(
        SAEnum(
            ServiceRequestStatus,
            name="service_request_status",
            values_callable=_enum_values,
        ),
        default=ServiceRequestStatus.NEW,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(64), index=True)

    invoice_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    invoice_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    invoice_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    payment_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    payment_confirmed_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("platform_admin_users.id"),
        nullable=True,
    )

    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    last_email_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    email_logs: Mapped[list["EmailLog"]] = relationship(back_populates="service_request")


class ModuleCatalogItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Sellable module catalog with editable pricing."""

    __tablename__ = "module_catalog_items"

    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    annual_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_core: Mapped[bool] = mapped_column(Boolean, default=False)


class AddOnModuleRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Existing-client request for additional module enablement."""

    __tablename__ = "addon_module_requests"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_addon_requests_idempotency"),)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tenants.id"), index=True
    )
    contact_name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    requested_modules: Mapped[list] = mapped_column(JSONB, default=list)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ServiceRequestStatus] = mapped_column(
        SAEnum(
            ServiceRequestStatus,
            name="addon_request_status",
            values_callable=_enum_values,
        ),
        default=ServiceRequestStatus.NEW,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(64), index=True)
    invoice_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    invoice_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    invoice_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_confirmed_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("platform_admin_users.id"),
        nullable=True,
    )
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_email_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    email_logs: Mapped[list["EmailLog"]] = relationship(back_populates="addon_module_request")


class InstitutionAdminAccount(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    First institution admin for a tenant — separate from PlatformAdminUser
    and from the tenant-scoped identity.users table used by LMS modules.
    """

    __tablename__ = "institution_admin_accounts"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_institution_admin_tenant_email"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tenants.id"), index=True
    )
    email: Mapped[str] = mapped_column(String(255), index=True)
    temporary_password_hash: Mapped[str] = mapped_column(String(255))
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True)


class PlatformAuditLog(Base):
    """Platform-level audit trail for Super Admin sensitive actions."""

    __tablename__ = "platform_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_type: Mapped[PlatformActorType] = mapped_column(
        SAEnum(PlatformActorType, name="platform_actor_type", values_callable=_enum_values)
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    before: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class EmailLog(Base):
    __tablename__ = "email_logs"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_request_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("service_requests.id"),
        nullable=True,
        index=True,
    )
    addon_module_request_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("addon_module_requests.id"),
        nullable=True,
        index=True,
    )
    email_type: Mapped[EmailType] = mapped_column(
        SAEnum(EmailType, name="email_type", values_callable=_enum_values)
    )
    to_email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(300))
    body_preview: Mapped[str] = mapped_column(Text)
    provider_message_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[EmailStatus] = mapped_column(
        SAEnum(EmailStatus, name="email_status", values_callable=_enum_values)
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    service_request: Mapped["ServiceRequest | None"] = relationship(back_populates="email_logs")
    addon_module_request: Mapped["AddOnModuleRequest | None"] = relationship(
        back_populates="email_logs"
    )


class SiteContentBlock(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Editable landing-page content blocks managed by Super Admin."""

    __tablename__ = "site_content_blocks"
    __table_args__ = (UniqueConstraint("key", name="uq_site_content_blocks_key"),)

    key: Mapped[str] = mapped_column(String(80), index=True)
    value: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class PlatformSetting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Key/value platform settings editable without redeploy."""

    __tablename__ = "platform_settings"
    __table_args__ = (UniqueConstraint("key", name="uq_platform_settings_key"),)

    key: Mapped[str] = mapped_column(String(80), index=True)
    value: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(String(300), default="")
