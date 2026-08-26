"""
Role definitions mirror Blueprint Section 3 - User Roles and Permission Model.

University Edition role pack: see docs/UNIVERSITY_EDITION.md

Do NOT invent ad-hoc role strings in individual modules. Every role used
anywhere in the API (JWT claims, DB rows, route guards) must come from
this enum so the permission matrix stays centrally auditable.
"""
from enum import Enum


class Role(str, Enum):
    # Platform (owned by separate team — do not implement UI here)
    PLATFORM_SUPER_ADMIN = "platform_super_admin"

    # University administration
    INSTITUTION_ADMIN = "institution_admin"
    REGISTRAR = "registrar"
    ACADEMIC_ADMIN = "academic_admin"
    DEPARTMENT_ADMIN = "department_admin"
    FINANCE_OFFICER = "finance_officer"        # Finance Admin (display label)

    # Academic users
    HEAD_OF_DEPARTMENT = "head_of_department"
    INSTRUCTOR = "instructor"
    TEACHING_ASSISTANT = "teaching_assistant"

    # Learners
    STUDENT = "student"

    # Cross-edition / optional modules
    TRAINING_ADMIN = "training_admin"          # Training Edition
    PARENT_GUARDIAN = "parent_guardian"
    MANAGER = "manager"                        # Corporate Edition
    SUPPORT_AGENT = "support_agent"
    AUDITOR = "auditor"                        # Read-only


# Human-readable labels for admin UI and audit logs.
ROLE_LABELS: dict[Role, str] = {
    Role.PLATFORM_SUPER_ADMIN: "Platform Super Admin",
    Role.INSTITUTION_ADMIN: "Institution Admin",
    Role.REGISTRAR: "Registrar",
    Role.ACADEMIC_ADMIN: "Academic Admin",
    Role.DEPARTMENT_ADMIN: "Department Admin",
    Role.FINANCE_OFFICER: "Finance Admin",
    Role.HEAD_OF_DEPARTMENT: "Head of Department",
    Role.INSTRUCTOR: "Instructor",
    Role.TEACHING_ASSISTANT: "Teaching Assistant",
    Role.STUDENT: "Student",
    Role.TRAINING_ADMIN: "Training Admin",
    Role.PARENT_GUARDIAN: "Parent / Guardian",
    Role.MANAGER: "Manager",
    Role.SUPPORT_AGENT: "Support Agent",
    Role.AUDITOR: "Auditor",
}


# University Edition role groups for route guards and policy checks.
UNIVERSITY_ADMIN_ROLES = {
    Role.INSTITUTION_ADMIN,
    Role.REGISTRAR,
    Role.ACADEMIC_ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.FINANCE_OFFICER,
}

UNIVERSITY_ACADEMIC_ROLES = {
    Role.HEAD_OF_DEPARTMENT,
    Role.INSTRUCTOR,
    Role.TEACHING_ASSISTANT,
}

UNIVERSITY_STAFF_ROLES = UNIVERSITY_ADMIN_ROLES | UNIVERSITY_ACADEMIC_ROLES | {Role.AUDITOR}


# Roles allowed to perform high-risk actions per Section 16.1.
HIGH_RISK_ACTION_ROLES = {
    Role.PLATFORM_SUPER_ADMIN,
    Role.INSTITUTION_ADMIN,
    Role.REGISTRAR,
    Role.ACADEMIC_ADMIN,
    Role.FINANCE_OFFICER,
}
