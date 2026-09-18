import uuid
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationAppError
from app.core.permissions import Role
from app.modules.lms_store import policy
from app.modules.lms_store.scope import ScopeContext, filter_collection
from app.modules.lms_store.repository import LmsCollectionRepository
from app.modules.tenants.repository import TenantRepository


class LmsStoreService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LmsCollectionRepository(db)
        self.tenant_repo = TenantRepository(db)

    def scope_context(self, tenant_id: uuid.UUID, person_id: str, role: Role) -> ScopeContext:
        async def loader(key: str) -> Any:
            return await self.get_collection(tenant_id, key)

        return ScopeContext(loader, person_id, role)

    async def read_collection(
        self, tenant_id: uuid.UUID, key: str, *, role: Role, person_id: str, is_admin: bool
    ) -> Any:
        data = await self.get_collection(tenant_id, key)
        if is_admin:
            return data
        return await filter_collection(key, data, self.scope_context(tenant_id, person_id, role))

    async def read_all_collections(
        self, tenant_id: uuid.UUID, *, role: Role, person_id: str, is_admin: bool
    ) -> dict[str, Any]:
        collections = await self.list_collections(tenant_id)
        if is_admin:
            return collections
        ctx = self.scope_context(tenant_id, person_id, role)
        # Seed the context cache so views reuse the rows already loaded.
        ctx._cache.update(collections)
        out: dict[str, Any] = {}
        for key, data in collections.items():
            out[key] = await filter_collection(key, data, ctx)
        return out

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
            institution_type=TenantType.COLLEGE_UNIVERSITY,
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
        await self.repo.ensure_row(tenant_id, key, data)
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

    async def patch_collection(self, tenant_id: uuid.UUID, key: str, **kwargs: Any) -> Any:
        """Apply record-level changes to the latest stored collection (no lost updates)."""
        return await self._patch_once(tenant_id, key, **kwargs)

    async def _patch_once(
        self,
        tenant_id: uuid.UUID,
        key: str,
        *,
        role: Role,
        person_id: str,
        is_admin: bool,
        upserts: list[tuple[dict[str, Any], Optional[str]]],
        deletes: list[str],
        set_entries: dict[str, Any],
        unset_keys: list[str],
    ) -> Any:
        """Apply record-level changes to the latest stored collection (no lost updates)."""
        keyed = bool(set_entries or unset_keys) or key in policy.KEYED_COLLECTIONS
        # Create the row first (race-safe), then lock it, so concurrent first
        # writes queue on the same row instead of colliding on insert.
        await self.repo.ensure_row(tenant_id, key, {} if keyed else [])
        row = await self.repo.get(tenant_id, key, for_update=True)
        ctx = self.scope_context(tenant_id, person_id, role)
        current = row.data if row is not None else ({} if keyed else [])

        try:
            if keyed:
                if not isinstance(current, dict):
                    raise ValidationAppError(f"Collection '{key}' is not a keyed collection")
                if upserts or deletes:
                    raise ValidationAppError("Use set/unset for keyed collections")
                data = dict(current)
                for entry_key, value in set_entries.items():
                    if not is_admin:
                        policy.check_keyed_change(key, person_id, entry_key)
                    data[entry_key] = value
                for entry_key in unset_keys:
                    if not is_admin:
                        policy.check_keyed_change(key, person_id, entry_key)
                    data.pop(entry_key, None)
            else:
                if not isinstance(current, list):
                    raise ValidationAppError(f"Collection '{key}' is not a list collection")
                data = list(current)
                index = {r.get("id"): i for i, r in enumerate(data) if isinstance(r, dict)}
                for record, after in upserts:
                    record_id = record.get("id")
                    if not isinstance(record_id, str) or not record_id:
                        raise ValidationAppError("Every record needs a non-empty string 'id'")
                    old = data[index[record_id]] if record_id in index else None
                    if not is_admin:
                        await policy.check_record_change(key, ctx, old, record)
                    if old is not None:
                        data[index[record_id]] = record
                        continue
                    if after is None:
                        position = 0
                    else:
                        position = next(
                            (i + 1 for i, r in enumerate(data) if isinstance(r, dict) and r.get("id") == after),
                            len(data),
                        )
                    data.insert(position, record)
                    index = {r.get("id"): i for i, r in enumerate(data) if isinstance(r, dict)}
                for record_id in deletes:
                    if record_id not in index:
                        continue
                    old = data[index[record_id]]
                    if not is_admin:
                        await policy.check_record_change(key, ctx, old, None)
                    data = [r for r in data if not (isinstance(r, dict) and r.get("id") == record_id)]
                    index = {r.get("id"): i for i, r in enumerate(data) if isinstance(r, dict)}
        except policy.PolicyViolation as exc:
            await self.db.rollback()
            raise PermissionDeniedError(str(exc)) from exc

        row = await self.repo.upsert(tenant_id, key, data)
        await self.db.commit()
        if is_admin:
            return row.data
        return await filter_collection(key, row.data, self.scope_context(tenant_id, person_id, role))

    async def bootstrap(self, tenant_code: str) -> dict[str, Any]:
        tenant = await self.tenant_repo.get_by_code(tenant_code)
        if not tenant:
            raise NotFoundError(f"Institution '{tenant_code}' not found")
        institution_type = getattr(tenant.institution_type, "value", tenant.institution_type)
        return {
            "tenant_code": tenant.code,
            "tenant_id": str(tenant.id),
            "name": tenant.name,
            "institution_type": str(institution_type),
        }
