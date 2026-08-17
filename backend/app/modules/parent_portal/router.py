"""
Parent / Guardian Portal module - FastAPI router.

Blueprint reference: Section 8.3 (Parent / Guardian Portal)
Planned endpoints (Sprint 9):
- GET /parent-portal/children
- GET /parent-portal/children/{id}/attendance
- GET /parent-portal/children/{id}/grades

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 9): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
