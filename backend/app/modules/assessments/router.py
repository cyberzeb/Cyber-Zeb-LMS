"""
Assignments, Assessments & Gradebook module - FastAPI router.

Blueprint reference: Sections 11.2-11.3 (Assessment Types, Gradebook Rules)
Planned endpoints (Sprint 4):
- POST /quizzes
- POST /assignments
- POST /submissions
- POST /grades

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 4): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
