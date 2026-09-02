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
    BigInteger,
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
from app.modules.onboarding.institution_types import InstitutionType


def _enum_values(enum_cls: type) -> list[str]:
    return [member.value for member in enum_cls]


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
    RENEWAL_REMINDER = "renewal_reminder"


class EmailStatus(str, Enum):
    SENT = "sent"
    FAILED = "failed"


class IntegrationPlatform(str, Enum):
    ZOOM = "zoom"
    MICROSOFT_TEAMS = "microsoft_teams"
    GOOGLE_MEET = "google_meet"
    WEBEX = "webex"


class BackupStatus(str, Enum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class UserReportStatus(str, Enum):
    OPEN = "open"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    BANNED = "banned"


class BanScope(str, Enum):
    FULL_ACCOUNT = "full_account"


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
    # Suspension (platform-level ban of another super admin)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False)
    suspension_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


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


# ── New models for Super Admin features ──────────────────────────────────────


class PlatformIntegration(Base):
    """OAuth connection records for live-session platforms (Zoom, Teams, Meet, Webex)."""

    __tablename__ = "platform_integrations"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    # Tokens stored encrypted (Fernet); None until connected
    access_token_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # OAuth PKCE state for in-flight flows
    oauth_state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    connected_account: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_health_check: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_health_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PlatformAdminBan(Base):
    """Platform-level ban of a super admin account."""

    __tablename__ = "platform_admin_bans"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_admin_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id"), index=True
    )
    banned_by_admin_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id")
    )
    reason: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    unbanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unbanned_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id"), nullable=True
    )
    unban_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserReport(Base):
    """Report of user misconduct — filed by any user, reviewed by Super Admin."""

    __tablename__ = "user_reports"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # reporter may be NULL for anonymous/system reports
    reporter_user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    reported_user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tenants.id"), index=True
    )
    reason: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=UserReportStatus.OPEN.value, index=True)
    reviewed_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserBan(Base):
    """Platform super admin ban of a tenant user (student/instructor)."""

    __tablename__ = "user_bans"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tenants.id"), index=True
    )
    banned_by_admin_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id")
    )
    reason: Mapped[str] = mapped_column(Text)
    ban_scope: Mapped[str] = mapped_column(String(30), default=BanScope.FULL_ACCOUNT.value)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    unbanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unbanned_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id"), nullable=True
    )
    report_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("user_reports.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BackupRun(Base):
    """Record of each pg_dump backup attempt."""

    __tablename__ = "backup_runs"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(20), default=BackupStatus.RUNNING.value)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    duration_seconds: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(30), default="scheduled")
    triggered_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id"), nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PlatformBranding(Base):
    """Single-row branding config — logo, favicon, footer text/links."""

    __tablename__ = "platform_branding"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # List of {label, url} objects
    footer_links: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    updated_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("platform_admin_users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
