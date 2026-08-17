import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import Page, PaginationParams
from app.core.database import get_db
from app.core.dependencies import Principal, require_roles
from app.core.permissions import Role
from app.modules.tenants.schemas import CampusCreate, CampusOut, TenantCreate, TenantOut
from app.modules.tenants.service import CampusService, TenantService

router = APIRouter()


@router.post("", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles(Role.PLATFORM_SUPER_ADMIN)),
):
    """Section 6.1 step 1 - only Platform Super Administrators create tenants."""
    service = TenantService(db)
    return await service.create_tenant(payload, actor_user_id=principal.user_id)


@router.get("/{tenant_id}", response_model=TenantOut)
async def get_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(
        require_roles(Role.PLATFORM_SUPER_ADMIN, Role.INSTITUTION_ADMIN)
    ),
):
    service = TenantService(db)
    return await service.get_tenant(tenant_id)


@router.get("", response_model=Page[TenantOut])
async def list_tenants(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles(Role.PLATFORM_SUPER_ADMIN)),
):
    service = TenantService(db)
    items, total = await service.list_tenants(pagination.offset, pagination.page_size)
    return Page(items=items, total=total, page=pagination.page, page_size=pagination.page_size)


@router.post("/{tenant_id}/campuses", response_model=CampusOut, status_code=status.HTTP_201_CREATED)
async def create_campus(
    tenant_id: uuid.UUID,
    payload: CampusCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles(Role.INSTITUTION_ADMIN)),
):
    """Section 6.1 step 3 - create campuses/faculties/departments/business units."""
    service = CampusService(db)
    return await service.create_campus(tenant_id, payload)


@router.get("/{tenant_id}/campuses", response_model=list[CampusOut])
async def list_campuses(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(
        require_roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN, Role.DEPARTMENT_ADMIN)
    ),
):
    service = CampusService(db)
    return await service.list_campuses(tenant_id)
