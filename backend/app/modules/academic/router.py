"""
Academic / Training Structure module - FastAPI router.

Blueprint reference: Section 7.1 (Academic Hierarchy) + Section 17.2 Organization domain
Planned endpoints (Sprint 2):
- POST /academic/programs
- GET /academic/programs
- POST /academic/terms
- POST /academic/cohorts

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 2): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
