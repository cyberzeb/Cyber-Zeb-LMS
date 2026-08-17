"""
Virtual Classroom / Zoom Integration module.

Blueprint reference: Section 10 (Virtual Learning and Zoom Integration)
Target sprint: Sprint 6

Entities to implement: LiveSession

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 6): define SQLAlchemy models for: LiveSession
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class LiveSession(Base, TenantScopedMixin):
#     __tablename__ = "live_sessions"
#     # add columns here
