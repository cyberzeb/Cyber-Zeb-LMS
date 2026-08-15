"""
Course Catalog & Content Management module - FastAPI router.

Blueprint reference: Sections 7.2-7.3 (Course Authoring, Content Standards)
Planned endpoints (Sprint 2):
- POST /courses
- GET /courses
- GET /courses/{id}
- POST /courses/{id}/modules
- POST /courses/{id}/lessons
- POST /courses/{id}/publish

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Sprint 2): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
