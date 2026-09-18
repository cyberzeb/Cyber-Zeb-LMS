from typing import Any, Optional

from pydantic import BaseModel, Field


class CollectionOut(BaseModel):
    key: str
    data: Any


class CollectionPut(BaseModel):
    data: Any


class CollectionUpsert(BaseModel):
    """One record to create or replace. `after` positions a new record (None = first)."""
    record: dict[str, Any]
    after: Optional[str] = None


class CollectionPatch(BaseModel):
    """Record-level changes, applied atomically to the stored collection.

    List collections use `upserts` / `deletes` (records matched by `id`).
    Keyed collections use `set` / `unset` (top-level keys).
    """
    upserts: list[CollectionUpsert] = Field(default_factory=list)
    deletes: list[str] = Field(default_factory=list)
    set: dict[str, Any] = Field(default_factory=dict)
    unset: list[str] = Field(default_factory=list)


class BootstrapOut(BaseModel):
    """Public tenant info shown before sign-in (no personal data)."""
    tenant_code: str
    tenant_id: str
    name: str
    institution_type: str


class SeedPayload(BaseModel):
    """Bulk seed — keys match frontend STORAGE_KEYS minus the berana: prefix."""
    collections: dict[str, Any]
