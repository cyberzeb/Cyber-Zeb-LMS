"""
Academic / Training Structure module.

Blueprint reference: Section 7.1 (Academic Hierarchy) + Section 17.2 Organization domain
Target sprint: Sprint 2

University Edition entities: AcademicYear, AcademicTerm, Program, Cohort
"""
import uuid
from datetime import date
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import TenantScopedMixin
from app.core.database import Base


class ProgramLevel(str, Enum):
    UNDERGRADUATE = "undergraduate"
    POSTGRADUATE = "postgraduate"
    DOCTORAL = "doctoral"
    CERTIFICATE = "certificate"
    DIPLOMA = "diploma"


class ProgramStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class TermType(str, Enum):
    SEMESTER = "semester"
    TRIMESTER = "trimester"
    QUARTER = "quarter"
    SUMMER = "summer"
    CUSTOM = "custom"


class TermStatus(str, Enum):
    PLANNED = "planned"
    REGISTRATION = "registration"
    IN_PROGRESS = "in_progress"
    GRADING = "grading"
    CLOSED = "closed"


class AcademicYear(Base, TenantScopedMixin):
    """
    Institutional academic year (e.g. 2025–2026).
    Parent of one or more AcademicTerm records.
    """
    __tablename__ = "academic_years"

    campus_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("campuses.id"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(String(20))          # e.g. "2025-2026"
    name: Mapped[str] = mapped_column(String(100))          # e.g. "Academic Year 2025–2026"
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)

    terms: Mapped[list["AcademicTerm"]] = relationship(back_populates="academic_year")


class AcademicTerm(Base, TenantScopedMixin):
    """
    A semester/term within an academic year.
    Course offerings and enrollments are bound to a term.
    """
    __tablename__ = "academic_terms"

    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_years.id"), index=True
    )
    campus_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("campuses.id"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(String(30))           # e.g. "2025-FALL"
    name: Mapped[str] = mapped_column(String(100))          # e.g. "Fall Semester 2025"
    term_type: Mapped[TermType] = mapped_column(SAEnum(TermType), default=TermType.SEMESTER)
    status: Mapped[TermStatus] = mapped_column(SAEnum(TermStatus), default=TermStatus.PLANNED)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    registration_opens: Mapped[date | None] = mapped_column(Date, nullable=True)
    registration_closes: Mapped[date | None] = mapped_column(Date, nullable=True)
    classes_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    classes_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    grading_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)

    academic_year: Mapped["AcademicYear"] = relationship(back_populates="terms")


class Program(Base, TenantScopedMixin):
    """Degree / diploma / certificate program offered by a department."""
    __tablename__ = "programs"

    department_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("departments.id"), index=True
    )
    campus_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("campuses.id"), index=True
    )
    code: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(200))
    level: Mapped[ProgramLevel] = mapped_column(SAEnum(ProgramLevel))
    status: Mapped[ProgramStatus] = mapped_column(SAEnum(ProgramStatus), default=ProgramStatus.DRAFT)
    duration_years: Mapped[float | None] = mapped_column(nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class Cohort(Base, TenantScopedMixin):
    """
    Fixed intake group (used heavily in Training Edition; optional in University
    for block programs or executive cohorts).
    """
    __tablename__ = "cohorts"

    program_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("programs.id"), nullable=True, index=True
    )
    academic_term_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_terms.id"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(200))
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
