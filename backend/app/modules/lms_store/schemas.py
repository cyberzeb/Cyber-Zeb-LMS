from typing import Any

from pydantic import BaseModel, Field


class CollectionOut(BaseModel):
    key: str
    data: Any


class CollectionPut(BaseModel):
    data: Any


class BootstrapOut(BaseModel):
    tenant_code: str
    tenant_id: str
    people: list[Any] = Field(default_factory=list)


class SeedPayload(BaseModel):
    """Bulk seed — keys match frontend STORAGE_KEYS minus the berana: prefix."""
    collections: dict[str, Any]
