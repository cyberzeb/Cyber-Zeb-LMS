"""
Delete all demo tenants, service requests, and related onboarding data.

Usage (from backend/):
  .venv/bin/python -m scripts.wipe_demo_tenants
  .venv/bin/python -m scripts.wipe_demo_tenants --yes
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.core.database import AsyncSessionLocal, engine

# Keep in sync with alembic/versions/20260902_institution_types_three_categories.py
WIPE_STATEMENTS = [
    "DELETE FROM email_logs",
    "DELETE FROM addon_module_requests",
    "DELETE FROM institution_admin_accounts",
    "DELETE FROM user_bans",
    "DELETE FROM user_reports",
    "DELETE FROM guardian_links",
    "DELETE FROM user_role_assignments",
    "DELETE FROM departments",
    "DELETE FROM campuses",
    "DELETE FROM users",
    "DELETE FROM tenants",
    "DELETE FROM service_requests",
]


async def wipe(*, confirmed: bool) -> None:
    if not confirmed:
        print(
            "This will permanently delete ALL tenants, service requests, and related demo data.\n"
            "Re-run with --yes to confirm."
        )
        return

    async with AsyncSessionLocal() as session:
        for stmt in WIPE_STATEMENTS:
            await session.execute(text(stmt))
        await session.commit()
    print("Demo tenant data wiped.")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Wipe demo tenants and service requests")
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirm destructive delete",
    )
    args = parser.parse_args()
    await wipe(confirmed=args.yes)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
