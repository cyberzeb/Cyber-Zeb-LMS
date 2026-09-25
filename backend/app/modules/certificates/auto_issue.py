"""
Automatic certificates on course completion.

The rules run on the server because learners may not write certificates. Each
institution chooses them in Settings → Certificates (stored in the `settings`
collection under "certificates"):

* rule "lessons" — every lesson of the course is complete;
* rule "passed"  — the course grade (graded work, as on the transcript) is at
  least `minPercent`;
* rule "both"    — both of the above.

With `requireApproval` the certificate is created as "pending" and an admin
approves it; otherwise it is issued at once. A student/course pair that already
has a certificate — even a revoked one — is never issued again automatically,
so an admin's revocation sticks.
"""
from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import date
from typing import Any, Iterable, Optional

Record = dict[str, Any]

# Crockford base32, as the portal uses: no I, L, O or U.
_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

PRESET_TEMPLATE_NAMES = {
    "tpl-standard": "Standard Completion Certificate",
    "tpl-professional": "Professional Certificate",
    "tpl-emerald": "Emerald Academic",
    "tpl-royal": "Royal Honours",
    "tpl-minimal": "Minimal Mono",
    "tpl-tech": "Tech Blueprint",
}


@dataclass(frozen=True)
class Rules:
    enabled: bool = True
    rule: str = "passed"
    min_percent: float = 50
    require_approval: bool = True

    @classmethod
    def from_settings(cls, settings: Any) -> "Rules":
        raw = (settings or {}).get("certificates") if isinstance(settings, dict) else None
        if not isinstance(raw, dict):
            return cls()
        rule = raw.get("rule") if raw.get("rule") in ("lessons", "passed", "both") else "passed"
        try:
            min_percent = float(raw.get("minPercent", 50))
        except (TypeError, ValueError):
            min_percent = 50
        return cls(
            enabled=bool(raw.get("autoIssue", True)),
            rule=rule,
            min_percent=max(0.0, min(100.0, min_percent)),
            require_approval=bool(raw.get("requireApproval", True)),
        )


def new_certificate_id(year: int, taken: set[str]) -> str:
    while True:
        block = lambda: "".join(secrets.choice(_ALPHABET) for _ in range(4))  # noqa: E731
        candidate = f"BER-CERT-{year}-{block()}-{block()}"
        if candidate not in taken:
            return candidate


def _lesson_ids(course: Record) -> list[str]:
    ids: list[str] = []
    for module in course.get("modules") or []:
        for lesson in (module or {}).get("lessons") or []:
            if isinstance(lesson, dict) and lesson.get("id"):
                ids.append(str(lesson["id"]))
    return ids


def course_percent(student_id: str, course_id: str, assessments: Iterable[Record], submissions: Iterable[Record]) -> Optional[float]:
    """Points earned over points possible across graded work — as the transcript computes it."""
    course_assessments = {a.get("id") for a in assessments if a.get("courseId") == course_id}
    earned = possible = 0.0
    for s in submissions:
        if (
            s.get("studentId") == student_id
            and s.get("status") == "graded"
            and s.get("assessmentId") in course_assessments
            and isinstance(s.get("score"), (int, float))
            and isinstance(s.get("maxScore"), (int, float))
            and s["maxScore"] > 0
        ):
            earned += float(s["score"])
            possible += float(s["maxScore"])
    if possible <= 0:
        return None
    return round(earned / possible * 100)


def evaluate(
    collections: dict[str, Any],
    rules: Rules,
    *,
    student_id: Optional[str] = None,
    course_id: Optional[str] = None,
    today: Optional[date] = None,
) -> list[Record]:
    """Certificates that should now exist but do not. Pure: reads, never writes."""
    if not rules.enabled:
        return []
    today = today or date.today()
    people = {p.get("id"): p for p in collections.get("people") or [] if isinstance(p, dict)}
    courses = {c.get("id"): c for c in collections.get("courses") or [] if isinstance(c, dict)}
    certificates = [c for c in collections.get("certificates") or [] if isinstance(c, dict)]
    progress = collections.get("lesson-progress") or {}
    assessments = [
        *[a for a in collections.get("assignments") or [] if isinstance(a, dict)],
        *[q for q in collections.get("quizzes") or [] if isinstance(q, dict)],
    ]
    submissions = [s for s in collections.get("student-submissions") or [] if isinstance(s, dict)]

    templates = [t for t in collections.get("certificate-templates") or [] if isinstance(t, dict)]
    default_template = next((t for t in templates if t.get("isDefault")), None)
    default_template_id = (default_template or {}).get("id") or "tpl-standard"
    template_names = {**PRESET_TEMPLATE_NAMES, **{t.get("id"): t.get("name") for t in templates}}

    existing = {(c.get("studentId"), c.get("courseId")) for c in certificates}
    taken = {str(c.get("certificateId")) for c in certificates}
    out: list[Record] = []

    for enrollment in collections.get("enrollments") or []:
        if not isinstance(enrollment, dict):
            continue
        sid, cid = enrollment.get("studentId"), enrollment.get("courseId")
        if student_id and sid != student_id or course_id and cid != course_id:
            continue
        if enrollment.get("status") in ("withdrawn", "pending") or (sid, cid) in existing:
            continue
        course = courses.get(cid)
        student = people.get(sid)
        if not course or not student or course.get("certificateEnabled") is False or course.get("status") == "archived":
            continue

        lessons = _lesson_ids(course)
        done = set(((progress.get(sid) or {}) if isinstance(progress, dict) else {}).get(cid) or [])
        lessons_complete = bool(lessons) and all(lesson in done for lesson in lessons)
        percent = course_percent(sid, cid, assessments, submissions)
        passed = percent is not None and percent >= rules.min_percent

        if rules.rule == "lessons":
            eligible = lessons_complete
        elif rules.rule == "passed":
            eligible = passed
        else:
            # A course without lessons is judged on its grade alone.
            eligible = passed and (lessons_complete or not lessons)
        if not eligible:
            continue

        template_id = course.get("certificateTemplateId") or default_template_id
        status = "pending" if rules.require_approval else "issued"
        certificate_id = new_certificate_id(today.year, taken)
        taken.add(certificate_id)
        existing.add((sid, cid))
        out.append(
            {
                "id": f"cert-auto-{secrets.token_hex(6)}",
                "certificateId": certificate_id,
                "studentId": sid,
                "studentName": student.get("name", ""),
                "courseId": cid,
                "courseCode": course.get("code", ""),
                "courseTitle": course.get("title", ""),
                "instructorId": course.get("instructorId"),
                "instructorName": course.get("instructor") or "Unassigned",
                "department": course.get("department", ""),
                "campusId": student.get("campusId") or course.get("campusId") or "c1",
                "completionDate": today.isoformat(),
                "issueDate": None if status == "pending" else today.isoformat(),
                "templateId": template_id,
                "templateName": template_names.get(template_id) or "Certificate",
                "status": status,
                "autoIssued": True,
                "finalPercent": percent,
            }
        )
    return out
