"""
Course Catalog & Content Management module.

Blueprint reference: Sections 7.2-7.3 (Course Authoring, Content Standards)
Target sprint: Sprint 2

Entities to implement: Course, CourseOffering, Module, Lesson, ContentItem

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 2): define SQLAlchemy models for: Course, CourseOffering, Module, Lesson, ContentItem
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class Course(Base, TenantScopedMixin):
#     __tablename__ = "courses"
#     # add columns here
