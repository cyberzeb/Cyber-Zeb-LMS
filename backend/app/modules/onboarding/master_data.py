"""
Institution Master Data (Master_Data.pdf, September 2026).

The ten data groups an institution fills in when it registers. They are stored as
one validated JSONB document on the service request rather than forty columns:
the shape is fixed here by Pydantic, so it is still typed and validated, but the
guide can gain a field without a migration.

Per the guide's development notes:

* ``institution_ref`` ("INST-0001") is system-generated and unique — never taken
  from the form.
* The minimum required set is legal name, institution type, country, official
  email, primary contact and LMS administrator. Everything else may be filled in
  later by the institution admin.
* Branding, programs, courses, grading and delivery model are deliberately out of
  scope; they are configured inside the workspace after activation.
"""
from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class OwnershipType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    GOVERNMENT = "government"
    NGO = "ngo"
    RELIGIOUS = "religious"
    OTHER = "other"


class TermStructure(str, Enum):
    SEMESTER = "semester"
    TRIMESTER = "trimester"
    QUARTER = "quarter"
    YEAR = "year"
    CONTINUOUS = "continuous"


class BillingCycle(str, Enum):
    ANNUAL = "annual"
    SEMI_ANNUAL = "semi_annual"
    QUARTERLY = "quarterly"
    MONTHLY = "monthly"


class _Section(BaseModel):
    """Sections are optional as a whole; only the guide's minimum set is required."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


# 1. Institution Identity — legal name and institution type live on the service
#    request itself, so they are not repeated here.
class InstitutionIdentity(_Section):
    institution_code: str | None = Field(default=None, max_length=32)
    short_name: str | None = Field(default=None, max_length=80)
    ownership_type: OwnershipType | None = None
    registration_number: str | None = Field(default=None, max_length=80)
    year_established: int | None = Field(default=None, ge=1000, le=2200)


# 2. Contact Information
class ContactInformation(_Section):
    main_phone: str | None = Field(default=None, max_length=50)
    secondary_phone: str | None = Field(default=None, max_length=50)
    official_email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=200)
    inquiry_email: EmailStr | None = None
    admissions_email: EmailStr | None = None
    registrar_email: EmailStr | None = None


# 3. Physical Address
class PhysicalAddress(_Section):
    country: str | None = Field(default=None, max_length=100)
    state_region: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    sub_city: str | None = Field(default=None, max_length=100)
    street: str | None = Field(default=None, max_length=250)
    postal_code: str | None = Field(default=None, max_length=30)


# 4. Primary Contact Person
class PrimaryContact(_Section):
    full_name: str | None = Field(default=None, max_length=200)
    job_title: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)


# 5. Institution Leadership
class Leadership(_Section):
    president: str | None = Field(default=None, max_length=200)
    vice_president: str | None = Field(default=None, max_length=200)
    academic_head: str | None = Field(default=None, max_length=200)
    registrar: str | None = Field(default=None, max_length=200)
    hr_contact: str | None = Field(default=None, max_length=200)
    finance_contact: str | None = Field(default=None, max_length=200)


# 6. Academic Structure
class AcademicStructure(_Section):
    campus_count: int | None = Field(default=None, ge=0, le=1000)
    campuses: list[str] = Field(default_factory=list, max_length=200)
    colleges: list[str] = Field(default_factory=list, max_length=200)
    faculties: list[str] = Field(default_factory=list, max_length=200)
    departments: list[str] = Field(default_factory=list, max_length=500)
    academic_units: list[str] = Field(default_factory=list, max_length=500)


# 7. Academic Calendar
class AcademicCalendar(_Section):
    current_academic_year: str | None = Field(default=None, max_length=20)
    start_date: date | None = None
    end_date: date | None = None
    term_structure: TermStructure | None = None
    term_count: int | None = Field(default=None, ge=1, le=12)
    registration_start: date | None = None
    registration_end: date | None = None
    class_start: date | None = None
    class_end: date | None = None
    exam_start: date | None = None
    exam_end: date | None = None

    @field_validator("end_date", "registration_end", "class_end", "exam_end")
    @classmethod
    def _not_before_start(cls, value: date | None, info):
        starts = {
            "end_date": "start_date",
            "registration_end": "registration_start",
            "class_end": "class_start",
            "exam_end": "exam_start",
        }
        start = info.data.get(starts[info.field_name])
        if value and start and value < start:
            raise ValueError(f"{info.field_name} cannot be before {starts[info.field_name]}")
        return value


# 8. Certification Information
class CertificationInfo(_Section):
    certificate_types: list[str] = Field(default_factory=list, max_length=50)
    signatory_name: str | None = Field(default=None, max_length=200)
    signatory_title: str | None = Field(default=None, max_length=150)
    numbering_format: str | None = Field(default=None, max_length=100)
    has_institutional_seal: bool | None = None


# 9. Berana LMS Administrator — becomes the institution admin account at activation.
class LmsAdministrator(_Section):
    full_name: str = Field(min_length=1, max_length=200)
    job_title: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    administrator_role: str = Field(default="Institution Admin", max_length=80)


# 10. Subscription & Licensing — the institution states what it wants; activation
#     dates and renewal are set by the console when Cyber-Zeb activates.
class SubscriptionRequest(_Section):
    package: str | None = Field(default=None, max_length=100)
    license_type: str | None = Field(default=None, max_length=100)
    contracted_users: int | None = Field(default=None, ge=1, le=10_000_000)
    billing_cycle: BillingCycle | None = None


class InstitutionMasterData(BaseModel):
    """The full master data document stored on a service request."""

    model_config = ConfigDict(extra="forbid")

    identity: InstitutionIdentity = Field(default_factory=InstitutionIdentity)
    contact: ContactInformation = Field(default_factory=ContactInformation)
    address: PhysicalAddress = Field(default_factory=PhysicalAddress)
    primary_contact: PrimaryContact = Field(default_factory=PrimaryContact)
    leadership: Leadership = Field(default_factory=Leadership)
    academic_structure: AcademicStructure = Field(default_factory=AcademicStructure)
    academic_calendar: AcademicCalendar = Field(default_factory=AcademicCalendar)
    certification: CertificationInfo = Field(default_factory=CertificationInfo)
    lms_administrator: LmsAdministrator
    subscription: SubscriptionRequest = Field(default_factory=SubscriptionRequest)

    @field_validator("address")
    @classmethod
    def _country_required(cls, value: PhysicalAddress) -> PhysicalAddress:
        # Guide, Development Notes: country is part of the required minimum.
        if not (value.country or "").strip():
            raise ValueError("Country is required")
        return value

    @field_validator("contact")
    @classmethod
    def _official_email_required(cls, value: ContactInformation) -> ContactInformation:
        if not value.official_email:
            raise ValueError("Official institution email is required")
        return value

    @field_validator("primary_contact")
    @classmethod
    def _primary_contact_required(cls, value: PrimaryContact) -> PrimaryContact:
        if not (value.full_name or "").strip() or not value.email:
            raise ValueError("Primary contact name and email are required")
        return value


# Display order and labels for the console's read-only view of a submitted record.
SECTION_LABELS: dict[str, str] = {
    "identity": "Institution Identity",
    "contact": "Contact Information",
    "address": "Physical Address",
    "primary_contact": "Primary Contact Person",
    "leadership": "Institution Leadership",
    "academic_structure": "Academic Structure",
    "academic_calendar": "Academic Calendar",
    "certification": "Certification Information",
    "lms_administrator": "Berana LMS Administrator",
    "subscription": "Subscription & Licensing",
}
