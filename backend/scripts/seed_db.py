"""
Seed the demo tenants, their LMS collections and identity users from
backend/seed_data/*.json.

One demo tenant per edition, so each can be signed into and shown:
  berana  — Berana University (college_university)
  horizon — Horizon Bank      (corporate)

Usage (from backend/):
    python scripts/seed_db.py             # every edition
    python scripts/seed_db.py corporate   # just one
"""
import asyncio
import json
import sys
from collections import Counter
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, select
import bcrypt

from app.core.database import AsyncSessionLocal, init_db
from app.core.demo_auth import map_frontend_role
from app.modules.identity.models import GuardianLink, GuardianRelationship, User, UserRoleAssignment, UserStatus
from app.modules.lms_store.service import LmsStoreService
from app.modules.onboarding.constants import ModuleKey
from app.modules.tenants.models import Tenant, TenantStatus, TenantType


SEED_DIR = Path(__file__).resolve().parents[1] / "seed_data"
DEMO_PASSWORD = "Demo123!"


class DemoTenant:
    """One seedable demo tenant: which file, which code, which edition."""

    def __init__(self, key: str, code: str, name: str, seed_file: str, tenant_type: TenantType):
        self.key = key
        self.code = code
        self.name = name
        self.seed_file = SEED_DIR / seed_file
        self.tenant_type = tenant_type


DEMO_TENANTS = [
    DemoTenant("university", "berana", "Berana University", "demo.json", TenantType.COLLEGE_UNIVERSITY),
    DemoTenant("corporate", "horizon", "Horizon Bank", "corporate.json", TenantType.CORPORATE),
]

# Kept for callers that still import these.
SEED_FILE = DEMO_TENANTS[0].seed_file
TENANT_CODE = DEMO_TENANTS[0].code
TENANT_NAME = DEMO_TENANTS[0].name

STATUS_MAP = {
    "active": UserStatus.ACTIVE,
    "invited": UserStatus.INVITED,
    "suspended": UserStatus.SUSPENDED,
}


async def ensure_tenant(db, demo: DemoTenant) -> Tenant:
    result = await db.execute(select(Tenant).where(Tenant.code == demo.code))
    tenant = result.scalar_one_or_none()
    if tenant:
        return tenant

    tenant = Tenant(
        code=demo.code,
        name=demo.name,
        tenant_type=demo.tenant_type,
        institution_type=demo.tenant_type,
        status=TenantStatus.ACTIVE,
        timezone="Africa/Addis_Ababa",
        locale="en",
        currency="ETB",
        settings={"demo": True},
        # Demo tenants get the whole catalog so every page can be shown.
        enabled_modules=[m.value for m in ModuleKey],
    )
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    await db.commit()
    print(f"Created tenant: {tenant.code} ({tenant.id})")
    return tenant


def _person_status(person: dict) -> UserStatus:
    return STATUS_MAP.get(str(person.get("status", "active")).lower(), UserStatus.ACTIVE)


async def seed_identity_users(db, tenant: Tenant, people: list) -> None:
    await db.execute(delete(GuardianLink).where(GuardianLink.tenant_id == tenant.id))
    await db.execute(delete(UserRoleAssignment).where(UserRoleAssignment.tenant_id == tenant.id))
    await db.execute(delete(User).where(User.tenant_id == tenant.id))
    await db.flush()

    password_hash = bcrypt.hashpw(DEMO_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    users_by_person_id: dict[str, User] = {}
    users_by_name: dict[str, User] = {}
    role_counts: Counter[str] = Counter()
    seen_emails: set[str] = set()

    for person in people:
        if not isinstance(person, dict):
            continue
        email = str(person.get("email", "")).strip().lower()
        if not email or email in seen_emails:
            continue
        seen_emails.add(email)

        frontend_role = str(person.get("role", "Student"))
        user = User(
            tenant_id=tenant.id,
            email=email,
            display_name=str(person.get("name", email)),
            hashed_password=password_hash,
            status=_person_status(person),
        )
        db.add(user)
        await db.flush()
        db.add(
            UserRoleAssignment(
                tenant_id=tenant.id,
                user_id=user.id,
                role=map_frontend_role(frontend_role),
            )
        )
        users_by_person_id[str(person.get("id", ""))] = user
        users_by_name[str(person.get("name", "")).strip().lower()] = user
        role_counts[frontend_role] += 1

    for person in people:
        if not isinstance(person, dict) or str(person.get("role")) != "Guardian":
            continue
        guardian = users_by_person_id.get(str(person.get("id", "")))
        child_name = str(person.get("department", "")).strip().lower()
        student = users_by_name.get(child_name)
        if not guardian or not student or guardian.id == student.id:
            continue
        db.add(
            GuardianLink(
                tenant_id=tenant.id,
                guardian_user_id=guardian.id,
                student_user_id=student.id,
                relationship_type=GuardianRelationship.PARENT,
                is_active=str(person.get("status")) == "active",
            )
        )

    await db.commit()

    print(f"Seeded {sum(role_counts.values())} identity users (password: {DEMO_PASSWORD})")
    for role, count in sorted(role_counts.items()):
        print(f"  {role}: {count}")


async def seed_demo_tenant(demo: DemoTenant) -> bool:
    if not demo.seed_file.exists():
        print(f"Seed file not found: {demo.seed_file}")
        print("Run from repo root: npm run export-seed")
        return False

    with demo.seed_file.open(encoding="utf-8") as f:
        payload = json.load(f)

    collections = payload.get("collections", payload)
    if not isinstance(collections, dict):
        print(f"Invalid seed file {demo.seed_file.name}: expected a 'collections' object")
        return False

    async with AsyncSessionLocal() as db:
        tenant = await ensure_tenant(db, demo)
        service = LmsStoreService(db)
        count = await service.seed_collections(tenant.id, collections)
        print(f"Seeded {count} collections for tenant '{demo.code}'")

        people = collections.get("people", [])
        if isinstance(people, list):
            await seed_identity_users(db, tenant, people)
        else:
            print("Skipped identity users: people collection is not a list")
    return True


async def main(keys: list[str] | None = None) -> None:
    await init_db()
    wanted = keys or [demo.key for demo in DEMO_TENANTS]
    unknown = [key for key in wanted if key not in {d.key for d in DEMO_TENANTS}]
    if unknown:
        print(f"Unknown edition(s): {', '.join(unknown)}")
        print(f"Available: {', '.join(d.key for d in DEMO_TENANTS)}")
        sys.exit(1)

    ok = True
    for demo in DEMO_TENANTS:
        if demo.key in wanted:
            print(f"\n— {demo.name} ({demo.code}) —")
            ok = await seed_demo_tenant(demo) and ok
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:] or None))
