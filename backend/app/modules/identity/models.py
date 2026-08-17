"""
Identity module - Blueprint Section 6.2 (User Account Fields) +
Section 17.2 Identity domain: User, Role, Permission, UserRole, GuardianLink.

Note: `Role` here is a DB-level assignment record; the fixed set of role
NAMES lives in app.core.permissions.Role (single source of truth for
what roles exist in the system).
"""
import uuid
from enum import Enum

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import TenantScopedMixin
from app.core.database import Base
from app.core.permissions import Role as RoleEnum


def _enum_values(enum_cls: type) -> list[str]:
    return [member.value for member in enum_cls]


class UserStatus(str, Enum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class GuardianRelationship(str, Enum):
    PARENT = "parent"
    LEGAL_GUARDIAN = "legal_guardian"
    OTHER = "other"


class User(Base, TenantScopedMixin):
    """Section 6.2 - Person minimum fields. Extend via profile tables per role, not here."""
    __tablename__ = "users"

    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), index=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(200))
    hashed_password: Mapped[str] = mapped_column(String(255))
    status: Mapped[UserStatus] = mapped_column(
        SAEnum(UserStatus, name="userstatus", values_callable=_enum_values),
        default=UserStatus.INVITED,
    )
    locale: Mapped[str] = mapped_column(String(10), default="en")
    timezone: Mapped[str] = mapped_column(String(50), default="Africa/Addis_Ababa")
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    role_assignments: Mapped[list["UserRoleAssignment"]] = relationship(back_populates="user")


class UserRoleAssignment(Base, TenantScopedMixin):
    """
    A user may hold more than one role (e.g. Instructor + Department Admin).
    Scope narrows the role to a campus/department/course where relevant
    (Section 3.1 Permission Design Rules) - store scope_type/scope_id
    generically rather than one FK per possible scope.
    """
    __tablename__ = "user_role_assignments"

    user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    role: Mapped[RoleEnum] = mapped_column(
        SAEnum(RoleEnum, name="role", values_callable=_enum_values)
    )
    scope_type: Mapped[str | None] = mapped_column(String(50), nullable=True)   # "campus" | "department" | "course" | None (tenant-wide)
    scope_id: Mapped[uuid.UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="role_assignments")


class GuardianLink(Base, TenantScopedMixin):
    """
    Section 3.1: "A parent can see only linked children and only
    information authorized by the institution." This table is the
    authorization boundary for the entire Parent Portal module.
    """
    __tablename__ = "guardian_links"

    guardian_user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    student_user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    relationship_type: Mapped[GuardianRelationship] = mapped_column(
        SAEnum(
            GuardianRelationship,
            name="guardianrelationship",
            values_callable=_enum_values,
        )
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # visibility flags control what a guardian may see for this specific child
    can_view_attendance: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_grades: Mapped[bool] = mapped_column(Boolean, default=True)
    can_message_teachers: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_payments: Mapped[bool] = mapped_column(Boolean, default=False)
