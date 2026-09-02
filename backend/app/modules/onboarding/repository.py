"""Repository helpers for onboarding entities."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.onboarding.models import (
    AddOnModuleRequest,
    EmailLog,
    EmailStatus,
    InstitutionAdminAccount,
    ModuleCatalogItem,
    PlatformAdminUser,
    PlatformAuditLog,
    PlatformSetting,
    ServiceRequest,
    ServiceRequestStatus,
    SiteContentBlock,
)
from app.modules.tenants.models import Tenant, TenantStatus


class OnboardingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_platform_admin_by_email(self, email: str) -> PlatformAdminUser | None:
        result = await self.db.execute(
            select(PlatformAdminUser).where(PlatformAdminUser.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_platform_admin_by_id(self, admin_id: uuid.UUID) -> PlatformAdminUser | None:
        result = await self.db.execute(
            select(PlatformAdminUser).where(PlatformAdminUser.id == admin_id)
        )
        return result.scalar_one_or_none()

    async def list_platform_admins(self) -> list[PlatformAdminUser]:
        result = await self.db.execute(
            select(PlatformAdminUser).order_by(PlatformAdminUser.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_service_request_by_idempotency(
        self, key: str
    ) -> ServiceRequest | None:
        result = await self.db.execute(
            select(ServiceRequest)
            .options(selectinload(ServiceRequest.email_logs))
            .where(ServiceRequest.idempotency_key == key)
        )
        return result.scalar_one_or_none()

    async def get_service_request(self, request_id: uuid.UUID) -> ServiceRequest | None:
        result = await self.db.execute(
            select(ServiceRequest)
            .options(selectinload(ServiceRequest.email_logs))
            .where(ServiceRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    async def list_service_requests(
        self,
        *,
        status: ServiceRequestStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[ServiceRequest], int]:
        filters = []
        if status is not None:
            filters.append(ServiceRequest.status == status)

        count_q = select(func.count()).select_from(ServiceRequest)
        list_q = (
            select(ServiceRequest)
            .options(selectinload(ServiceRequest.email_logs))
            .order_by(ServiceRequest.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if filters:
            count_q = count_q.where(*filters)
            list_q = list_q.where(*filters)

        total = (await self.db.execute(count_q)).scalar_one()
        items = list((await self.db.execute(list_q)).scalars().all())
        return items, total

    async def list_addon_requests(
        self,
        *,
        status: ServiceRequestStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[AddOnModuleRequest], int]:
        filters = []
        if status is not None:
            filters.append(AddOnModuleRequest.status == status)
        count_q = select(func.count()).select_from(AddOnModuleRequest)
        list_q = (
            select(AddOnModuleRequest)
            .options(selectinload(AddOnModuleRequest.email_logs))
            .order_by(AddOnModuleRequest.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if filters:
            count_q = count_q.where(*filters)
            list_q = list_q.where(*filters)
        total = (await self.db.execute(count_q)).scalar_one()
        items = list((await self.db.execute(list_q)).scalars().all())
        return items, total

    async def get_addon_request(self, request_id: uuid.UUID) -> AddOnModuleRequest | None:
        result = await self.db.execute(
            select(AddOnModuleRequest)
            .options(selectinload(AddOnModuleRequest.email_logs))
            .where(AddOnModuleRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    async def get_addon_request_by_idempotency(self, key: str) -> AddOnModuleRequest | None:
        result = await self.db.execute(
            select(AddOnModuleRequest)
            .options(selectinload(AddOnModuleRequest.email_logs))
            .where(AddOnModuleRequest.idempotency_key == key)
        )
        return result.scalar_one_or_none()

    async def get_latest_failed_email_for_service_request(
        self, service_request_id: uuid.UUID
    ) -> EmailLog | None:
        result = await self.db.execute(
            select(EmailLog)
            .where(
                EmailLog.service_request_id == service_request_id,
                EmailLog.status == EmailStatus.FAILED,
            )
            .order_by(EmailLog.sent_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_latest_failed_email_for_addon(
        self, addon_module_request_id: uuid.UUID
    ) -> EmailLog | None:
        result = await self.db.execute(
            select(EmailLog)
            .where(
                EmailLog.addon_module_request_id == addon_module_request_id,
                EmailLog.status == EmailStatus.FAILED,
            )
            .order_by(EmailLog.sent_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_tenant_by_service_request(
        self, service_request_id: uuid.UUID
    ) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant).where(Tenant.service_request_id == service_request_id)
        )
        return result.scalar_one_or_none()

    async def slug_taken(self, slug: str) -> bool:
        result = await self.db.execute(
            select(Tenant.id).where((Tenant.slug == slug) | (Tenant.code == slug))
        )
        return result.scalar_one_or_none() is not None

    async def get_tenant_by_slug(self, slug: str) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant).where((Tenant.slug == slug) | (Tenant.code == slug))
        )
        return result.scalar_one_or_none()

    async def find_tenant_for_addon(self, lookup: str) -> Tenant | None:
        normalized = lookup.lower().strip()
        result = await self.db.execute(
            select(Tenant)
            .join(InstitutionAdminAccount, InstitutionAdminAccount.tenant_id == Tenant.id, isouter=True)
            .where(
                or_(
                    Tenant.slug == normalized,
                    Tenant.code == normalized,
                    InstitutionAdminAccount.email == normalized,
                )
            )
        )
        return result.scalars().first()

    async def get_institution_admin_for_tenant(
        self, tenant_id: uuid.UUID
    ) -> InstitutionAdminAccount | None:
        result = await self.db.execute(
            select(InstitutionAdminAccount).where(
                InstitutionAdminAccount.tenant_id == tenant_id
            )
        )
        return result.scalar_one_or_none()

    async def list_tenants(self) -> list[Tenant]:
        result = await self.db.execute(select(Tenant).order_by(Tenant.name.asc()))
        return list(result.scalars().all())

    async def count_tenants(self, *, status: TenantStatus | None = None) -> int:
        q = select(func.count()).select_from(Tenant)
        if status is not None:
            q = q.where(Tenant.status == status)
        return (await self.db.execute(q)).scalar_one()

    async def count_service_requests(self, *, status: ServiceRequestStatus | None = None) -> int:
        q = select(func.count()).select_from(ServiceRequest)
        if status is not None:
            q = q.where(ServiceRequest.status == status)
        return (await self.db.execute(q)).scalar_one()

    async def count_addon_requests(self, *, status: ServiceRequestStatus | None = None) -> int:
        q = select(func.count()).select_from(AddOnModuleRequest)
        if status is not None:
            q = q.where(AddOnModuleRequest.status == status)
        return (await self.db.execute(q)).scalar_one()

    async def write_platform_audit(self, entry: PlatformAuditLog) -> None:
        self.db.add(entry)
        await self.db.flush()

    async def add_email_log(self, entry: EmailLog) -> EmailLog:
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def list_module_catalog(self, *, active_only: bool = False) -> list[ModuleCatalogItem]:
        q = select(ModuleCatalogItem).order_by(ModuleCatalogItem.is_core.desc(), ModuleCatalogItem.display_name)
        if active_only:
            q = q.where(ModuleCatalogItem.is_active.is_(True))
        return list((await self.db.execute(q)).scalars().all())

    async def get_module_catalog_item(self, item_id: uuid.UUID) -> ModuleCatalogItem | None:
        result = await self.db.execute(select(ModuleCatalogItem).where(ModuleCatalogItem.id == item_id))
        return result.scalar_one_or_none()

    async def get_module_catalog_by_key(self, key: str) -> ModuleCatalogItem | None:
        result = await self.db.execute(select(ModuleCatalogItem).where(ModuleCatalogItem.key == key))
        return result.scalar_one_or_none()

    async def list_renewal_tenants(self, *, before: date | None) -> list[Tenant]:
        q = select(Tenant).where(Tenant.renewal_date.is_not(None)).order_by(Tenant.renewal_date.asc())
        if before is not None:
            q = q.where(Tenant.renewal_date <= before)
        return list((await self.db.execute(q)).scalars().all())

    async def mark_expired_tenants(self, today: date) -> int:
        tenants = list(
            (
                await self.db.execute(
                    select(Tenant).where(
                        Tenant.renewal_date < today,
                        Tenant.status == TenantStatus.ACTIVE,
                    )
                )
            )
            .scalars()
            .all()
        )
        for tenant in tenants:
            tenant.status = TenantStatus.EXPIRED
        return len(tenants)

    async def list_site_content_blocks(
        self, *, active_only: bool = False
    ) -> list[SiteContentBlock]:
        q = select(SiteContentBlock).order_by(SiteContentBlock.key.asc())
        if active_only:
            q = q.where(SiteContentBlock.is_active.is_(True))
        return list((await self.db.execute(q)).scalars().all())

    async def get_site_content_by_key(self, key: str) -> SiteContentBlock | None:
        result = await self.db.execute(
            select(SiteContentBlock).where(SiteContentBlock.key == key)
        )
        return result.scalar_one_or_none()

    async def get_site_content_by_id(self, block_id: uuid.UUID) -> SiteContentBlock | None:
        result = await self.db.execute(
            select(SiteContentBlock).where(SiteContentBlock.id == block_id)
        )
        return result.scalar_one_or_none()

    async def list_platform_settings(self) -> list[PlatformSetting]:
        result = await self.db.execute(
            select(PlatformSetting).order_by(PlatformSetting.key.asc())
        )
        return list(result.scalars().all())

    async def get_platform_setting(self, key: str) -> PlatformSetting | None:
        result = await self.db.execute(
            select(PlatformSetting).where(PlatformSetting.key == key)
        )
        return result.scalar_one_or_none()

    async def list_audit_logs(
        self,
        *,
        action: str | None,
        since: datetime | None,
        until: datetime | None,
        offset: int,
        limit: int,
    ) -> tuple[list[PlatformAuditLog], int]:
        filters = []
        if action:
            filters.append(PlatformAuditLog.action == action)
        if since is not None:
            filters.append(PlatformAuditLog.created_at >= since)
        if until is not None:
            filters.append(PlatformAuditLog.created_at <= until)
        count_q = select(func.count()).select_from(PlatformAuditLog)
        list_q = (
            select(PlatformAuditLog)
            .order_by(PlatformAuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if filters:
            count_q = count_q.where(*filters)
            list_q = list_q.where(*filters)
        total = (await self.db.execute(count_q)).scalar_one()
        items = list((await self.db.execute(list_q)).scalars().all())
        return items, total

    async def list_email_logs(
        self,
        *,
        status: EmailStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[EmailLog], int]:
        filters = []
        if status is not None:
            filters.append(EmailLog.status == status)
        count_q = select(func.count()).select_from(EmailLog)
        list_q = (
            select(EmailLog).order_by(EmailLog.sent_at.desc()).offset(offset).limit(limit)
        )
        if filters:
            count_q = count_q.where(*filters)
            list_q = list_q.where(*filters)
        total = (await self.db.execute(count_q)).scalar_one()
        items = list((await self.db.execute(list_q)).scalars().all())
        return items, total

    async def get_tenant_by_id(self, tenant_id: uuid.UUID) -> "Tenant | None":
        from app.modules.tenants.models import Tenant
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def list_audit_logs_by_actions(
        self,
        *,
        actions: list[str] | None,
        since: "datetime | None",
        until: "datetime | None",
        offset: int,
        limit: int,
    ) -> "tuple[list[PlatformAuditLog], int]":
        """Like list_audit_logs but accepts a list of action codes (OR match)."""
        from sqlalchemy import or_
        filters = []
        if actions:
            filters.append(or_(*[PlatformAuditLog.action == a for a in actions]))
        if since is not None:
            filters.append(PlatformAuditLog.created_at >= since)
        if until is not None:
            filters.append(PlatformAuditLog.created_at <= until)
        count_q = select(func.count()).select_from(PlatformAuditLog)
        list_q = (
            select(PlatformAuditLog)
            .order_by(PlatformAuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if filters:
            count_q = count_q.where(*filters)
            list_q = list_q.where(*filters)
        total = (await self.db.execute(count_q)).scalar_one()
        items = list((await self.db.execute(list_q)).scalars().all())
        return items, total
