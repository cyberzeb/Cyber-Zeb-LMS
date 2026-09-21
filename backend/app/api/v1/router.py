"""
Single place that assembles every module's router into the versioned API.

When a new module is implemented, uncomment/add its include_router line
here. Do not import module internals anywhere except through `router`.
"""
from fastapi import APIRouter, Depends

from app.core.modules import require_module
from app.modules.onboarding.constants import ModuleKey

from app.modules.tenants.router import router as tenants_router
from app.modules.identity.router import router as identity_router
from app.modules.academic.router import router as academic_router
from app.modules.courses.router import router as courses_router
from app.modules.enrollment.router import router as enrollment_router
from app.modules.live_sessions.router import router as live_sessions_router
from app.modules.attendance.router import router as attendance_router
from app.modules.assessments.router import router as assessments_router
from app.modules.communication.router import router as communication_router
from app.modules.payments.router import router as payments_router
from app.modules.certificates.router import router as certificates_router
from app.modules.parent_portal.router import router as parent_portal_router
from app.modules.reports.router import router as reports_router
from app.modules.integrations.router import router as integrations_router
from app.modules.admin.router import router as admin_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.lms_store.router import router as lms_store_router

api_router = APIRouter()

# Onboarding / Super Admin (public service requests + platform console)
api_router.include_router(onboarding_router)

# LMS Data Store (generic per-tenant collections consumed by the portal frontends)
api_router.include_router(lms_store_router, prefix="/data", tags=["LMS Data Store"])

# Sprint 1 (Blueprint Section 19)
api_router.include_router(tenants_router, prefix="/tenants", tags=["Tenants & Organization"])
api_router.include_router(identity_router, prefix="/auth", tags=["Identity & Access"])

# Sprint 2-3
# Every router below is gated on the tenant's module selection: a request for
# a module the institution did not take answers 403 naming that module.
api_router.include_router(
    academic_router, prefix="/academic", tags=["Academic Structure"],
    dependencies=[Depends(require_module(ModuleKey.ACADEMIC_STRUCTURE))],
)
api_router.include_router(
    courses_router, prefix="/courses", tags=["Course Catalog & Content"],
    dependencies=[Depends(require_module(ModuleKey.COURSE_CATALOG_AUTHORING))],
)
api_router.include_router(
    enrollment_router, prefix="/enrollments", tags=["Enrollment"],
    dependencies=[Depends(require_module(ModuleKey.ENROLLMENT_COHORTS))],
)

# Sprint 4-6
api_router.include_router(
    assessments_router, prefix="/assessments", tags=["Assessments & Gradebook"],
    dependencies=[Depends(require_module(ModuleKey.ASSIGNMENTS_ASSESSMENTS))],
)
api_router.include_router(
    attendance_router, prefix="/attendance", tags=["Attendance"],
    dependencies=[Depends(require_module(ModuleKey.ATTENDANCE))],
)
api_router.include_router(
    live_sessions_router, prefix="/live-sessions", tags=["Virtual Classroom / Zoom"],
    dependencies=[Depends(require_module(ModuleKey.VIRTUAL_CLASSROOM))],
)

# Sprint 7
api_router.include_router(
    communication_router, prefix="/communication", tags=["Communication & Notifications"],
    dependencies=[Depends(require_module(ModuleKey.COMMUNICATION_NOTIFICATIONS))],
)

# Sprint 8
api_router.include_router(
    payments_router, prefix="/payments", tags=["Payments & Billing"],
    dependencies=[Depends(require_module(ModuleKey.PAYMENTS_BILLING))],
)

# Sprint 9-10
api_router.include_router(
    parent_portal_router, prefix="/parent-portal", tags=["Parent / Guardian Portal"],
    dependencies=[Depends(require_module(ModuleKey.PARENT_MANAGER_PORTAL))],
)
api_router.include_router(
    certificates_router, prefix="/certificates", tags=["Certificates & Credentials"],
    dependencies=[Depends(require_module(ModuleKey.CERTIFICATES_CREDENTIALS))],
)

# Cross-cutting
api_router.include_router(
    reports_router, prefix="/reports", tags=["Reports & Analytics"],
    dependencies=[Depends(require_module(ModuleKey.REPORTS_ANALYTICS))],
)
api_router.include_router(
    integrations_router, prefix="/integrations", tags=["Integration Hub"],
    dependencies=[Depends(require_module(ModuleKey.INTEGRATION_HUB_API))],
)
api_router.include_router(
    admin_router, prefix="/admin", tags=["Administration & Support"],
    dependencies=[Depends(require_module(ModuleKey.ADMINISTRATION_SUPPORT))],
)
