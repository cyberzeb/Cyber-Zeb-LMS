"""
Structural rules for the academic hierarchy.

    Campus → College → Department → Program → Course → Course Offering → Enrollment
    Academic Year → Academic Term (an offering runs in one term)

Every write is checked against the data already stored, so a record can never
point at a parent that does not exist. Rules that would break existing records
(a legacy offering with no term, for example) only apply to newly created rows.
"""
from __future__ import annotations

from typing import Any, Awaitable, Callable, Optional

Record = dict[str, Any]
Loader = Callable[[str], Awaitable[Any]]


class StructureViolation(Exception):
    """Raised when a record would break the academic hierarchy."""


async def _ids(load: Loader, collection: str) -> set[str]:
    data = await load(collection)
    if not isinstance(data, list):
        return set()
    return {r.get("id") for r in data if isinstance(r, dict) and r.get("id")}


async def _require(
    load: Loader,
    record: Record,
    field: str,
    collection: str,
    label: str,
    *,
    required: bool,
) -> None:
    value = record.get(field)
    if not value:
        if required:
            raise StructureViolation(f"{label} is required")
        return
    if value not in await _ids(load, collection):
        raise StructureViolation(f"{label} does not exist ({value})")


async def _record_of(load: Loader, collection: str, record_id: str) -> Optional[Record]:
    data = await load(collection)
    if not isinstance(data, list):
        return None
    return next((r for r in data if isinstance(r, dict) and r.get("id") == record_id), None)


async def check_structure(
    collection: str,
    old: Optional[Record],
    new: Record,
    load: Loader,
) -> None:
    """Validate one created/updated record. `old is None` means it is new."""
    is_new = old is None

    if collection == "colleges":
        await _require(load, new, "campusId", "campuses", "Campus", required=False)

    elif collection == "departments":
        await _require(load, new, "collegeId", "colleges", "College", required=False)
        await _require(load, new, "campusId", "campuses", "Campus", required=False)

    elif collection == "programs":
        await _require(load, new, "departmentId", "departments", "Department", required=is_new)

    elif collection == "academic-terms":
        await _require(load, new, "academicYearId", "academic-years", "Academic year", required=is_new)

    elif collection == "course-offerings":
        await _require(load, new, "courseId", "courses", "Catalog course", required=True)
        await _require(
            load, new, "academicTermId", "academic-terms", "Academic term", required=is_new
        )
        await _require(load, new, "departmentId", "departments", "Department", required=False)

    elif collection == "enrollments":
        await _require(load, new, "studentId", "people", "Student", required=True)
        await _require(
            load, new, "courseOfferingId", "course-offerings", "Course offering", required=is_new
        )
        offering_id = new.get("courseOfferingId")
        course_id = new.get("courseId")
        if offering_id and course_id:
            offering = await _record_of(load, "course-offerings", offering_id)
            if offering and offering.get("courseId") != course_id:
                raise StructureViolation(
                    "Enrollment course does not match the course of its offering"
                )


# Collections whose records are validated on a whole-collection replace as well.
VALIDATED_COLLECTIONS = frozenset(
    {"colleges", "departments", "programs", "academic-terms", "course-offerings", "enrollments"}
)
