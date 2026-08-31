"""
Tenants module - Blueprint Section 6 (Identity, Organization and User
Management) + Section 17.2 Organization domain.

Entities: Tenant, Campus, Department
(Program, AcademicTerm, Cohort live in app.modules.academic)
"""
import uuid
from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import TimestampMixin, UUIDPrimaryKeyMixin
from app.core.database import Base


def _enum_values(enum_cls: type) -> list[str]:
    return [member.value for member in enum_cls]


class TenantType(str, Enum):
    UNIVERSITY = "university"
    SCHOOL = "school"
    BUSINESS = "business"
    GOVERNMENT = "government"
    NGO = "ngo"
    TRAINING_PROVIDER = "training_provider"


class TenantStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class Tenant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Platform-global table (NOT tenant-scoped itself - this IS the tenant).
    Created only by a Platform Super Administrator (Section 6.1 step 1).

    Onboarding activation sets `slug` (unique path segment) and
    `enabled_modules` (per-tenant feature flags — Blueprint 4.1).
    `code` mirrors `slug` so existing tenant_code login keeps working.

    Real subdomain traffic requires wildcard DNS + wildcard TLS +
    reverse-proxy routing to the same app. Application code stores the
    subdomain slug and resolves tenants by host.
    """
    __tablename__ = "tenants"

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    tenant_type: Mapped[TenantType] = mapped_column(
        SAEnum(TenantType, name="tenanttype", values_callable=_enum_values)
    )
    status: Mapped[TenantStatus] = mapped_column(
        SAEnum(TenantStatus, name="tenantstatus", values_callable=_enum_values),
        default=TenantStatus.ACTIVE,
    )
    timezone: Mapped[str] = mapped_column(String(50), default="Africa/Addis_Ababa")
    locale: Mapped[str] = mapped_column(String(10), default="en")
    currency: Mapped[str] = mapped_column(String(10), default="ETB")

    # Branding / policy defaults stored as JSONB (Section 6.1 step 4):
    # logo_url, primary_color, custom_domain, grading_defaults,
    # attendance_defaults, completion_defaults
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)

    # --- Onboarding / activation fields ---
    slug: Mapped[str | None] = mapped_column(String(80), unique=True, index=True, nullable=True)
    service_request_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("service_requests.id"),
        unique=True,
        nullable=True,
        index=True,
    )
    # Module enablement and tenant feature flags (Blueprint 4.1)
    enabled_modules: Mapped[list] = mapped_column(JSONB, default=list)
    subscription_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    renewal_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    renewal_reminder_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    institution_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    campuses: Mapped[list["Campus"]] = relationship(back_populates="tenant")


class Campus(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Campus / branch / business unit under a tenant."""
    __tablename__ = "campuses"

    tenant_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="campuses")
    departments: Mapped[list["Department"]] = relationship(back_populates="campus")


class Department(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Faculty / school / department / business unit under a campus."""
    __tablename__ = "departments"

    tenant_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    campus_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("campuses.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(50))

    campus: Mapped["Campus"] = relationship(back_populates="departments")
