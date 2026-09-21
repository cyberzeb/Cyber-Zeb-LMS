import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.core.dependencies import PlatformPrincipal, require_platform_super_admin
from app.core.modules import assert_collection_allowed, locked_collections_for
from app.modules.lms_store.schemas import (
    BootstrapOut,
    CollectionOut,
    CollectionPatch,
    CollectionPut,
    SeedPayload,
)
from app.modules.lms_store.service import LmsStoreService

router = APIRouter()

COLLECTION_KEY_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")


def _valid_key(collection_key: str) -> str:
    if not COLLECTION_KEY_PATTERN.match(collection_key):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid collection key")
    return collection_key


@router.get("/bootstrap", response_model=BootstrapOut)
async def bootstrap(
    tenant_code: str = "berana",
    db: AsyncSession = Depends(get_db),
):
    """Public tenant info for the login screen. Contains no personal data."""
    service = LmsStoreService(db)
    data = await service.bootstrap(tenant_code)
    return BootstrapOut(**data)


@router.get("", response_model=dict[str, Any])
async def list_all_collections(
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    service = LmsStoreService(db)
    collections = await service.read_all_collections(
        principal.tenant_id,
        role=principal.role,
        person_id=principal.person_id,
        is_admin=principal.is_tenant_admin,
    )
    # A module the institution did not buy contributes no data. Filtering here
    # rather than erroring keeps the bulk read usable for every tenant.
    locked = await locked_collections_for(db, principal.tenant_id)
    return {key: value for key, value in collections.items() if key not in locked}


@router.get("/{collection_key}", response_model=CollectionOut)
async def get_collection(
    collection_key: str,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    await assert_collection_allowed(db, principal.tenant_id, collection_key)
    service = LmsStoreService(db)
    data = await service.read_collection(
        principal.tenant_id,
        _valid_key(collection_key),
        role=principal.role,
        person_id=principal.person_id,
        is_admin=principal.is_tenant_admin,
    )
    return CollectionOut(key=collection_key, data=data)


@router.put("/{collection_key}", response_model=CollectionOut)
async def put_collection(
    collection_key: str,
    payload: CollectionPut,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """Replace a whole collection. Tenant admins only — others use PATCH."""
    if not principal.is_tenant_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can replace a whole collection",
        )
    await assert_collection_allowed(db, principal.tenant_id, collection_key)
    service = LmsStoreService(db)
    data = await service.put_collection(
        principal.tenant_id,
        _valid_key(collection_key),
        payload.data,
        person_id=principal.person_id,
        role=principal.role,
    )
    return CollectionOut(key=collection_key, data=data)


@router.patch("/{collection_key}", response_model=CollectionOut)
async def patch_collection(
    collection_key: str,
    payload: CollectionPatch,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """Apply record-level changes; non-admin changes are checked against the write policy."""
    await assert_collection_allowed(db, principal.tenant_id, collection_key)
    service = LmsStoreService(db)
    data = await service.patch_collection(
        principal.tenant_id,
        _valid_key(collection_key),
        role=principal.role,
        person_id=principal.person_id,
        is_admin=principal.is_tenant_admin,
        upserts=[(u.record, u.after) for u in payload.upserts],
        deletes=payload.deletes,
        set_entries=payload.set,
        unset_keys=payload.unset,
    )
    return CollectionOut(key=collection_key, data=data)


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_data(
    payload: SeedPayload,
    tenant_code: str = "berana",
    db: AsyncSession = Depends(get_db),
    _admin: PlatformPrincipal = Depends(require_platform_super_admin),
):
    """Replace all collections of a tenant. Platform super admin only."""
    service = LmsStoreService(db)
    tenant_id = await service.resolve_tenant_id(tenant_code)
    count = await service.seed_collections(tenant_id, payload.collections)
    return {"seeded": count, "tenant_code": tenant_code}
