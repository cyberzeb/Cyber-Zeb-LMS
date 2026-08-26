"""
Course Catalog & Content Management module.

Blueprint reference: Sections 7.2-7.3 (Course Authoring, Content Standards)
Target sprint: Sprint 2

University Edition: Course (catalog template) is separate from CourseOffering
(term-bound section with instructor, schedule, and capacity).
"""
import uuid
from enum import Enum

from sqlalchemy import (
    Boolean,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import TenantScopedMixin
from app.core.database import Base


class CourseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class OfferingStatus(str, Enum):
    PLANNED = "planned"
    OPEN = "open"               # registration open
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DeliveryMode(str, Enum):
    IN_PERSON = "in_person"
    ONLINE = "online"
    HYBRID = "hybrid"
    SELF_PACED = "self_paced"


class Course(Base, TenantScopedMixin):
    """
    Reusable course catalog entry — content and metadata only.
    Operational details (instructor, dates, capacity) live on CourseOffering.
    """
    __tablename__ = "courses"

    department_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("departments.id"), index=True
    )
    code: Mapped[str] = mapped_column(String(30))           # e.g. "CS-201"
    title: Mapped[str] = mapped_column(String(300))
    credits: Mapped[float | None] = mapped_column(nullable=True)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prerequisites: Mapped[str | None] = mapped_column(Text, nullable=True)
    learning_outcomes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CourseStatus] = mapped_column(SAEnum(CourseStatus), default=CourseStatus.DRAFT)

    offerings: Mapped[list["CourseOffering"]] = relationship(back_populates="course")


class CourseOffering(Base, TenantScopedMixin):
    """
    A specific section of a catalog course running in an academic term.
    This is the enrollment, grading, and attendance anchor.
    """
    __tablename__ = "course_offerings"

    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("courses.id"), index=True
    )
    academic_term_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_terms.id"), index=True
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("departments.id"), index=True
    )
    campus_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("campuses.id"), nullable=True, index=True
    )
    section_code: Mapped[str] = mapped_column(String(20))   # e.g. "01", "A"
    display_name: Mapped[str | None] = mapped_column(String(300), nullable=True)
    primary_instructor_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    delivery_mode: Mapped[DeliveryMode] = mapped_column(
        SAEnum(DeliveryMode), default=DeliveryMode.IN_PERSON
    )
    max_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[OfferingStatus] = mapped_column(
        SAEnum(OfferingStatus), default=OfferingStatus.PLANNED
    )
    schedule_summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    allow_self_enrollment: Mapped[bool] = mapped_column(Boolean, default=False)
    certificate_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    course: Mapped["Course"] = relationship(back_populates="offerings")


class Module(Base, TenantScopedMixin):
    """Content module belonging to a catalog course."""
    __tablename__ = "course_modules"

    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("courses.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Lesson(Base, TenantScopedMixin):
    """Lesson within a course module."""
    __tablename__ = "course_lessons"

    module_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("course_modules.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    lesson_type: Mapped[str] = mapped_column(String(50))    # video, reading, quiz, etc.
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    content_ref: Mapped[str | None] = mapped_column(Text, nullable=True)


class ContentItem(Base, TenantScopedMixin):
    """Downloadable or linked resource attached to a course."""
    __tablename__ = "course_content_items"

    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("courses.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    content_type: Mapped[str] = mapped_column(String(50))     # document, video, link, etc.
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
