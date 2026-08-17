"""
Onboarding / Super Admin routes.

Public: POST /service-requests, POST /auth/super-admin/login
Protected (platform super_admin only): list/get/actions on service-requests
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Header, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import PlatformPrincipal, require_platform_super_admin
from app.modules.onboarding.models import ServiceRequestStatus
from app.modules.onboarding.schemas import (
    AddOnModuleRequestCreate,
    AddOnModuleRequestListOut,
    AddOnModuleRequestOut,
    ActivateResponse,
    ModuleCatalogItemOut,
    ModuleCatalogPatch,
    ModuleCatalogUpsert,
    RejectBody,
    RenewalTenantOut,
    SendInvoiceBody,
    ServiceRequestCreate,
    ServiceRequestListOut,
    ServiceRequestOut,
    SuperAdminLoginRequest,
    SuperAdminTokenResponse,
)
from app.modules.onboarding.service import OnboardingService

router = APIRouter()


@router.post(
    "/auth/super-admin/login",
    response_model=SuperAdminTokenResponse,
    tags=["Super Admin Auth"],
)
async def super_admin_login(
    payload: SuperAdminLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate PlatformAdminUser only — never InstitutionAdminAccount."""
    service = OnboardingService(db)
    return await service.login_super_admin(payload)


@router.post(
    "/service-requests",
    response_model=ServiceRequestOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Service Requests"],
)
async def create_service_request(
    payload: ServiceRequestCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
):
    service = OnboardingService(db)
    return await service.create_service_request(
        payload,
        idempotency_key=idempotency_key,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.get(
    "/modules",
    response_model=list[ModuleCatalogItemOut],
    tags=["Module Catalog"],
)
async def list_public_modules(db: AsyncSession = Depends(get_db)):
    service = OnboardingService(db)
    return await service.list_module_catalog(active_only=True)


@router.post(
    "/addon-module-requests",
    response_model=AddOnModuleRequestOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Add-On Module Requests"],
)
async def create_addon_module_request(
    payload: AddOnModuleRequestCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
):
    service = OnboardingService(db)
    return await service.create_addon_request(
        payload,
        idempotency_key=idempotency_key,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.get(
    "/tenants/by-subdomain/{slug}",
    response_model=RenewalTenantOut,
    tags=["Tenants"],
)
async def resolve_tenant_by_subdomain(slug: str, db: AsyncSession = Depends(get_db)):
    service = OnboardingService(db)
    return await service.resolve_tenant_by_subdomain(slug)


@router.get(
    "/service-requests",
    response_model=ServiceRequestListOut,
    tags=["Service Requests"],
)
async def list_service_requests(
    status_filter: ServiceRequestStatus | None = Query(None, alias="status"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    items, total = await service.list_service_requests(
        status=status_filter, offset=offset, limit=limit
    )
    return ServiceRequestListOut(items=items, total=total)


@router.get(
    "/super-admin/modules",
    response_model=list[ModuleCatalogItemOut],
    tags=["Module Catalog"],
)
async def list_super_admin_modules(
    db: AsyncSession = Depends(get_db),
    _principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.list_module_catalog(active_only=False)


@router.post(
    "/super-admin/modules",
    response_model=ModuleCatalogItemOut,
    tags=["Module Catalog"],
)
async def create_super_admin_module(
    payload: ModuleCatalogUpsert,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    from app.modules.onboarding.repository import OnboardingRepository
    from app.core.exceptions import NotFoundError

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        raise NotFoundError("Platform admin not found")
    service = OnboardingService(db)
    return await service.create_module_catalog_item(
        payload,
        admin=admin,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.patch(
    "/super-admin/modules/{item_id}",
    response_model=ModuleCatalogItemOut,
    tags=["Module Catalog"],
)
async def update_super_admin_module(
    item_id: uuid.UUID,
    payload: ModuleCatalogPatch,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    from app.modules.onboarding.repository import OnboardingRepository
    from app.core.exceptions import NotFoundError

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        raise NotFoundError("Platform admin not found")
    service = OnboardingService(db)
    return await service.update_module_catalog_item(
        item_id,
        payload,
        admin=admin,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.get(
    "/addon-module-requests",
    response_model=AddOnModuleRequestListOut,
    tags=["Add-On Module Requests"],
)
async def list_addon_module_requests(
    status_filter: ServiceRequestStatus | None = Query(None, alias="status"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    items, total = await service.list_addon_requests(
        status=status_filter, offset=offset, limit=limit
    )
    return AddOnModuleRequestListOut(items=items, total=total)


@router.get(
    "/service-requests/{request_id}",
    response_model=ServiceRequestOut,
    tags=["Service Requests"],
)
async def get_service_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.get_service_request(request_id)


@router.post(
    "/service-requests/{request_id}/send-invoice",
    response_model=ServiceRequestOut,
    tags=["Service Requests"],
)
async def send_invoice(
    request_id: uuid.UUID,
    body: SendInvoiceBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    from app.modules.onboarding.repository import OnboardingRepository

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Platform admin not found")
    service = OnboardingService(db)
    return await service.send_invoice(
        request_id,
        body,
        admin=admin,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.post(
    "/service-requests/{request_id}/confirm-payment",
    response_model=ServiceRequestOut,
    tags=["Service Requests"],
)
async def confirm_payment(
    request_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    from app.modules.onboarding.repository import OnboardingRepository

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Platform admin not found")
    service = OnboardingService(db)
    return await service.confirm_payment(
        request_id,
        admin=admin,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.post(
    "/service-requests/{request_id}/activate",
    response_model=ActivateResponse,
    tags=["Service Requests"],
)
async def activate_service_request(
    request_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    """
    Idempotent activation: a second call returns the existing tenant.
    Idempotency-Key is accepted for clients that always send one on
    replay-sensitive commands; server-side uniqueness is enforced by
    service_request_id on tenants.
    """
    _ = idempotency_key  # reserved for future request-level replay cache
    from app.modules.onboarding.repository import OnboardingRepository

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Platform admin not found")
    service = OnboardingService(db)
    return await service.activate(
        request_id,
        admin=admin,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.post(
    "/service-requests/{request_id}/reject",
    response_model=ServiceRequestOut,
    tags=["Service Requests"],
)
async def reject_service_request(
    request_id: uuid.UUID,
    body: RejectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    from app.modules.onboarding.repository import OnboardingRepository

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Platform admin not found")
    service = OnboardingService(db)
    return await service.reject(
        request_id,
        reason=body.rejection_reason,
        admin=admin,
        correlation_id=getattr(request.state, "correlation_id", None),
    )


async def _current_admin(db: AsyncSession, principal: PlatformPrincipal):
    from app.core.exceptions import NotFoundError
    from app.modules.onboarding.repository import OnboardingRepository

    admin = await OnboardingRepository(db).get_platform_admin_by_id(principal.admin_id)
    if admin is None:
        raise NotFoundError("Platform admin not found")
    return admin


@router.post(
    "/addon-module-requests/{request_id}/send-invoice",
    response_model=AddOnModuleRequestOut,
    tags=["Add-On Module Requests"],
)
async def send_addon_invoice(
    request_id: uuid.UUID,
    body: SendInvoiceBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.send_addon_invoice(
        request_id,
        body,
        admin=await _current_admin(db, principal),
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.post(
    "/addon-module-requests/{request_id}/confirm-payment",
    response_model=AddOnModuleRequestOut,
    tags=["Add-On Module Requests"],
)
async def confirm_addon_payment(
    request_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.confirm_addon_payment(
        request_id,
        admin=await _current_admin(db, principal),
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.post(
    "/addon-module-requests/{request_id}/activate",
    response_model=AddOnModuleRequestOut,
    tags=["Add-On Module Requests"],
)
async def activate_addon_request(
    request_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.activate_addon_request(
        request_id,
        admin=await _current_admin(db, principal),
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.get(
    "/super-admin/renewals",
    response_model=list[RenewalTenantOut],
    tags=["Subscriptions"],
)
async def list_renewals(
    days: int | None = Query(30, ge=0),
    db: AsyncSession = Depends(get_db),
    _principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.list_renewals(days=days)


@router.post(
    "/super-admin/tenants/{tenant_id}/renew",
    response_model=RenewalTenantOut,
    tags=["Subscriptions"],
)
async def mark_renewed(
    tenant_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.mark_tenant_renewed(
        tenant_id,
        admin=await _current_admin(db, principal),
        correlation_id=getattr(request.state, "correlation_id", None),
    )


@router.post(
    "/super-admin/subscriptions/expire-overdue",
    response_model=dict[str, int],
    tags=["Subscriptions"],
)
async def expire_overdue(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _principal: PlatformPrincipal = Depends(require_platform_super_admin),
):
    service = OnboardingService(db)
    return await service.expire_overdue_tenants(
        correlation_id=getattr(request.state, "correlation_id", None)
    )
