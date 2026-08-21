"""Pydantic schemas for the onboarding / service-request API."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.modules.onboarding.constants import ALWAYS_ON_MODULES, ModuleKey
from app.modules.onboarding.models import (
    RequestKind,
    EmailStatus,
    EmailType,
    InstitutionType,
    PlatformAdminRole,
    ServiceRequestStatus,
)


class ServiceRequestCreate(BaseModel):
    institution_name: str = Field(min_length=1, max_length=200)
    institution_type: InstitutionType
    contact_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=50)
    estimated_users: str = Field(min_length=1, max_length=100)
    preferred_slug: str | None = Field(default=None, max_length=80)
    requested_modules: list[ModuleKey] = Field(min_length=1)
    message: str | None = None

    @field_validator("requested_modules")
    @classmethod
    def ensure_core_modules(cls, value: list[ModuleKey]) -> list[ModuleKey]:
        merged = list(dict.fromkeys([*ALWAYS_ON_MODULES, *value]))
        return merged


class AddOnModuleRequestCreate(BaseModel):
    tenant_lookup: str = Field(min_length=1, max_length=255)
    contact_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    requested_modules: list[ModuleKey] = Field(min_length=1)
    message: str | None = None


class SendInvoiceBody(BaseModel):
    """Amount may be omitted or 0 — service falls back to calculated estimate."""

    invoice_amount: Decimal | None = Field(default=None, ge=0)
    invoice_currency: str = Field(min_length=1, max_length=10, default="ETB")
    invoice_notes: str = Field(min_length=1, max_length=4000)


class RejectBody(BaseModel):
    rejection_reason: str = Field(min_length=1, max_length=2000)


class SuperAdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class SuperAdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: PlatformAdminRole = PlatformAdminRole.SUPER_ADMIN
    email: EmailStr


class EmailLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email_type: EmailType
    to_email: str
    subject: str
    body_preview: str
    status: EmailStatus
    error_message: str | None
    sent_at: datetime
    service_request_id: uuid.UUID | None = None
    addon_module_request_id: uuid.UUID | None = None


class ModuleCatalogItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    display_name: str
    description: str
    annual_price: Decimal
    currency: str
    is_active: bool
    is_core: bool


class ModuleCatalogUpsert(BaseModel):
    key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9_]+$")
    display_name: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    annual_price: Decimal = Field(ge=0)
    currency: str = Field(default="USD", min_length=1, max_length=10)
    is_active: bool = True
    is_core: bool = False


class ModuleCatalogPatch(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    annual_price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=10)
    is_active: bool | None = None


class TenantActivationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    enabled_modules: list[str]
    status: str
    institution_link: str
    renewal_date: date | None = None


class ServiceRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_name: str
    request_kind: RequestKind = RequestKind.NEW_INSTITUTION
    institution_type: InstitutionType
    contact_name: str
    email: EmailStr
    phone: str
    estimated_users: str
    preferred_slug: str | None
    requested_modules: list[str]
    message: str | None
    status: ServiceRequestStatus
    invoice_amount: Decimal | None
    invoice_currency: str | None
    invoice_notes: str | None
    invoice_sent_at: datetime | None
    payment_confirmed_at: datetime | None
    payment_confirmed_by: uuid.UUID | None
    activated_at: datetime | None
    rejected_at: datetime | None
    rejection_reason: str | None
    last_email_error: str | None
    estimated_total: Decimal | None = None
    estimated_currency: str | None = None
    created_at: datetime
    updated_at: datetime
    tenant: TenantActivationOut | None = None
    email_logs: list[EmailLogOut] = []


class ServiceRequestListOut(BaseModel):
    items: list[ServiceRequestOut]
    total: int


class ActivateResponse(BaseModel):
    service_request: ServiceRequestOut
    tenant: TenantActivationOut
    already_activated: bool = False


class AddOnModuleRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    request_kind: RequestKind = RequestKind.ADD_MODULES
    tenant_id: uuid.UUID
    tenant_name: str
    tenant_slug: str
    contact_name: str
    email: EmailStr
    phone: str | None
    requested_modules: list[str]
    message: str | None
    status: ServiceRequestStatus
    invoice_amount: Decimal | None
    invoice_currency: str | None
    invoice_notes: str | None
    invoice_sent_at: datetime | None
    payment_confirmed_at: datetime | None
    payment_confirmed_by: uuid.UUID | None
    activated_at: datetime | None
    rejected_at: datetime | None
    rejection_reason: str | None
    last_email_error: str | None
    estimated_total: Decimal | None = None
    estimated_currency: str | None = None
    created_at: datetime
    updated_at: datetime
    email_logs: list[EmailLogOut] = []


class AddOnModuleRequestListOut(BaseModel):
    items: list[AddOnModuleRequestOut]
    total: int


class RenewalTenantOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str | None
    status: str
    enabled_modules: list[str]
    subscription_start_date: date | None = None
    renewal_date: date | None = None
    institution_link: str


class InstitutionListItemOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str | None
    status: str
    enabled_modules: list[str]
    renewal_date: date | None = None
    institution_link: str


class InstitutionDetailOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str | None
    status: str
    enabled_modules: list[str]
    subscription_start_date: date | None = None
    renewal_date: date | None = None
    institution_link: str
    admin_email: str | None = None
    estimated_total: Decimal | None = None
    estimated_currency: str | None = None


class SiteContentBlockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    value: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SiteContentBlockCreate(BaseModel):
    key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9_]+$")
    value: str = Field(default="", max_length=8000)
    is_active: bool = True


class SiteContentBlockPatch(BaseModel):
    value: str | None = Field(default=None, max_length=8000)
    is_active: bool | None = None


class AnnouncementCreate(BaseModel):
    """Convenience schema for the announcement_banner use case."""

    value: str = Field(min_length=1, max_length=8000)
    is_active: bool = True


class AnnouncementOut(BaseModel):
    key: str = "announcement_banner"
    value: str
    is_active: bool


class PlatformAuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_type: str
    actor_id: uuid.UUID | None
    actor_email: str | None = None
    action: str
    entity_type: str
    entity_id: uuid.UUID
    before: dict | None
    after: dict | None
    correlation_id: str | None
    created_at: datetime
    summary: str


class PlatformAuditLogListOut(BaseModel):
    items: list[PlatformAuditLogOut]
    total: int


class OverviewRecentRequest(BaseModel):
    id: uuid.UUID
    kind: str
    name: str
    status: str
    created_at: datetime


class OverviewActivityItem(BaseModel):
    id: uuid.UUID
    summary: str
    created_at: datetime
    action: str


class SuperAdminOverviewOut(BaseModel):
    total_institutions: int
    active_institutions: int
    pending_service_requests: int
    pending_addon_requests: int
    estimated_annual_revenue: Decimal
    revenue_currency: str
    renewing_within_30_days: int
    recent_requests: list[OverviewRecentRequest]
    upcoming_renewals: list[RenewalTenantOut]
    recent_activity: list[OverviewActivityItem]


class PlatformSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    value: str
    description: str
    created_at: datetime
    updated_at: datetime


class PlatformSettingPatch(BaseModel):
    value: str = Field(max_length=2000)


class PlatformAdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    role: PlatformAdminRole
    created_at: datetime


class InvitePlatformAdminBody(BaseModel):
    email: EmailStr


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


# Used by OpenAPI docs; runtime errors go through AppError handler.
class ErrorEnvelope(BaseModel):
    error: dict[str, Any]
