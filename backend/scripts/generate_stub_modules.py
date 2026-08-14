"""
Internal scaffolding script (run once) - generates consistent
models.py / schemas.py / service.py / router.py stubs for modules
not yet fully implemented, so every module in the repo follows the
exact same 4-layer pattern as `tenants` and `identity`.

Run: python scripts/generate_stub_modules.py
Safe to delete after the team has filled in real logic.
"""
import os

MODULES = {
    "academic": {
        "title": "Academic / Training Structure",
        "blueprint_section": "Section 7.1 (Academic Hierarchy) + Section 17.2 Organization domain",
        "sprint": "Sprint 2",
        "entities": ["Program", "AcademicTerm", "Cohort"],
        "endpoints": ["POST /academic/programs", "GET /academic/programs",
                      "POST /academic/terms", "POST /academic/cohorts"],
    },
    "courses": {
        "title": "Course Catalog & Content Management",
        "blueprint_section": "Sections 7.2-7.3 (Course Authoring, Content Standards)",
        "sprint": "Sprint 2",
        "entities": ["Course", "CourseOffering", "Module", "Lesson", "ContentItem"],
        "endpoints": ["POST /courses", "GET /courses", "GET /courses/{id}",
                      "POST /courses/{id}/modules", "POST /courses/{id}/lessons",
                      "POST /courses/{id}/publish"],
    },
    "enrollment": {
        "title": "Enrollment & Cohorts",
        "blueprint_section": "Section 8.1 (Enrollment Methods)",
        "sprint": "Sprint 3",
        "entities": ["Enrollment"],
        "endpoints": ["POST /enrollments", "GET /learners/{id}/enrollments", "POST /enrollments/bulk"],
    },
    "live_sessions": {
        "title": "Virtual Classroom / Zoom Integration",
        "blueprint_section": "Section 10 (Virtual Learning and Zoom Integration)",
        "sprint": "Sprint 6",
        "entities": ["LiveSession"],
        "endpoints": ["POST /courses/{id}/live-sessions", "POST /live-sessions/{id}/join",
                      "POST /integrations/zoom/webhook"],
    },
    "attendance": {
        "title": "Attendance",
        "blueprint_section": "Section 11.1 (Attendance Sources)",
        "sprint": "Sprint 5",
        "entities": ["AttendanceEvent", "AttendanceRecord", "LearningProgress"],
        "endpoints": ["POST /sessions/{id}/attendance", "GET /attendance/reports"],
    },
    "assessments": {
        "title": "Assignments, Assessments & Gradebook",
        "blueprint_section": "Sections 11.2-11.3 (Assessment Types, Gradebook Rules)",
        "sprint": "Sprint 4",
        "entities": ["Assignment", "Quiz", "Question", "Submission", "GradeItem", "Grade"],
        "endpoints": ["POST /quizzes", "POST /assignments", "POST /submissions", "POST /grades"],
    },
    "communication": {
        "title": "Communication, Notifications and Support",
        "blueprint_section": "Section 12 (Communication, Notifications and Support)",
        "sprint": "Sprint 7",
        "entities": ["Message", "Announcement", "Notification", "Discussion"],
        "endpoints": ["POST /communication/announcements", "POST /communication/messages",
                      "GET /communication/notifications"],
    },
    "payments": {
        "title": "Payments, Billing and Financial Controls",
        "blueprint_section": "Section 13 (Payments, Billing and Financial Controls)",
        "sprint": "Sprint 8",
        "entities": ["Order", "Invoice", "Payment", "Refund", "Discount"],
        "endpoints": ["POST /orders", "POST /payments/checkout",
                      "POST /webhooks/payments/{provider}", "POST /refunds"],
    },
    "certificates": {
        "title": "Certificates & Credentials",
        "blueprint_section": "Section 14.1 (Certificates & Credentials) + Section 18 Phase 5",
        "sprint": "Sprint 10",
        "entities": ["Certificate"],
        "endpoints": ["POST /certificates/issue", "GET /certificates/{code}/verify"],
    },
    "parent_portal": {
        "title": "Parent / Guardian Portal",
        "blueprint_section": "Section 8.3 (Parent / Guardian Portal)",
        "sprint": "Sprint 9",
        "entities": [],  # Reuses identity.GuardianLink; this module is view/orchestration only.
        "endpoints": ["GET /parent-portal/children", "GET /parent-portal/children/{id}/attendance",
                      "GET /parent-portal/children/{id}/grades"],
    },
    "reports": {
        "title": "Reports & Analytics",
        "blueprint_section": "Section 14.1 (Required Reports)",
        "sprint": "Cross-cutting",
        "entities": [],  # Read-model/aggregation only - no owned tables.
        "endpoints": ["GET /reports/completion", "GET /reports/attendance",
                      "GET /reports/finance", "GET /reports/engagement"],
    },
    "integrations": {
        "title": "Integration Hub & API",
        "blueprint_section": "Section 15 (Integration and API Architecture)",
        "sprint": "Cross-cutting",
        "entities": ["IntegrationConnection", "WebhookEvent"],
        "endpoints": ["POST /integrations/{type}/connect", "POST /integrations/{type}/sync",
                      "POST /integrations/{type}/test", "POST /integrations/{type}/disconnect"],
    },
    "admin": {
        "title": "Administration & Support",
        "blueprint_section": "Section 16 (Security, Privacy, Compliance and Audit)",
        "sprint": "Cross-cutting",
        "entities": ["SupportTicket"],
        "endpoints": ["GET /admin/audit-logs", "POST /admin/support-tickets"],
    },
}

