"""
LMS data store — JSON collections mirroring frontend localStorage keys.

Each row holds one named collection (people, courses, etc.) as JSON for a tenant.
This bridges the demo frontend to the backend while proper normalized modules are built out.
"""
import uuid

from sqlalchemy import JSON, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import TimestampMixin, UUIDPrimaryKeyMixin
from app.core.database import Base


class LmsCollection(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "lms_collections"
    __table_args__ = (UniqueConstraint("tenant_id", "collection_key", name="uq_lms_collection_tenant_key"),)

    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    collection_key: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    data: Mapped[object] = mapped_column(JSON, nullable=False, default=list)
