"""
Bootstrap schema + seed the platform Super Admin.

Usage (from backend/):
  .venv/bin/python -m scripts.bootstrap_onboarding
  RESET_SCHEMA=1 .venv/bin/python -m scripts.bootstrap_onboarding
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# Allow `python -m scripts.bootstrap_onboarding` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import Base, AsyncSessionLocal, engine
from app.core.security import hash_password
from app.modules.onboarding.models import PlatformAdminRole, PlatformAdminUser

# Import models so metadata is complete
import app.modules.tenants.models  # noqa: F401
import app.modules.identity.models  # noqa: F401
import app.modules.onboarding.models  # noqa: F401
import app.common.audit  # noqa: F401


async def create_schema(*, reset: bool) -> None:
    async with engine.begin() as conn:
        if reset:
            print("RESET_SCHEMA=1 — dropping all tables and enum types…")
            await conn.run_sync(Base.metadata.drop_all)
            # Drop leftover enum types that may block recreate with new values
            for typ in (
                "platform_admin_role",
                "institution_type",
                "service_request_status",
                "platform_actor_type",
                "email_type",
                "email_status",
                "tenanttype",
                "tenantstatus",
                "userstatus",
                "role",
                "guardianrelationship",
            ):
                await conn.execute(text(f'DROP TYPE IF EXISTS "{typ}" CASCADE'))
                await conn.execute(text(f"DROP TYPE IF EXISTS {typ} CASCADE"))

        await conn.run_sync(Base.metadata.create_all)
        # Ensure onboarding columns exist on tenants if table predated this module
        await conn.execute(
            text(
                """
                ALTER TABLE tenants
                  ADD COLUMN IF NOT EXISTS slug VARCHAR(80),
                  ADD COLUMN IF NOT EXISTS service_request_id UUID,
                  ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '[]'::jsonb
                """
            )
        )
        await conn.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS ix_tenants_slug
                ON tenants (slug)
                WHERE slug IS NOT NULL
                """
            )
        )
        await conn.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS ix_tenants_service_request_id
                ON tenants (service_request_id)
                WHERE service_request_id IS NOT NULL
                """
            )
        )


async def seed_super_admin() -> None:
    email = (settings.PLATFORM_SUPER_ADMIN_EMAIL or "mekashabetel@gmail.com").lower()
    password = settings.PLATFORM_SUPER_ADMIN_PASSWORD
    if not password:
        raise SystemExit(
            "Set PLATFORM_SUPER_ADMIN_PASSWORD in backend/.env before seeding."
        )

    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(
                select(PlatformAdminUser).where(PlatformAdminUser.email == email)
            )
        ).scalar_one_or_none()
        if existing:
            print(f"Super admin already exists: {email}")
            return

        admin = PlatformAdminUser(
            email=email,
            password_hash=hash_password(password),
            role=PlatformAdminRole.SUPER_ADMIN,
        )
        session.add(admin)
        await session.commit()
        print(f"Seeded platform super admin: {email}")


async def main() -> None:
    reset = os.environ.get("RESET_SCHEMA", "").strip() in ("1", "true", "yes")
    print(f"Connecting to DB (APP_ENV={settings.APP_ENV})…")
    await create_schema(reset=reset)
    print("Schema ensured.")
    await seed_super_admin()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
