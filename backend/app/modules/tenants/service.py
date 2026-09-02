"""
Business rules for tenant/campus/department management
(Blueprint Section 6.1 - Institution Setup Workflow).
"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.audit import write_audit_log
from app.core.exceptions import ConflictError, NotFoundError
from app.modules.tenants.models import Campus, Tenant
from app.modules.tenants.repository import CampusRepository, TenantRepository
from app.modules.tenants.schemas import CampusCreate, TenantCreate


class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TenantRepository(db)

    async def create_tenant(self, data: TenantCreate, actor_user_id: uuid.UUID) -> Tenant:
        existing = await self.repo.get_by_code(data.code)
        if existing:
            raise ConflictError(f"Tenant code '{data.code}' already exists")

        tenant = Tenant(**data.model_dump(), institution_type=data.tenant_type)
        tenant = await self.repo.create(tenant)

        await write_audit_log(
            self.db,
            tenant_id=tenant.id,
            actor_user_id=actor_user_id,
            action="tenant.created",
            resource_type="Tenant",
            resource_id=str(tenant.id),
            after_state=data.model_dump(mode="json"),
        )
        await self.db.commit()
        return tenant

    async def get_tenant(self, tenant_id: uuid.UUID) -> Tenant:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        return tenant

    async def list_tenants(self, offset: int, limit: int) -> tuple[list[Tenant], int]:
        return await self.repo.list_all(offset, limit)


class CampusService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CampusRepository(db)

    async def create_campus(self, tenant_id: uuid.UUID, data: CampusCreate) -> Campus:
        campus = Campus(tenant_id=tenant_id, **data.model_dump())
        campus = await self.repo.create(campus)
        await self.db.commit()
        return campus

    async def list_campuses(self, tenant_id: uuid.UUID) -> list[Campus]:
        return await self.repo.list_by_tenant(tenant_id)
