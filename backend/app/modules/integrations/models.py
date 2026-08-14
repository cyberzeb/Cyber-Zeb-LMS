"""
Integration Hub & API module.

Blueprint reference: Section 15 (Integration and API Architecture)
Target sprint: Cross-cutting

Entities to implement: IntegrationConnection, WebhookEvent

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Cross-cutting): define SQLAlchemy models for: IntegrationConnection, WebhookEvent
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class IntegrationConnection(Base, TenantScopedMixin):
#     __tablename__ = "integration_connections"
#     # add columns here
