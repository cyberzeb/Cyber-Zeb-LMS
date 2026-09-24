"""
Per-tenant module entitlement.

An institution picks its modules when it registers. Activation copies that
selection to ``tenant.enabled_modules``; this is where the selection is
*enforced*. A request for a module the institution did not take answers 403 and
names the module in ``error.details``, so the workspace can show it locked with
a "Request this module" action instead of a broken page.

Blueprint 4.1: ``TENANT_INSTITUTION_MGMT`` and ``IDENTITY_ACCESS`` are always on
and cannot be switched off, or nobody could sign in or administer the tenant.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.core.exceptions import AppError
from app.modules.onboarding.constants import ALWAYS_ON_MODULES, MODULE_LABELS, ModuleKey
from app.modules.tenants.models import Tenant


class ModuleNotEnabledError(AppError):
    """403 that tells the client exactly which module to offer."""

    status_code = 403
    error_code = "module_not_enabled"

    def __init__(self, module: ModuleKey):
        label = MODULE_LABELS.get(module, module.value)
        super().__init__(
            f"{label} is not part of your subscription. "
            "Ask your administrator to request this module.",
            details=[{"module": module.value, "label": label}],
        )
        self.module = module


async def enabled_modules_for(db: AsyncSession, tenant_id: UUID) -> set[str]:
    """
    The module keys this tenant may use, always including the core ones.

    A tenant with an empty list predates module selection, so it keeps the full
    catalog — never silently strip an existing institution's workspace.
    """
    stored = (
        await db.execute(select(Tenant.enabled_modules).where(Tenant.id == tenant_id))
    ).scalar_one_or_none()
    if not stored:
        return {module.value for module in ModuleKey}
    return {*(str(key) for key in stored), *(m.value for m in ALWAYS_ON_MODULES)}


async def tenant_has_module(db: AsyncSession, tenant_id: UUID, module: ModuleKey) -> bool:
    if module in ALWAYS_ON_MODULES:
        return True
    return module.value in await enabled_modules_for(db, tenant_id)


def require_module(module: ModuleKey):
    """
    Route guard factory. Attach to a router so every route under it is gated:

        api_router.include_router(
            attendance_router,
            prefix="/attendance",
            dependencies=[Depends(require_module(ModuleKey.ATTENDANCE))],
        )

    Runs after the portal principal, so an anonymous caller still gets 401 rather
    than leaking which modules an institution bought.

    Note it depends on `get_demo_principal`, not `get_current_principal`: portal
    tokens carry a collection person id ("stu-1") as their subject, not a UUID,
    so the stricter dependency rejects every portal user with 401.
    """

    async def _check(
        principal: DemoPrincipal = Depends(get_demo_principal),
        db: AsyncSession = Depends(get_db),
    ) -> DemoPrincipal:
        if not await tenant_has_module(db, principal.tenant_id, module):
            raise ModuleNotEnabledError(module)
        return principal

    return _check

# ── Data-store collections ────────────────────────────────────────────────────
# The portal reads and writes everything through /api/v1/data/<collection>, so a
# module is only really switched off once its collections are too. Anything not
# listed belongs to the core (people, settings, campuses …) and is always
# available — an unmapped key must never be silently hidden.
COLLECTION_MODULES: dict[str, ModuleKey] = {
    # Academic / training structure
    "colleges": ModuleKey.ACADEMIC_STRUCTURE,
    "departments": ModuleKey.ACADEMIC_STRUCTURE,
    "programs": ModuleKey.ACADEMIC_STRUCTURE,
    "academic-years": ModuleKey.ACADEMIC_STRUCTURE,
    "academic-terms": ModuleKey.ACADEMIC_STRUCTURE,
    # Course catalog and authoring
    "courses": ModuleKey.COURSE_CATALOG_AUTHORING,
    "course-offerings": ModuleKey.COURSE_CATALOG_AUTHORING,
    # Content
    "lesson-progress": ModuleKey.CONTENT_MANAGEMENT,
    "lesson-responses": ModuleKey.CONTENT_MANAGEMENT,
    # Enrollment
    "enrollments": ModuleKey.ENROLLMENT_COHORTS,
    # Virtual classroom
    "live-sessions": ModuleKey.VIRTUAL_CLASSROOM,
    # Attendance
    "attendances": ModuleKey.ATTENDANCE,
    # Assignments and assessments
    "assignments": ModuleKey.ASSIGNMENTS_ASSESSMENTS,
    "quizzes": ModuleKey.ASSIGNMENTS_ASSESSMENTS,
    "question-bank": ModuleKey.ASSIGNMENTS_ASSESSMENTS,
    "student-submissions": ModuleKey.ASSIGNMENTS_ASSESSMENTS,
    # Communication
    "announcements": ModuleKey.COMMUNICATION_NOTIFICATIONS,
    "forum-chats": ModuleKey.COMMUNICATION_NOTIFICATIONS,
    "forum-messages": ModuleKey.COMMUNICATION_NOTIFICATIONS,
    "forum-read-state": ModuleKey.COMMUNICATION_NOTIFICATIONS,
    # Payments
    "payments": ModuleKey.PAYMENTS_BILLING,
    # Certificates
    "certificates": ModuleKey.CERTIFICATES_CREDENTIALS,
    "certificate-templates": ModuleKey.CERTIFICATES_CREDENTIALS,
    # Parent / manager portal
    "guardian-settings": ModuleKey.PARENT_MANAGER_PORTAL,
    # Reports
    "reports": ModuleKey.REPORTS_ANALYTICS,
    # Integrations
    "integrations": ModuleKey.INTEGRATION_HUB_API,
    # Administration and support
    "help-desk-tickets": ModuleKey.ADMINISTRATION_SUPPORT,
    "help-desk-settings": ModuleKey.ADMINISTRATION_SUPPORT,
}


def module_for_collection(collection_key: str) -> ModuleKey | None:
    """The module a data-store collection belongs to, or None when it is core."""
    return COLLECTION_MODULES.get(collection_key)


async def assert_collection_allowed(
    db: AsyncSession, tenant_id: UUID, collection_key: str
) -> None:
    """Raise ModuleNotEnabledError when this collection's module was not taken."""
    module = module_for_collection(collection_key)
    if module is None:
        return
    if not await tenant_has_module(db, tenant_id, module):
        raise ModuleNotEnabledError(module)


async def locked_collections_for(db: AsyncSession, tenant_id: UUID) -> set[str]:
    """Collection keys this tenant may not touch, for filtering a bulk read."""
    enabled = await enabled_modules_for(db, tenant_id)
    return {
        key for key, module in COLLECTION_MODULES.items() if module.value not in enabled
    }
