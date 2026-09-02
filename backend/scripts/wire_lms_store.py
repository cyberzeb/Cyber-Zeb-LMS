"""One-off dev helper: ensure the lms_collections table exists and that a
tenant with code 'berana' exists so the portal frontends (which send
X-Tenant-Code: berana) can read/write their data collections.

Safe to run multiple times.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.modules.lms_store.models import LmsCollection
from app.modules.tenants.models import Tenant


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL)

    # 1) Ensure the data-store table exists (no FKs, safe to create standalone).
    async with engine.begin() as conn:
        await conn.run_sync(LmsCollection.__table__.create, checkfirst=True)
    print("[ok] lms_collections table ensured")

    # 2) Ensure a tenant addressable by code 'berana'.
    async with AsyncSession(engine) as s:
        tenants = (await s.execute(select(Tenant))).scalars().all()
        print("Existing tenants:")
        for t in tenants:
            print(f"  - code={t.code!r} slug={t.slug!r} name={t.name!r}")

        berana = (await s.execute(select(Tenant).where(Tenant.code == "berana"))).scalar_one_or_none()
        if berana:
            print(f"[ok] tenant with code 'berana' already exists: {berana.name}")
        else:
            by_slug = (await s.execute(select(Tenant).where(Tenant.slug == "berana"))).scalar_one_or_none()
            if by_slug:
                by_slug.code = "berana"
                await s.commit()
                print(f"[ok] set code='berana' on tenant {by_slug.name!r}")
            else:
                print("[warn] no tenant with slug/code 'berana' found. Seed the University tenant first.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
