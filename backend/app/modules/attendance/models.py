"""
Attendance module.

Blueprint reference: Section 11.1 (Attendance Sources)
Target sprint: Sprint 5

Entities to implement: AttendanceEvent, AttendanceRecord, LearningProgress

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 5): define SQLAlchemy models for: AttendanceEvent, AttendanceRecord, LearningProgress
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class AttendanceEvent(Base, TenantScopedMixin):
#     __tablename__ = "attendance_events"
#     # add columns here
