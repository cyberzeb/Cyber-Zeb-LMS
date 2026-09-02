import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.permissions import Role
from app.modules.identity.models import UserStatus


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_code: str  # Multi-tenant login: user must specify which institution


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserCreate(BaseModel):
    email: EmailStr
    display_name: str
    password: str
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str | None
    display_name: str
    status: UserStatus


class PasswordResetRequest(BaseModel):
    email: EmailStr
    tenant_code: str


class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str


# --- Demo / portal OTP auth (bridges the demo frontend to the backend) ---
class DemoLoginRequest(BaseModel):
    person_id: str
    tenant_code: str = "berana"


class DemoLoginResponse(TokenPair):
    person_id: str
    frontend_role: str
    display_name: str


class OtpSendRequest(BaseModel):
    email: EmailStr
    role: str
    tenant_code: str = "berana"


class OtpSendResponse(BaseModel):
    message: str
    email: str
    role: str
    expires_in_seconds: int
    demo_code: str | None = None


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    role: str
    code: str
    tenant_code: str = "berana"


class OtpVerifyResponse(TokenPair):
    person_id: str
    frontend_role: str
    display_name: str
