"""
Move university tenants to Department → Program → Curriculum.

Before: a department *was* the degree (program code, level, years and
semesters lived on the department) and students/sections pointed at it.
After: a department offers one or more programs; each program has a duration
and a curriculum; students and sections belong to a program.

For every university tenant this:
  - makes sure each department has at least one program, created from the
    degree fields stored on the department;
  - fills an empty curriculum from the sections the department already runs;
  - gives every student and every section the program of their department;
  - removes the old degree fields from departments.
For the `berana` demo it also adds the demo MSc in Computer Science.

Safe to run more than once. Usage (from backend/):
    python -m scripts.migrate_programs            # dry run
    python -m scripts.migrate_programs --apply
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.lms_store.service import LmsStoreService
from app.modules.tenants.models import Tenant

DEGREE_FIELDS = ("programCode", "programLevel", "maxYears", "semestersPerYear")
LEVEL_PREFIX = {
    "Undergraduate": "BSc in",
    "Postgraduate": "MSc in",
    "Doctoral": "PhD in",
    "Certificate": "Certificate in",
}
DEMO_TENANT = "berana"
DEMO_SEED = Path(__file__).resolve().parents[1] / "seed_data" / "demo.json"


def _is_university(tenant: Tenant) -> bool:
    kind = getattr(tenant.institution_type, "value", tenant.institution_type)
    return str(kind).lower() not in ("corporate", "training")


def _years(program: dict) -> int:
    if isinstance(program.get("durationYears"), int):
        return program["durationYears"]
    match = re.match(r"\s*(\d+)", str(program.get("duration") or ""))
    return int(match.group(1)) if match else 4


def migrate_tenant(collections: dict, demo: bool) -> tuple[dict, list[str]]:
    """Return the changed collections and a log of what changed."""
    log: list[str] = []
    departments = [dict(d) for d in collections.get("departments") or [] if isinstance(d, dict)]
    programs = [dict(p) for p in collections.get("programs") or [] if isinstance(p, dict)]
    people = [dict(p) for p in collections.get("people") or [] if isinstance(p, dict)]
    offerings = [dict(o) for o in collections.get("course-offerings") or [] if isinstance(o, dict)]
    changed: set[str] = set()

    # 1. Every department offers at least one program.
    for dept in departments:
        if any(p.get("departmentId") == dept.get("id") for p in programs):
            continue
        level = dept.get("programLevel") or "Undergraduate"
        years = int(dept.get("maxYears") or 4)
        program = {
            "id": f"prog-{dept['id']}",
            "code": dept.get("programCode") or str(dept["id"]).upper(),
            "name": f"{LEVEL_PREFIX.get(level, 'Program in')} {dept.get('name', '')}".strip(),
            "level": level,
            "departmentId": dept["id"],
            "department": dept.get("name", ""),
            "campusId": dept.get("campusId"),
            "durationYears": years,
            "semestersPerYear": int(dept.get("semestersPerYear") or 2),
            "duration": f"{years} year{'' if years == 1 else 's'}",
            "curriculum": [],
            "enrolledCount": 0,
            "courseCount": 0,
            "status": "active",
        }
        programs.append(program)
        changed.add("programs")
        log.append(f"  program created: {program['name']} ({program['code']})")

    # 2. Programs carry numeric duration and semesters.
    dept_by_id = {d.get("id"): d for d in departments}
    for program in programs:
        dept = dept_by_id.get(program.get("departmentId"), {})
        if not isinstance(program.get("durationYears"), int):
            program["durationYears"] = int(dept.get("maxYears") or _years(program))
            changed.add("programs")
        if not isinstance(program.get("semestersPerYear"), int):
            program["semestersPerYear"] = int(dept.get("semestersPerYear") or 2)
            changed.add("programs")
        program.setdefault("curriculum", [])

    first_program = {}
    for program in programs:
        first_program.setdefault(program.get("departmentId"), program)

    # 3. Sections and students belong to a program.
    for offering in offerings:
        if offering.get("programId"):
            continue
        program = first_program.get(offering.get("departmentId"))
        if program:
            offering["programId"] = program["id"]
            offering["programName"] = program.get("name")
            changed.add("course-offerings")
    dept_by_name = {d.get("name"): d.get("id") for d in departments}
    moved = 0
    for person in people:
        if person.get("role") != "Student" or person.get("programId"):
            continue
        dept_id = person.get("departmentId") or dept_by_name.get(person.get("department"))
        program = first_program.get(dept_id)
        if program:
            person["programId"] = program["id"]
            moved += 1
    if moved:
        changed.add("people")
        log.append(f"  {moved} student(s) assigned to their department's program")
    tagged = sum(1 for o in offerings if o.get("programId"))
    if "course-offerings" in changed:
        log.append(f"  {tagged} section(s) linked to a program")

    # 4. Empty curricula are filled from the sections each program already runs.
    for program in programs:
        if program["curriculum"]:
            continue
        seen = set()
        for offering in offerings:
            if offering.get("programId") != program["id"]:
                continue
            key = (offering.get("courseId"), offering.get("studyYear"), offering.get("programSemester") or 1)
            if None in key or key in seen:
                continue
            seen.add(key)
            program["curriculum"].append(
                {"courseId": key[0], "studyYear": key[1], "semester": key[2], "type": "core"}
            )
        if program["curriculum"]:
            program["courseCount"] = len({e["courseId"] for e in program["curriculum"]})
            changed.add("programs")
            log.append(f"  curriculum for {program['code']}: {len(program['curriculum'])} course(s) from existing sections")

    # 5. Demo: one department with two programs.
    if demo:
        seed = json.loads(DEMO_SEED.read_text(encoding="utf-8"))["collections"]
        for program in seed.get("programs", []):
            if program["id"] == "prog-d1-msc" and not any(p.get("id") == program["id"] for p in programs):
                programs.append(program)
                changed.add("programs")
                log.append(f"  demo program added: {program['name']}")

    # 6. Departments drop the degree fields (they live on programs now).
    for dept in departments:
        if any(field in dept for field in DEGREE_FIELDS):
            for field in DEGREE_FIELDS:
                dept.pop(field, None)
            changed.add("departments")
    if "departments" in changed:
        log.append("  degree fields removed from departments")

    out = {
        "departments": departments,
        "programs": programs,
        "people": people,
        "course-offerings": offerings,
    }
    return {k: v for k, v in out.items() if k in changed}, log


async def run(apply: bool) -> None:
    async with AsyncSessionLocal() as db:
        store = LmsStoreService(db)
        for tenant in (await db.execute(select(Tenant))).scalars().all():
            if not _is_university(tenant):
                continue
            collections = {
                key: await store.get_collection(tenant.id, key)
                for key in ("departments", "programs", "people", "course-offerings")
            }
            if not collections["departments"]:
                continue
            updates, log = migrate_tenant(collections, demo=tenant.code == DEMO_TENANT)
            if not updates:
                continue
            print(f"{tenant.code} ({tenant.name}):")
            print("\n".join(log))
            if apply:
                for key, data in updates.items():
                    await store.repo.ensure_row(tenant.id, key, data)
                    await store.repo.upsert(tenant.id, key, data)
                await db.commit()
        if not apply:
            print("\nDry run only. Re-run with --apply to save these changes.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="save the changes (default: dry run)")
    asyncio.run(run(parser.parse_args().apply))


if __name__ == "__main__":
    main()
