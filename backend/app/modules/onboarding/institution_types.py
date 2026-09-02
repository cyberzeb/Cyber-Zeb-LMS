"""Institution type classification — exactly 3 categories platform-wide."""
from __future__ import annotations

from enum import Enum


class InstitutionType(str, Enum):
    COLLEGE_UNIVERSITY = "college_university"
    TRAINING = "training"
    CORPORATE = "corporate"


INSTITUTION_TYPE_LABELS: dict[InstitutionType, str] = {
    InstitutionType.COLLEGE_UNIVERSITY: "College / University",
    InstitutionType.TRAINING: "Training",
    InstitutionType.CORPORATE: "Corporate",
}

# URL path segment used when building tenant links (Super Admin display / emails).
INSTITUTION_TYPE_URL_SEGMENTS: dict[InstitutionType, str] = {
    InstitutionType.COLLEGE_UNIVERSITY: "college",
    InstitutionType.TRAINING: "training",
    InstitutionType.CORPORATE: "corporate",
}

URL_SEGMENT_TO_INSTITUTION_TYPE: dict[str, InstitutionType] = {
    segment: inst_type for inst_type, segment in INSTITUTION_TYPE_URL_SEGMENTS.items()
}


def institution_type_label(value: InstitutionType | str) -> str:
    try:
        key = value if isinstance(value, InstitutionType) else InstitutionType(value)
    except ValueError:
        return str(value)
    return INSTITUTION_TYPE_LABELS[key]


def institution_type_url_segment(value: InstitutionType | str) -> str:
    try:
        key = value if isinstance(value, InstitutionType) else InstitutionType(value)
    except ValueError:
        return "college"
    return INSTITUTION_TYPE_URL_SEGMENTS[key]


def institution_type_from_url_segment(segment: str) -> InstitutionType | None:
    normalized = segment.strip().lower()
    for inst_type, url_segment in INSTITUTION_TYPE_URL_SEGMENTS.items():
        if url_segment == normalized:
            return inst_type
    return None
