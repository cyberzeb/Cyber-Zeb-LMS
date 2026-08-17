"""
Assignments, Assessments & Gradebook module.

Blueprint reference: Sections 11.2-11.3 (Assessment Types, Gradebook Rules)
Target sprint: Sprint 4

Entities to implement: Assignment, Quiz, Question, Submission, GradeItem, Grade

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 4): define SQLAlchemy models for: Assignment, Quiz, Question, Submission, GradeItem, Grade
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class Assignment(Base, TenantScopedMixin):
#     __tablename__ = "assignments"
#     # add columns here
