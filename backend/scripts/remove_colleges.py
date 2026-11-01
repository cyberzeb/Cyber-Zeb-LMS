"""
Remove colleges from every institution: the structure is Campus → Department.

For each tenant this deletes the `colleges` collection and drops `collegeId`
from departments and programs. A department without a campus is put on the
campus its old college belonged to. Nothing else changes.

Safe to run more than once. Usage (from backend/):
    python -m scripts.remove_colleges            # dry run
    python -m scripts.remove_colleges --apply
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.lms_store.service import LmsStoreService
from app.modules.tenants.models import Tenant


def _unlink(records: object, college_campus: dict[str, str]) -> tuple[list, int]:
    """Drop collegeId from each record; fill a missing campus from the old college."""
    if not isinstance(records, list):
        return records, 0  # type: ignore[return-value]
    changed = 0
    out = []
    for record in records:
        if isinstance(record, dict) and "collegeId" in record:
            record = dict(record)
            college_id = record.pop("collegeId")
            if not record.get("campusId") and college_campus.get(college_id):
                record["campusId"] = college_campus[college_id]
            changed += 1
        out.append(record)
    return out, changed


async def run(apply: bool) -> None:
    async with AsyncSessionLocal() as db:
        store = LmsStoreService(db)
        for tenant in (await db.execute(select(Tenant))).scalars().all():
            colleges = await store.get_collection(tenant.id, "colleges", None)
            college_list = colleges if isinstance(colleges, list) else []
            college_campus = {
                c["id"]: c.get("campusId")
                for c in college_list
                if isinstance(c, dict) and c.get("id") and c.get("campusId")
            }
            departments, dep_changed = _unlink(await store.get_collection(tenant.id, "departments"), college_campus)
            programs, prog_changed = _unlink(await store.get_collection(tenant.id, "programs"), college_campus)
            row = await store.repo.get(tenant.id, "colleges")
            if not (row or dep_changed or prog_changed):
                continue
            print(
                f"{tenant.code}: delete {len(college_list)} college(s); "
                f"unlink {dep_changed} department(s), {prog_changed} program(s)"
            )
            if apply:
                if dep_changed:
                    await store.repo.upsert(tenant.id, "departments", departments)
                if prog_changed:
                    await store.repo.upsert(tenant.id, "programs", programs)
                if row is not None:
                    await db.delete(row)
                await db.commit()
        if not apply:
            print("\nDry run only. Re-run with --apply to save these changes.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="save the changes (default: dry run)")
    asyncio.run(run(parser.parse_args().apply))


if __name__ == "__main__":
    main()
