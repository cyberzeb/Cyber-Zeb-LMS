import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.lms_store.models import LmsCollection


class LmsCollectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(
        self, tenant_id: uuid.UUID, collection_key: str, *, for_update: bool = False
    ) -> LmsCollection | None:
        query = select(LmsCollection).where(
            LmsCollection.tenant_id == tenant_id,
            LmsCollection.collection_key == collection_key,
        )
        if for_update:
            # Row lock on PostgreSQL; SQLite serializes writers and ignores it.
            query = query.with_for_update()
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_keys(self, tenant_id: uuid.UUID) -> list[str]:
        result = await self.db.execute(
            select(LmsCollection.collection_key).where(LmsCollection.tenant_id == tenant_id)
        )
        return list(result.scalars().all())

    async def upsert(self, tenant_id: uuid.UUID, collection_key: str, data: object) -> LmsCollection:
        row = await self.get(tenant_id, collection_key)
        if row is None:
            row = LmsCollection(tenant_id=tenant_id, collection_key=collection_key, data=data)
            self.db.add(row)
        else:
            row.data = data
        await self.db.flush()
        return row

    async def delete_all_for_tenant(self, tenant_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(LmsCollection).where(LmsCollection.tenant_id == tenant_id)
        )
        for row in result.scalars().all():
            await self.db.delete(row)
        await self.db.flush()
