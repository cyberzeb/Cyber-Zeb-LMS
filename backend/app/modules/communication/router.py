"""
Communication, Notifications and Support module - FastAPI router.

Blueprint reference: Section 12 (Communication, Notifications and Support)
Planned endpoints (Sprint 7):
- POST /communication/announcements
- POST /communication/messages
- GET /communication/notifications

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 7): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
