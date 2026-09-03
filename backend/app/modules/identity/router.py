import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import Principal, get_current_principal, require_roles
from app.core.permissions import Role
from app.modules.identity.schemas import (
    DemoLoginRequest,
    DemoLoginResponse,
    EmailLookupRequest,
    EmailLookupResponse,
    LoginRequest,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
    RefreshRequest,
    TokenPair,
    UserCreate,
    UserOut,
)
from app.modules.identity.otp_service import OtpAuthService
from app.modules.identity.service import AuthService, UserService

router = APIRouter()


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(payload)


@router.post("/demo-login", response_model=DemoLoginResponse)
async def demo_login(payload: DemoLoginRequest, db: AsyncSession = Depends(get_db)):
    from app.core.demo_auth import map_frontend_role
    from app.core.exceptions import NotFoundError, ValidationAppError
    from app.core.security import create_access_token, create_refresh_token
    from app.modules.lms_store.service import LmsStoreService

    service = LmsStoreService(db)
    tenant_id = await service.resolve_tenant_id(payload.tenant_code)
    people = await service.get_collection(tenant_id, "people", [])
    if not isinstance(people, list):
        raise ValidationAppError("People collection is invalid")

    person = next((p for p in people if isinstance(p, dict) and p.get("id") == payload.person_id), None)
    if not person:
        raise NotFoundError("Person not found")

    frontend_role = str(person.get("role", "Student"))
    backend_role = map_frontend_role(frontend_role)
    claims = {
        "tenant_id": str(tenant_id),
        "role": backend_role.value,
        "frontend_role": frontend_role,
    }
    access = create_access_token(subject=payload.person_id, extra_claims=claims)
    refresh = create_refresh_token(subject=payload.person_id)
    return DemoLoginResponse(
        access_token=access,
        refresh_token=refresh,
        person_id=payload.person_id,
        frontend_role=frontend_role,
        display_name=str(person.get("name", "")),
    )


@router.post("/otp/lookup", response_model=EmailLookupResponse)
async def lookup_email(payload: EmailLookupRequest, db: AsyncSession = Depends(get_db)):
    """Identify an email before OTP: returns role, tenant, and edition hints."""
    service = OtpAuthService(db)
    return await service.lookup_email(payload.email)


@router.post("/otp/send", response_model=OtpSendResponse)
async def send_otp(payload: OtpSendRequest, db: AsyncSession = Depends(get_db)):
    service = OtpAuthService(db)
    if payload.role == "SuperAdmin":
        result = await service.send_super_admin_code(payload.email)
    else:
        result = await service.send_code(payload.tenant_code, payload.email, payload.role)
    return OtpSendResponse(**result)


@router.post("/otp/verify", response_model=OtpVerifyResponse)
async def verify_otp(payload: OtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    service = OtpAuthService(db)
    if payload.role == "SuperAdmin":
        result = await service.verify_super_admin_code(payload.email, payload.code)
    else:
        result = await service.verify_code(payload.tenant_code, payload.email, payload.role, payload.code)
    return OtpVerifyResponse(**result)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.refresh(payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(principal: Principal = Depends(get_current_principal)):
    # TODO: add refresh-token/session blacklist (Redis) once session store lands.
    return None


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(
        require_roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN, Role.DEPARTMENT_ADMIN)
    ),
):
    """Section 6.1 step 6 - invite/import users; validate duplicates."""
    service = UserService(db)
    return await service.create_user(principal.tenant_id, payload, actor_user_id=principal.user_id)


@router.get("/users/me", response_model=UserOut)
async def get_me(
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    service = UserService(db)
    return await service.get_user(principal.user_id)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(
        require_roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN, Role.DEPARTMENT_ADMIN)
    ),
):
    service = UserService(db)
    return await service.get_user(user_id)
