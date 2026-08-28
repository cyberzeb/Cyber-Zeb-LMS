"""
Seed demo tenant and data only when the database has no Berana tenant yet.

Safe to run on every container start — skips seeding when data already exists.
"""
import asyncio
import sys
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.tenants.models import Tenant

TENANT_CODE = "berana"


async def tenant_exists() -> bool:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Tenant.id).where(Tenant.code == TENANT_CODE).limit(1))
        return result.scalar_one_or_none() is not None


async def main() -> None:
    if await tenant_exists():
        print(f"Tenant '{TENANT_CODE}' already exists — skipping seed.")
        return

    print(f"No tenant '{TENANT_CODE}' found — running demo seed...")
    from scripts.seed_db import main as seed_main

    await seed_main()


if __name__ == "__main__":
    asyncio.run(main())
