"""
Enrollment & Cohorts module.

Blueprint reference: Section 8.1 (Enrollment Methods)
Target sprint: Sprint 3

Entities to implement: Enrollment

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 3): define SQLAlchemy models for: Enrollment
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class Enrollment(Base, TenantScopedMixin):
#     __tablename__ = "enrollments"
#     # add columns here
