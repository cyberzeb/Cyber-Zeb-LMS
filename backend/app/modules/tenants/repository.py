"""
Repository layer: raw DB access only. No business rules here -
those belong in service.py. Keeping this separation lets us swap
query strategies without touching business logic or routers.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tenants.models import Campus, Tenant


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tenant_id: uuid.UUID) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.code == code))
        return result.scalar_one_or_none()

    async def create(self, tenant: Tenant) -> Tenant:
        self.db.add(tenant)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def list_all(self, offset: int, limit: int) -> tuple[list[Tenant], int]:
        result = await self.db.execute(select(Tenant).offset(offset).limit(limit))
        items = list(result.scalars().all())
        count_result = await self.db.execute(select(Tenant))
        total = len(count_result.scalars().all())
        return items, total


class CampusRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, campus: Campus) -> Campus:
        self.db.add(campus)
        await self.db.flush()
        await self.db.refresh(campus)
        return campus

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[Campus]:
        result = await self.db.execute(select(Campus).where(Campus.tenant_id == tenant_id))
        return list(result.scalars().all())
