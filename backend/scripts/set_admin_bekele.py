"""
Set Martha Bekele (m.bekele@berana.edu) as Institution Admin in SQLite.

Run on the VPS inside Docker:
  docker compose exec api python scripts/set_admin_bekele.py

Or locally from backend/:
  python scripts/set_admin_bekele.py
"""
import asyncio
import sys
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.identity.models import User, UserRoleAssignment
from app.modules.lms_store.models import LmsCollection
from app.modules.tenants.models import Tenant
from app.core.demo_auth import map_frontend_role

TENANT_CODE = "berana"
ADMIN_ID = "u3"
ADMIN_EMAIL = "m.bekele@berana.edu"
ADMIN_NAME = "Martha Bekele"


async def main() -> None:
    async with AsyncSessionLocal() as db:
        tenant = (
            await db.execute(select(Tenant).where(Tenant.code == TENANT_CODE))
        ).scalar_one_or_none()
        if not tenant:
            print(f"Tenant '{TENANT_CODE}' not found. Run seed first.")
            sys.exit(1)

        row = (
            await db.execute(
                select(LmsCollection).where(
                    LmsCollection.tenant_id == tenant.id,
                    LmsCollection.collection_key == "people",
                )
            )
        ).scalar_one_or_none()
        if not row or not isinstance(row.data, list):
            print("People collection not found.")
            sys.exit(1)

        people = list(row.data)
        updated = False
        for person in people:
            if not isinstance(person, dict):
                continue
            if person.get("id") == ADMIN_ID:
                person["role"] = "Admin"
                person["email"] = ADMIN_EMAIL
                person["name"] = ADMIN_NAME
                person["department"] = "Institution Administration"
                updated = True
                print(f"Updated people record: {ADMIN_ID} -> Admin / {ADMIN_EMAIL}")

        if not updated:
            print(f"Person id '{ADMIN_ID}' not found in people collection.")
            sys.exit(1)

        row.data = people

        user = (
            await db.execute(
                select(User).where(
                    User.tenant_id == tenant.id,
                    User.email == ADMIN_EMAIL.lower(),
                )
            )
        ).scalar_one_or_none()
        if user:
            user.display_name = ADMIN_NAME
            role_row = (
                await db.execute(
                    select(UserRoleAssignment).where(
                        UserRoleAssignment.tenant_id == tenant.id,
                        UserRoleAssignment.user_id == user.id,
                    )
                )
            ).scalar_one_or_none()
            if role_row:
                role_row.role = map_frontend_role("Admin")
            print(f"Updated identity user: {ADMIN_EMAIL}")

        await db.commit()
        print("Done. Login at /login?role=Admin with:")
        print(f"  Email: {ADMIN_EMAIL}")
        print("  Code:  000000")


if __name__ == "__main__":
    asyncio.run(main())
