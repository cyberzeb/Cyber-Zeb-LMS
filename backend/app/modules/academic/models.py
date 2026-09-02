"""
Academic / Training Structure module.

Blueprint reference: Section 7.1 (Academic Hierarchy) + Section 17.2 Organization domain
Target sprint: Sprint 2

Entities to implement: Program, AcademicTerm, Cohort

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 2): define SQLAlchemy models for: Program, AcademicTerm, Cohort
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class Program(Base, TenantScopedMixin):
#     __tablename__ = "programs"
#     # add columns here
