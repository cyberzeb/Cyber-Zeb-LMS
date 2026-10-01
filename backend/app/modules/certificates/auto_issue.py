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

Corporate Edition: a certification expires after the recertification interval of
the employee's job role. Once it has expired and the employee completes the new
training round, a fresh certificate is issued.

Training Edition: one certificate per program, not per course. A learner in a
cohort earns it when every course of the program meets the rule above and their
attendance at the cohort's sessions reaches the program's minimum.
"""
from __future__ import annotations

import secrets
from dataclasses import dataclass
import calendar
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
    def from_settings(cls, settings: Any, *, corporate: bool = False, edition: str = "") -> "Rules":
        """
        Corporate training is complete when it is finished, and needs no approval
        step. A training program is complete when its courses are finished and
        passed, and is certified straight away too.
        """
        if corporate or edition == "corporate":
            default = cls(rule="lessons", require_approval=False)
        elif edition == "training":
            default = cls(rule="both", require_approval=False)
        else:
            default = cls()
        raw = (settings or {}).get("certificates") if isinstance(settings, dict) else None
        if not isinstance(raw, dict):
            return default
        rule = raw.get("rule") if raw.get("rule") in ("lessons", "passed", "both") else default.rule
        try:
            min_percent = float(raw.get("minPercent", 50))
        except (TypeError, ValueError):
            min_percent = 50
        return cls(
            enabled=bool(raw.get("autoIssue", True)),
            rule=rule,
            min_percent=max(0.0, min(100.0, min_percent)),
            require_approval=bool(raw.get("requireApproval", default.require_approval)),
        )


def add_months(start: date, months: int) -> date:
    month = start.month - 1 + months
    year = start.year + month // 12
    month = month % 12 + 1
    return date(year, month, min(start.day, calendar.monthrange(year, month)[1]))


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
    corporate: bool = False,
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

    job_roles = {r.get("id"): r for r in collections.get("job-roles") or [] if isinstance(r, dict)}

    def still_counts(cert: Record) -> bool:
        # Revoked stays blocked; an expired certification may be renewed.
        if cert.get("status") == "revoked":
            return True
        expiry = str(cert.get("expirationDate") or "")[:10]
        return not expiry or expiry >= today.isoformat()

    existing = {(c.get("studentId"), c.get("courseId")) for c in certificates if still_counts(c)}
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
        if corporate:
            # Each training round has its own progress (recertification starts at 0).
            lessons_complete = float(enrollment.get("progress") or 0) >= 100
        else:
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

        expiration = None
        if corporate:
            role = job_roles.get(student.get("jobRoleId"))
            months = int((role or {}).get("recertificationMonths") or 0)
            if months > 0 and cid in ((role or {}).get("requiredCourseIds") or []):
                expiration = add_months(today, months).isoformat()
        completed_on = str(enrollment.get("completedOn") or "")[:10] or today.isoformat()

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
                "completionDate": completed_on,
                "expirationDate": expiration,
                "issueDate": None if status == "pending" else today.isoformat(),
                "templateId": template_id,
                "templateName": template_names.get(template_id) or "Certificate",
                "status": status,
                "autoIssued": True,
                "finalPercent": percent,
            }
        )
    return out



def _records(data: Any) -> list[Record]:
    return [r for r in data if isinstance(r, dict)] if isinstance(data, list) else []


def evaluate_training(
    collections: dict[str, Any],
    rules: Rules,
    *,
    student_id: Optional[str] = None,
    course_id: Optional[str] = None,
    today: Optional[date] = None,
) -> list[Record]:
    """Program certificates that should now exist but do not (Training Edition). Pure."""
    from app.modules.training import logic

    if not rules.enabled:
        return []
    today = today or date.today()
    people = {p.get("id"): p for p in _records(collections.get("people"))}
    courses = {c.get("id"): c for c in _records(collections.get("courses"))}
    programs = {p.get("id"): p for p in _records(collections.get("training-programs"))}
    cohorts = {c.get("id"): c for c in _records(collections.get("cohorts"))}
    sessions = _records(collections.get("cohort-attendance"))
    enrollments = _records(collections.get("enrollments"))
    certificates = _records(collections.get("certificates"))
    progress = collections.get("lesson-progress") or {}
    assessments = [*_records(collections.get("assignments")), *_records(collections.get("quizzes"))]
    submissions = _records(collections.get("student-submissions"))

    templates = _records(collections.get("certificate-templates"))
    default_template = next((t for t in templates if t.get("isDefault")), None)
    default_template_id = (default_template or {}).get("id") or "tpl-standard"
    template_names = {**PRESET_TEMPLATE_NAMES, **{t.get("id"): t.get("name") for t in templates}}

    # A program certificate is issued once per learner; a revoked one stays revoked.
    existing = {(c.get("studentId"), c.get("programId") or c.get("courseId")) for c in certificates}
    taken = {str(c.get("certificateId")) for c in certificates}
    out: list[Record] = []

    for registration in _records(collections.get("cohort-registrations")):
        if registration.get("status") != "enrolled":
            continue
        sid = registration.get("studentId")
        cohort = cohorts.get(registration.get("cohortId"))
        program = programs.get(registration.get("programId") or (cohort or {}).get("programId"))
        student = people.get(sid)
        if not cohort or not program or not student or (student_id and sid != student_id):
            continue
        pid = program.get("id")
        course_ids = [c for c in program.get("courseIds") or [] if c in courses]
        if not course_ids or (course_id and course_id not in course_ids) or (sid, pid) in existing:
            continue
        if program.get("certificateEnabled") is False:
            continue

        mine = {
            e.get("courseId"): e
            for e in enrollments
            if e.get("studentId") == sid and e.get("cohortId") == cohort.get("id") and e.get("status") != "withdrawn"
        }
        done_lessons = (progress.get(sid) or {}) if isinstance(progress, dict) else {}
        lessons_complete = True
        for cid in course_ids:
            enrollment = mine.get(cid)
            if not enrollment:
                lessons_complete = False
                break
            lessons = _lesson_ids(courses[cid])
            done = set(done_lessons.get(cid) or [])
            finished = float(enrollment.get("progress") or 0) >= 100 or (
                bool(lessons) and all(lesson in done for lesson in lessons)
            )
            if not finished:
                lessons_complete = False
                break

        percents = [p for p in (course_percent(sid, cid, assessments, submissions) for cid in course_ids) if p is not None]
        percent = round(sum(percents) / len(percents)) if percents else None
        passed = percent is not None and percent >= rules.min_percent

        if rules.rule == "lessons":
            eligible = lessons_complete
        elif rules.rule == "passed":
            eligible = passed
        else:
            # A program without graded work is judged on completion alone.
            eligible = lessons_complete and (passed or percent is None)
        attendance = logic.attendance_rate(str(sid), str(cohort.get("id")), sessions)
        if attendance is not None and attendance < logic.min_attendance(program):
            eligible = False
        if not eligible:
            continue

        trainer = people.get(cohort.get("trainerId")) or {}
        completed = sorted(str(e.get("completedOn") or "")[:10] for e in mine.values() if e.get("completedOn"))
        template_id = program.get("certificateTemplateId") or default_template_id
        status = "pending" if rules.require_approval else "issued"
        certificate_id = new_certificate_id(today.year, taken)
        taken.add(certificate_id)
        existing.add((sid, pid))
        out.append(
            {
                "id": f"cert-auto-{secrets.token_hex(6)}",
                "certificateId": certificate_id,
                "studentId": sid,
                "studentName": student.get("name", ""),
                "courseId": pid,
                "courseCode": program.get("code", ""),
                "courseTitle": program.get("name", ""),
                "programId": pid,
                "cohortId": cohort.get("id"),
                "cohortName": cohort.get("name", ""),
                "totalHours": program.get("totalHours"),
                "instructorId": cohort.get("trainerId"),
                "instructorName": trainer.get("name") or "Training team",
                "department": program.get("divisionName") or "",
                "campusId": student.get("campusId") or "c1",
                "completionDate": (completed[-1] if completed else "") or today.isoformat(),
                "expirationDate": None,
                "issueDate": None if status == "pending" else today.isoformat(),
                "templateId": template_id,
                "templateName": template_names.get(template_id) or "Certificate",
                "status": status,
                "autoIssued": True,
                "finalPercent": percent,
                "attendancePercent": attendance,
            }
        )
    return out
