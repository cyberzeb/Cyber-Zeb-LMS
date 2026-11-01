"""
Role definitions mirror Blueprint Section 3 - User Roles and Permission Model.

Do NOT invent ad-hoc role strings in individual modules. Every role used
anywhere in the API (JWT claims, DB rows, route guards) must come from
this enum so the permission matrix stays centrally auditable.
"""
from enum import Enum


# University Edition uses exactly seven portal roles:
#   institution_admin, registrar, finance_officer, instructor,
#   teaching_assistant, student, parent_guardian
# The others serve the Corporate and Training editions.
class Role(str, Enum):
    PLATFORM_SUPER_ADMIN = "platform_super_admin"
    INSTITUTION_ADMIN = "institution_admin"
    REGISTRAR = "registrar"                    # University: academic records and enrolment
    ACADEMIC_ADMIN = "academic_admin"          # Legacy full academic admin (not used by University)
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
