"""
Reports & Analytics module - FastAPI router.

Blueprint reference: Section 14.1 (Required Reports)
Planned endpoints (Cross-cutting):
- GET /reports/completion
- GET /reports/attendance
- GET /reports/finance
- GET /reports/engagement

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO(Cross-cutting): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
