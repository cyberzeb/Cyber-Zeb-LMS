"""
Portal authentication for the LMS data store.

Portal users are records in the tenant's `people` collection, identified by
person_id strings (u1, u-demo-amina) rather than UUID users, so they get their
own principal type. Tenant and role always come from the verified JWT — never
from a header or query parameter supplied by the caller.
"""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Role
from app.core.security import decode_token

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

DEFAULT_DEMO_TENANT_CODE = "berana"

# Roles that administer a tenant's LMS data (full read/write on every collection).
TENANT_ADMIN_ROLES = frozenset({Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN, Role.TRAINING_ADMIN})


@dataclass(frozen=True)
class DemoPrincipal:
    tenant_id: UUID
    person_id: str
    role: Role
    frontend_role: str

    @property
    def is_tenant_admin(self) -> bool:
        return self.role in TENANT_ADMIN_ROLES


# Clearer name for new code; DemoPrincipal is kept for existing imports.
TenantPrincipal = DemoPrincipal


def map_frontend_role(role: str) -> Role:
    mapping = {
        "Student": Role.STUDENT,
        "Instructor": Role.INSTRUCTOR,
        "Admin": Role.INSTITUTION_ADMIN,
        "Registrar": Role.ACADEMIC_ADMIN,
        "AcademicAdmin": Role.ACADEMIC_ADMIN,
        "FinanceAdmin": Role.FINANCE_OFFICER,
        "Guardian": Role.PARENT_GUARDIAN,
        "Staff": Role.DEPARTMENT_ADMIN,
        "HeadOfDepartment": Role.DEPARTMENT_ADMIN,
        "HelpDesk": Role.SUPPORT_AGENT,
    }
    return mapping.get(role, Role.STUDENT)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_demo_principal(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
) -> DemoPrincipal:
    """Require a valid portal access token; the tenant is taken from its claims."""
    from app.modules.tenants.models import Tenant, TenantStatus

    if not token:
        raise _unauthorized("Not authenticated")
    try:
        payload = decode_token(token)
    except JWTError:
        raise _unauthorized("Session expired or invalid. Please sign in again.")

    if payload.get("type") != "access":
        raise _unauthorized("Invalid token type")
    if payload.get("principal_type") == "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin token cannot access tenant data",
        )

    try:
        principal = DemoPrincipal(
            tenant_id=UUID(payload["tenant_id"]),
            person_id=str(payload["sub"]),
            role=Role(payload["role"]),
            frontend_role=str(payload.get("frontend_role", payload["role"])),
        )
    except (KeyError, ValueError):
        raise _unauthorized("Malformed token claims")

    tenant_status = (
        await db.execute(select(Tenant.status).where(Tenant.id == principal.tenant_id))
    ).scalar_one_or_none()
    if tenant_status is None:
        raise _unauthorized("Institution no longer exists")
    if tenant_status == TenantStatus.EXPIRED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your institution subscription has expired. Please contact Cyber-Zeb Consulting to renew.",
        )
    return principal


get_tenant_principal = get_demo_principal


def require_portal_roles(*allowed: Role):
    """Route guard for portal endpoints (tenant admins are always allowed)."""

    def _check(principal: DemoPrincipal = Depends(get_demo_principal)) -> DemoPrincipal:
        if principal.is_tenant_admin or principal.role in allowed:
            return principal
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action",
        )

    return _check
