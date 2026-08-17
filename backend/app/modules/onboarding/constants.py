"""Module catalog and human-readable labels (Blueprint Section 5)."""
from enum import Enum


class ModuleKey(str, Enum):
    TENANT_INSTITUTION_MGMT = "tenant_institution_mgmt"
    IDENTITY_ACCESS = "identity_access"
    USER_PROFILES = "user_profiles"
    ACADEMIC_STRUCTURE = "academic_structure"
    COURSE_CATALOG_AUTHORING = "course_catalog_authoring"
    CONTENT_MANAGEMENT = "content_management"
    ENROLLMENT_COHORTS = "enrollment_cohorts"
    VIRTUAL_CLASSROOM = "virtual_classroom"
    ATTENDANCE = "attendance"
    ASSIGNMENTS_ASSESSMENTS = "assignments_assessments"
    GRADEBOOK_PROGRESS = "gradebook_progress"
    COMMUNICATION_NOTIFICATIONS = "communication_notifications"
    PAYMENTS_BILLING = "payments_billing"
    CERTIFICATES_CREDENTIALS = "certificates_credentials"
    PARENT_MANAGER_PORTAL = "parent_manager_portal"
    REPORTS_ANALYTICS = "reports_analytics"
    AI_SERVICES = "ai_services"
    IOT_PHYSICAL_INTEGRATION = "iot_physical_integration"
    INTEGRATION_HUB_API = "integration_hub_api"
    ADMINISTRATION_SUPPORT = "administration_support"


# Always enabled for every activated tenant (Blueprint 4.1).
ALWAYS_ON_MODULES: frozenset[ModuleKey] = frozenset(
    {
        ModuleKey.TENANT_INSTITUTION_MGMT,
        ModuleKey.IDENTITY_ACCESS,
    }
)

MODULE_LABELS: dict[ModuleKey, str] = {
    ModuleKey.TENANT_INSTITUTION_MGMT: "Tenant & Institution Management",
    ModuleKey.IDENTITY_ACCESS: "Identity & Access",
    ModuleKey.USER_PROFILES: "User Profiles",
    ModuleKey.ACADEMIC_STRUCTURE: "Academic / Training Structure",
    ModuleKey.COURSE_CATALOG_AUTHORING: "Course Catalog & Authoring",
    ModuleKey.CONTENT_MANAGEMENT: "Content Management",
    ModuleKey.ENROLLMENT_COHORTS: "Enrollment & Cohorts",
    ModuleKey.VIRTUAL_CLASSROOM: "Virtual Classroom (Zoom)",
    ModuleKey.ATTENDANCE: "Attendance",
    ModuleKey.ASSIGNMENTS_ASSESSMENTS: "Assignments & Assessments",
    ModuleKey.GRADEBOOK_PROGRESS: "Gradebook & Progress",
    ModuleKey.COMMUNICATION_NOTIFICATIONS: "Communication & Notifications",
    ModuleKey.PAYMENTS_BILLING: "Payments & Billing",
    ModuleKey.CERTIFICATES_CREDENTIALS: "Certificates & Credentials",
    ModuleKey.PARENT_MANAGER_PORTAL: "Parent / Manager Portal",
    ModuleKey.REPORTS_ANALYTICS: "Reports & Analytics",
    ModuleKey.AI_SERVICES: "AI Services",
    ModuleKey.IOT_PHYSICAL_INTEGRATION: "IoT / Physical Integration",
    ModuleKey.INTEGRATION_HUB_API: "Integration Hub & API",
    ModuleKey.ADMINISTRATION_SUPPORT: "Administration & Support",
}


def module_labels(keys: list[str] | list[ModuleKey]) -> list[str]:
    labels: list[str] = []
    for key in keys:
        mk = ModuleKey(key) if isinstance(key, str) else key
        labels.append(MODULE_LABELS.get(mk, mk.value))
    return labels
