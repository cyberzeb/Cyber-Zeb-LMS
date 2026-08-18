"""
Shared FastAPI dependencies.

Every module router should depend on `get_current_principal` (or the
role-scoped wrapper `require_roles`) rather than re-implementing auth
parsing. This is the single point where JWT claims become a trusted
request-scoped identity + tenant context (Section 17.3 - Multi-Tenant Rule).

Platform Super Admin tokens are a separate principal type — they must
never authenticate institution-admin routes, and institution tokens must
never authenticate super-admin routes.
"""
from dataclasses import dataclass
from typing import Iterable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Role
from app.core.security import decode_token
from app.modules.tenants.models import Tenant, TenantStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_super_admin = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/super-admin/login"
)


@dataclass(frozen=True)
class Principal:
    """Trusted, request-scoped identity derived from a verified JWT."""
    user_id: UUID
    tenant_id: UUID
    role: Role


@dataclass(frozen=True)
class PlatformPrincipal:
    """Trusted Super Admin identity — no tenant_id by design."""
    admin_id: UUID
    email: str
    role: str  # "super_admin"


def _decode_access_payload(token: str) -> dict:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type"
        )
    return payload


async def get_current_principal(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Principal:
    payload = _decode_access_payload(token)

    # Reject platform-admin tokens on tenant routes.
    if payload.get("principal_type") == "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin token cannot access tenant-scoped routes",
        )

    try:
        principal = Principal(
            user_id=UUID(payload["sub"]),
            tenant_id=UUID(payload["tenant_id"]),
            role=Role(payload["role"]),
        )
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token claims"
        )
    result = await db.execute(select(Tenant.status).where(Tenant.id == principal.tenant_id))
    tenant_status = result.scalar_one_or_none()
    if tenant_status == TenantStatus.EXPIRED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your institution subscription has expired. Please contact Cyber-Zeb Consulting to renew.",
        )
    return principal


async def get_current_platform_admin(
    token: str = Depends(oauth2_scheme_super_admin),
) -> PlatformPrincipal:
    payload = _decode_access_payload(token)

    if payload.get("principal_type") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Institution credentials cannot access super-admin routes",
        )
    if payload.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action",
        )
    try:
        return PlatformPrincipal(
            admin_id=UUID(payload["sub"]),
            email=str(payload.get("email", "")),
            role="super_admin",
        )
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token claims"
        )


def require_platform_super_admin(
    principal: PlatformPrincipal = Depends(get_current_platform_admin),
) -> PlatformPrincipal:
    return principal


def require_roles(*allowed_roles: Role):
    """
    Route-level guard factory.
    Usage: Depends(require_roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN))
    """

    def _check(principal: Principal = Depends(get_current_principal)) -> Principal:
        if principal.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return principal

    return _check


def scoped_to_tenant(tenant_id_param: UUID, principal: Principal) -> None:
    """
    Call inside services when a resource carries an explicit tenant_id
    (e.g. from a path or another entity) to guarantee it matches the
    caller's own tenant. Platform super admins are exempt by design,
    but that exemption must be logged (see app.common.audit).
    """
    if principal.role == Role.PLATFORM_SUPER_ADMIN:
        return
    if tenant_id_param != principal.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access denied")
