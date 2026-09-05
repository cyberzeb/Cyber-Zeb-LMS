"""
Demo / development auth helpers.

Portal pickers use person_id strings (u1, u-demo-amina) rather than UUID users.
This module resolves tenant context from JWT or X-Tenant-Code header for the demo build.
"""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Role
from app.core.security import decode_token
from app.modules.lms_store.service import LmsStoreService

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

DEFAULT_DEMO_TENANT_CODE = "berana"


@dataclass(frozen=True)
class DemoPrincipal:
    tenant_id: UUID
    person_id: str
    role: Role
    frontend_role: str


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


async def get_demo_principal(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
    x_tenant_code: Optional[str] = Header(default=None, alias="X-Tenant-Code"),
) -> DemoPrincipal:
    if token:
        try:
            payload = decode_token(token)
            if payload.get("type") == "access":
                return DemoPrincipal(
                    tenant_id=UUID(payload["tenant_id"]),
                    person_id=str(payload["sub"]),
                    role=Role(payload["role"]),
                    frontend_role=str(payload.get("frontend_role", payload["role"])),
                )
        except (JWTError, KeyError, ValueError, HTTPException):
            # Stale cookies from a previous deploy must not block the demo.
            pass

    tenant_code = x_tenant_code or DEFAULT_DEMO_TENANT_CODE
    service = LmsStoreService(db)
    tenant_id = await service.ensure_tenant_id(tenant_code)

    return DemoPrincipal(
        tenant_id=tenant_id,
        person_id="admin-demo",
        role=Role.INSTITUTION_ADMIN,
        frontend_role="Admin",
    )
