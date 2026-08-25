from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.core.database import get_db
from app.modules.lms_store.schemas import BootstrapOut, CollectionOut, CollectionPut, SeedPayload
from app.modules.lms_store.service import LmsStoreService

router = APIRouter()


@router.get("/bootstrap", response_model=BootstrapOut)
async def bootstrap(
    tenant_code: str = "berana",
    db: AsyncSession = Depends(get_db),
):
    service = LmsStoreService(db)
    data = await service.bootstrap(tenant_code)
    return BootstrapOut(**data)


@router.get("", response_model=dict[str, Any])
async def list_all_collections(
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    service = LmsStoreService(db)
    return await service.list_collections(principal.tenant_id)


@router.get("/{collection_key}", response_model=CollectionOut)
async def get_collection(
    collection_key: str,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    service = LmsStoreService(db)
    data = await service.get_collection(principal.tenant_id, collection_key)
    return CollectionOut(key=collection_key, data=data)


@router.put("/{collection_key}", response_model=CollectionOut)
async def put_collection(
    collection_key: str,
    payload: CollectionPut,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    service = LmsStoreService(db)
    data = await service.put_collection(principal.tenant_id, collection_key, payload.data)
    return CollectionOut(key=collection_key, data=data)


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_data(
    payload: SeedPayload,
    tenant_code: str = "berana",
    db: AsyncSession = Depends(get_db),
):
    """Development-only bulk seed. Replaces all collections for the demo tenant."""
    service = LmsStoreService(db)
    tenant_id = await service.resolve_tenant_id(tenant_code)
    count = await service.seed_collections(tenant_id, payload.collections)
    return {"seeded": count, "tenant_code": tenant_code}
