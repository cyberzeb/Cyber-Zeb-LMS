import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.lms_store.repository import LmsCollectionRepository
from app.modules.tenants.repository import TenantRepository


class LmsStoreService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LmsCollectionRepository(db)
        self.tenant_repo = TenantRepository(db)

    async def resolve_tenant_id(self, tenant_code: str) -> uuid.UUID:
        tenant = await self.tenant_repo.get_by_code(tenant_code)
        if not tenant:
            raise NotFoundError(f"Institution '{tenant_code}' not found")
        return tenant.id

    async def ensure_tenant_id(self, tenant_code: str) -> uuid.UUID:
        """Resolve tenant, creating the demo institution if the database is empty."""
        tenant = await self.tenant_repo.get_by_code(tenant_code)
        if tenant:
            return tenant.id

        from app.modules.tenants.models import Tenant, TenantStatus, TenantType

        tenant = Tenant(
            code=tenant_code,
            name="Berana University" if tenant_code == "berana" else tenant_code,
            tenant_type=TenantType.COLLEGE_UNIVERSITY,
            status=TenantStatus.ACTIVE,
            timezone="Africa/Addis_Ababa",
            locale="en",
            currency="ETB",
            settings={"demo": True},
            slug=tenant_code,
        )
        self.db.add(tenant)
        await self.db.commit()
        await self.db.refresh(tenant)
        return tenant.id

    async def get_collection(self, tenant_id: uuid.UUID, key: str, default: Any = None) -> Any:
        row = await self.repo.get(tenant_id, key)
        if row is None:
            return [] if default is None else default
        return row.data

    async def put_collection(self, tenant_id: uuid.UUID, key: str, data: Any) -> Any:
        row = await self.repo.upsert(tenant_id, key, data)
        await self.db.commit()
        return row.data

    async def list_collections(self, tenant_id: uuid.UUID) -> dict[str, Any]:
        keys = await self.repo.list_keys(tenant_id)
        out: dict[str, Any] = {}
        for key in keys:
            row = await self.repo.get(tenant_id, key)
            if row:
                out[key] = row.data
        return out

    async def seed_collections(self, tenant_id: uuid.UUID, collections: dict[str, Any]) -> int:
        await self.repo.delete_all_for_tenant(tenant_id)
        for key, data in collections.items():
            await self.repo.upsert(tenant_id, key, data)
        await self.db.commit()
        return len(collections)

    async def bootstrap(self, tenant_code: str) -> dict[str, Any]:
        tenant = await self.tenant_repo.get_by_code(tenant_code)
        if not tenant:
            raise NotFoundError(f"Institution '{tenant_code}' not found")
        people = await self.get_collection(tenant.id, "people", [])
        return {
            "tenant_code": tenant.code,
            "tenant_id": str(tenant.id),
            "people": people if isinstance(people, list) else [],
        }