MODELS_TEMPLATE = '''"""
{title} module.

Blueprint reference: {blueprint_section}
Target sprint: {sprint}

Entities to implement: {entities}

Pattern to follow: see app/modules/tenants/models.py and
app/modules/identity/models.py for the reference implementation
(TenantScopedMixin usage, enum columns, relationships).
"""
from app.common.base_model import TenantScopedMixin  # noqa: F401
from app.core.database import Base  # noqa: F401

# TODO({sprint}): define SQLAlchemy models for: {entities}
# Every tenant-owned table MUST inherit (Base, TenantScopedMixin).
# Example skeleton:
#
# class {first_entity}(Base, TenantScopedMixin):
#     __tablename__ = "{first_entity_table}"
#     # add columns here
'''

SCHEMAS_TEMPLATE = '''"""
{title} module - Pydantic request/response schemas.

Follow the pattern in app/modules/tenants/schemas.py:
- one *Create schema per entity for POST bodies
- one *Out schema per entity for responses (model_config = ConfigDict(from_attributes=True))
"""
# TODO({sprint}): define schemas for: {entities}
'''

SERVICE_TEMPLATE = '''"""
{title} module - business logic layer.

Blueprint reference: {blueprint_section}

Rules to enforce here (not in the router):
- Validate every business rule from the blueprint section above.
- Call app.common.audit.write_audit_log(...) for any high-risk action
  (Section 16.1: grade changes after publish, refunds, guardian-link
  changes, impersonation, role changes, certificate overrides, etc).
- Never trust tenant_id/amount/ownership from client input - always use
  the Principal from app.core.dependencies.
"""
from sqlalchemy.ext.asyncio import AsyncSession


class {service_class}:
    def __init__(self, db: AsyncSession):
        self.db = db

    # TODO({sprint}): implement service methods backing: {endpoints}
'''

ROUTER_TEMPLATE = '''"""
{title} module - FastAPI router.

Blueprint reference: {blueprint_section}
Planned endpoints ({sprint}):
{endpoints_bulleted}

Follow the pattern in app/modules/tenants/router.py:
- Depends(get_db) for the session
- Depends(require_roles(...)) for authorization
- delegate all logic to the module's service.py
"""
from fastapi import APIRouter

router = APIRouter()

# TODO({sprint}): implement endpoints listed above using the
# tenants/identity modules as the reference pattern.
'''


def to_pascal_case(name: str) -> str:
    return "".join(part.capitalize() for part in name.split("_"))


def write_file(path: str, content: str) -> None:
    with open(path, "w") as f:
        f.write(content)


def main():
    base_dir = os.path.join(os.path.dirname(__file__), "..", "app", "modules")

    for module_name, meta in MODULES.items():
        module_dir = os.path.join(base_dir, module_name)
        entities = meta["entities"]
        first_entity = entities[0] if entities else "ExampleEntity"
        first_entity_table = "".join(
            ["_" + c.lower() if c.isupper() else c for c in first_entity]
        ).lstrip("_") + "s"

        context = {
            "title": meta["title"],
            "blueprint_section": meta["blueprint_section"],
            "sprint": meta["sprint"],
            "entities": ", ".join(entities) if entities else "(none - orchestration/read-model module)",
            "first_entity": first_entity,
            "first_entity_table": first_entity_table,
            "service_class": f"{to_pascal_case(module_name)}Service",
            "endpoints_bulleted": "\n".join(f"- {e}" for e in meta["endpoints"]),
            "endpoints": ", ".join(meta["endpoints"]),
        }

        write_file(os.path.join(module_dir, "models.py"), MODELS_TEMPLATE.format(**context))
        write_file(os.path.join(module_dir, "schemas.py"), SCHEMAS_TEMPLATE.format(**context))
        write_file(os.path.join(module_dir, "service.py"), SERVICE_TEMPLATE.format(**context))
        write_file(os.path.join(module_dir, "router.py"), ROUTER_TEMPLATE.format(**context))

    print(f"Generated stub files for {len(MODULES)} modules.")


if __name__ == "__main__":
    main()
