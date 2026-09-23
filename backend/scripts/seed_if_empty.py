"""
Seed the demo tenants only where they do not exist yet.

One per edition (berana = university, horizon = corporate), so a fresh
deployment can be signed into and shown for either. Safe to run on every
container start: each tenant is checked separately, so adding a new edition
seeds only that one and leaves existing data untouched.
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

async def tenant_exists(code: str) -> bool:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Tenant.id).where(Tenant.code == code).limit(1))
        return result.scalar_one_or_none() is not None


async def main() -> None:
    from scripts.bootstrap_onboarding import seed_super_admin
    from scripts.seed_db import DEMO_TENANTS, main as seed_main

    await seed_super_admin()

    missing = [demo.key for demo in DEMO_TENANTS if not await tenant_exists(demo.code)]
    if not missing:
        print("Demo tenants already exist — skipping demo seed.")
        return

    print(f"Seeding missing demo tenant(s): {', '.join(missing)}")
    await seed_main(missing)


if __name__ == "__main__":
    asyncio.run(main())
