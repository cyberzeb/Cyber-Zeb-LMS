"""
Attendance module - FastAPI router.

Blueprint reference: Section 11.1 (Attendance Sources)
Planned endpoints (Sprint 5):
- POST /sessions/{id}/attendance
- GET /attendance/reports

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 5): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
