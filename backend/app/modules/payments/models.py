"""
Payments, Billing and Financial Controls module.

Blueprint reference: Section 13 (Payments, Billing and Financial Controls)
Target sprint: Sprint 8

Entities to implement: Order, Invoice, Payment, Refund, Discount

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO(Sprint 8): define SQLAlchemy models for: Order, Invoice, Payment, Refund, Discount
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class Order(Base, TenantScopedMixin):
#     __tablename__ = "orders"
#     # add columns here
