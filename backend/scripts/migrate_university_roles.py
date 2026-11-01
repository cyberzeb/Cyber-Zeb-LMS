"""
Move existing University tenants to the seven-role model.

University Edition roles: Institution Admin, Registrar, Finance Officer,
Instructor, Teaching Assistant, Student, Parent/Guardian.

For every university tenant:
  - Head of Department accounts become Instructors (they are faculty).
  - Staff and Help Desk accounts are listed, not changed: an admin decides
    whether each becomes a Registrar or Finance Officer, or is removed.

For the `berana` demo tenant it also brings the demo accounts in line with
backend/seed_data/demo.json: adds the Finance Officer and Teaching Assistant
demo users, assigns the assistants to their courses and drops the retired
Head of Department / Help Desk demo users.

Safe to run more than once. Usage (from backend/):
    python -m scripts.migrate_university_roles            # dry run
    python -m scripts.migrate_university_roles --apply
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.lms_store.service import LmsStoreService
from app.modules.tenants.models import Tenant

DEMO_TENANT = "berana"
DEMO_SEED = Path(__file__).resolve().parents[1] / "seed_data" / "demo.json"
RETIRED_DEMO_IDS = {"u-hod-cs", "u14"}
NEW_DEMO_IDS = ("u-fin", "u-ta-1", "u-ta-2")


def _is_university(tenant: Tenant) -> bool:
    kind = getattr(tenant.institution_type, "value", tenant.institution_type)
    return str(kind).lower() not in ("corporate", "training")


def _migrate_people(people: list[dict], log: list[str]) -> list[dict]:
    out = []
    for person in people:
        role = person.get("role")
        if role == "HeadOfDepartment":
            log.append(f"  {person.get('name')} <{person.get('email')}>: Head of Department -> Instructor")
            person = {**person, "role": "Instructor"}
        elif role in ("Staff", "HelpDesk"):
            log.append(
                f"  REVIEW {person.get('name')} <{person.get('email')}> is '{role}', which University no "
                "longer uses: make them Registrar or Finance Officer on the Administrators page, or remove them."
            )
        out.append(person)
    return out


def _demo_updates(people: list[dict], courses: list[dict], log: list[str]) -> tuple[list[dict], list[dict]]:
    seed = json.loads(DEMO_SEED.read_text(encoding="utf-8"))["collections"]
    seed_people = {p["id"]: p for p in seed["people"]}
    seed_tas = {c["id"]: c.get("teachingAssistantIds") for c in seed["courses"] if c.get("teachingAssistantIds")}

    kept = [p for p in people if p.get("id") not in RETIRED_DEMO_IDS]
    for pid in RETIRED_DEMO_IDS & {p.get("id") for p in people}:
        log.append(f"  removed retired demo account {pid}")
    existing = {p.get("id") for p in kept}
    emails = {str(p.get("email", "")).lower() for p in kept}
    for pid in NEW_DEMO_IDS:
        person = seed_people.get(pid)
        if person and pid not in existing and person["email"].lower() not in emails:
            kept.append(person)
            log.append(f"  added demo {person['role']} {person['name']} <{person['email']}>")

    guardian = next((p for p in kept if p.get("id") == "u4" and p.get("role") == "Guardian"), None)
    if guardian is not None and not guardian.get("linkedStudentIds"):
        guardian["linkedStudentId"] = "u1"
        guardian["linkedStudentIds"] = ["u1"]
        log.append("  linked demo guardian u4 to student u1")

    updated_courses = []
    for course in courses:
        tas = seed_tas.get(course.get("id"))
        if tas and not course.get("teachingAssistantIds"):
            course = {**course, "teachingAssistantIds": tas}
            log.append(f"  course {course.get('code')}: teaching assistants {', '.join(tas)}")
        updated_courses.append(course)
    return kept, updated_courses


async def migrate(apply: bool) -> None:
    async with AsyncSessionLocal() as db:
        tenants = (await db.execute(select(Tenant))).scalars().all()
        store = LmsStoreService(db)
        for tenant in tenants:
            if not _is_university(tenant):
                continue
            log: list[str] = []
            people = await store.get_collection(tenant.id, "people", [])
            courses = await store.get_collection(tenant.id, "courses", [])
            if not isinstance(people, list):
                continue
            new_people, new_courses = people, courses
            if tenant.code == DEMO_TENANT and isinstance(courses, list):
                new_people, new_courses = _demo_updates(people, courses, log)
            new_people = _migrate_people(new_people, log)

            print(f"{tenant.code} ({tenant.name}):")
            print("\n".join(log) if log else "  nothing to change")
            if apply and log:
                await store.repo.upsert(tenant.id, "people", new_people)
                if new_courses is not courses:
                    await store.repo.upsert(tenant.id, "courses", new_courses)
                await db.commit()
        if not apply:
            print("\nDry run only. Re-run with --apply to save these changes.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="save the changes (default: dry run)")
    asyncio.run(migrate(parser.parse_args().apply))


if __name__ == "__main__":
    main()
