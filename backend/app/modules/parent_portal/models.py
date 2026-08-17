"""
Parent / Guardian Portal module.

Blueprint reference: Section 8.3 (Parent / Guardian Portal)
Target sprint: Sprint 9

Entities to implement: (none - orchestration/read-model module)

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 9): define SQLAlchemy models for: (none - orchestration/read-model module)
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class ExampleEntity(Base, TenantScopedMixin):
#     __tablename__ = "example_entitys"
#     # add columns here
