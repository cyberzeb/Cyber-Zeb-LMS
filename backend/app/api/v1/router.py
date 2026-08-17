"""
Single place that assembles every module's router into the versioned API.

When a new module is implemented, uncomment/add its include_router line
here. Do not import module internals anywhere except through `router`.
"""
from fastapi import APIRouter

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

api_router = APIRouter()

# Onboarding / Super Admin (public service requests + platform console)
api_router.include_router(onboarding_router)

# Sprint 1 (Blueprint Section 19)
api_router.include_router(tenants_router, prefix="/tenants", tags=["Tenants & Organization"])
api_router.include_router(identity_router, prefix="/auth", tags=["Identity & Access"])

# Sprint 2-3
api_router.include_router(academic_router, prefix="/academic", tags=["Academic Structure"])
api_router.include_router(courses_router, prefix="/courses", tags=["Course Catalog & Content"])
api_router.include_router(enrollment_router, prefix="/enrollments", tags=["Enrollment"])

# Sprint 4-6
api_router.include_router(assessments_router, prefix="/assessments", tags=["Assessments & Gradebook"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(live_sessions_router, prefix="/live-sessions", tags=["Virtual Classroom / Zoom"])

# Sprint 7
api_router.include_router(communication_router, prefix="/communication", tags=["Communication & Notifications"])

# Sprint 8
api_router.include_router(payments_router, prefix="/payments", tags=["Payments & Billing"])

# Sprint 9-10
api_router.include_router(parent_portal_router, prefix="/parent-portal", tags=["Parent / Guardian Portal"])
api_router.include_router(certificates_router, prefix="/certificates", tags=["Certificates & Credentials"])

# Cross-cutting
api_router.include_router(reports_router, prefix="/reports", tags=["Reports & Analytics"])
api_router.include_router(integrations_router, prefix="/integrations", tags=["Integration Hub"])
api_router.include_router(admin_router, prefix="/admin", tags=["Administration & Support"])
