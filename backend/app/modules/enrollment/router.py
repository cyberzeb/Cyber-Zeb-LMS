"""
Enrollment & Cohorts module - FastAPI router.

Blueprint reference: Section 8.1 (Enrollment Methods)
Planned endpoints (Sprint 3):
- POST /enrollments
- GET /learners/{id}/enrollments
- POST /enrollments/bulk

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 3): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
