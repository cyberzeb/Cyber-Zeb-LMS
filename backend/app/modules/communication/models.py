"""
Communication, Notifications and Support module.

Blueprint reference: Section 12 (Communication, Notifications and Support)
Target sprint: Sprint 7

Entities to implement: Message, Announcement, Notification, Discussion

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 7): define SQLAlchemy models for: Message, Announcement, Notification, Discussion
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class Message(Base, TenantScopedMixin):
#     __tablename__ = "messages"
#     # add columns here
