"""
Shared FastAPI dependencies.

Every module router should depend on `get_current_principal` (or the
role-scoped wrapper `require_roles`) rather than re-implementing auth
parsing. This is the single point where JWT claims become a trusted
request-scoped identity + tenant context (Section 17.3 - Multi-Tenant Rule).
"""
from dataclasses import dataclass
from typing import Iterable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.permissions import Role
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@dataclass(frozen=True)
class Principal:
    """Trusted, request-scoped identity derived from a verified JWT."""
    user_id: UUID
    tenant_id: UUID
    role: Role


async def get_current_principal(token: str = Depends(oauth2_scheme)) -> Principal:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    try:
        return Principal(
            user_id=UUID(payload["sub"]),
            tenant_id=UUID(payload["tenant_id"]),
            role=Role(payload["role"]),
        )
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token claims")


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
