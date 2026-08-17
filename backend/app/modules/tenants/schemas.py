import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.tenants.models import TenantStatus, TenantType


class TenantCreate(BaseModel):
    code: str
    name: str
    tenant_type: TenantType
    timezone: str = "Africa/Addis_Ababa"
    locale: str = "en"
    currency: str = "ETB"


class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    tenant_type: TenantType
    status: TenantStatus
    timezone: str
    locale: str
    currency: str
    created_at: datetime


class CampusCreate(BaseModel):
    name: str
    code: str
    address: str | None = None


class CampusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    code: str
    address: str | None
