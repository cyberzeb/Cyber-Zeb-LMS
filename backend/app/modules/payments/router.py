"""
Payments, Billing and Financial Controls module - FastAPI router.

Blueprint reference: Section 13 (Payments, Billing and Financial Controls)
Planned endpoints (Sprint 8):
- POST /orders
- POST /payments/checkout
- POST /webhooks/payments/{provider}
- POST /refunds

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 8): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
