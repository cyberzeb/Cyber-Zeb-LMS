"""
Virtual Classroom / Zoom Integration module - FastAPI router.

Blueprint reference: Section 10 (Virtual Learning and Zoom Integration)
Planned endpoints (Sprint 6):
- POST /courses/{id}/live-sessions
- POST /live-sessions/{id}/join
- POST /integrations/zoom/webhook

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 6): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
