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
    invoice_amount: Decimal = Field(gt=0)
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
    created_at: datetime
    updated_at: datetime


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


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


# Used by OpenAPI docs; runtime errors go through AppError handler.
class ErrorEnvelope(BaseModel):
    error: dict[str, Any]
