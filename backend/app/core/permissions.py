"""
Role definitions mirror Blueprint Section 3 - User Roles and Permission Model.

Do NOT invent ad-hoc role strings in individual modules. Every role used
anywhere in the API (JWT claims, DB rows, route guards) must come from
this enum so the permission matrix stays centrally auditable.
"""
from enum import Enum


class Role(str, Enum):
    PLATFORM_SUPER_ADMIN = "platform_super_admin"
    INSTITUTION_ADMIN = "institution_admin"
    ACADEMIC_ADMIN = "academic_admin"          # Registrar
    TRAINING_ADMIN = "training_admin"
    DEPARTMENT_ADMIN = "department_admin"      # Campus / department scoped
    INSTRUCTOR = "instructor"
    TEACHING_ASSISTANT = "teaching_assistant"
    STUDENT = "student"
    PARENT_GUARDIAN = "parent_guardian"
    MANAGER = "manager"                        # Business supervisor
    FINANCE_OFFICER = "finance_officer"
    SUPPORT_AGENT = "support_agent"
    AUDITOR = "auditor"                        # Read-only


# Roles allowed to perform high-risk actions per Section 16.1.
# Individual routers should still apply narrower, action-specific checks;
# this set is a coarse first gate.
HIGH_RISK_ACTION_ROLES = {
    Role.PLATFORM_SUPER_ADMIN,
    Role.INSTITUTION_ADMIN,
    Role.ACADEMIC_ADMIN,
    Role.FINANCE_OFFICER,
}
