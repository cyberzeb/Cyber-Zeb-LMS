"""
Manage platform Super Admin accounts from the command line.

Super admins live in ``platform_admin_users`` and are deliberately separate from
every tenant's users. They sign in at /login with a one-time code emailed to
them; the password below is only the fallback for POST /auth/super-admin/login.

Usage (from backend/, with the venv python):
  python -m scripts.manage_super_admin list
  python -m scripts.manage_super_admin add admin@example.com
  python -m scripts.manage_super_admin add admin@example.com --password 'S3cret!'
  python -m scripts.manage_super_admin set-password admin@example.com
  python -m scripts.manage_super_admin suspend admin@example.com
  python -m scripts.manage_super_admin unsuspend admin@example.com
  python -m scripts.manage_super_admin remove admin@example.com
"""
from __future__ import annotations

import argparse
import asyncio
import secrets
import string
import sys
from pathlib import Path

# Allow `python -m scripts.manage_super_admin` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.modules.onboarding.models import PlatformAdminRole, PlatformAdminUser

_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*"


def _generate_password(length: int = 16) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


async def _get(session, email: str) -> PlatformAdminUser | None:
    return (
        await session.execute(
            select(PlatformAdminUser).where(
                func.lower(PlatformAdminUser.email) == email.strip().lower()
            )
        )
    ).scalar_one_or_none()


async def cmd_list() -> int:
    async with AsyncSessionLocal() as session:
        rows = (
            await session.execute(
                select(PlatformAdminUser).order_by(PlatformAdminUser.created_at)
            )
        ).scalars().all()
    if not rows:
        print("No platform super admins exist yet. Add one with:")
        print("  python -m scripts.manage_super_admin add you@example.com")
        return 1
    print(f"{'EMAIL':<40} {'ROLE':<14} STATUS")
    for row in rows:
        status = "suspended" if row.is_suspended else "active"
        role = row.role.value if hasattr(row.role, "value") else str(row.role)
        print(f"{row.email:<40} {role:<14} {status}")
    return 0


async def cmd_add(email: str, password: str | None) -> int:
    email = email.strip().lower()
    generated = password is None
    password = password or _generate_password()
    async with AsyncSessionLocal() as session:
        if await _get(session, email):
            print(f"A platform admin already exists for {email}.")
            print("Use `set-password` to reset its fallback password.")
            return 1
        session.add(
            PlatformAdminUser(
                email=email,
                password_hash=hash_password(password),
                role=PlatformAdminRole.SUPER_ADMIN,
            )
        )
        await session.commit()
    print(f"Created super admin: {email}")
    if generated:
        print(f"Fallback password (shown once): {password}")
    print("Sign in at /login with this email — a one-time code is emailed.")
    return 0


async def cmd_set_password(email: str, password: str | None) -> int:
    generated = password is None
    password = password or _generate_password()
    async with AsyncSessionLocal() as session:
        admin = await _get(session, email)
        if not admin:
            print(f"No platform admin found for {email}.")
            return 1
        admin.password_hash = hash_password(password)
        await session.commit()
    print(f"Password updated for {email}.")
    if generated:
        print(f"New password (shown once): {password}")
    return 0


async def cmd_set_suspended(email: str, suspended: bool) -> int:
    async with AsyncSessionLocal() as session:
        admin = await _get(session, email)
        if not admin:
            print(f"No platform admin found for {email}.")
            return 1
        if suspended:
            # Refuse to lock everyone out of the console.
            remaining = (
                await session.execute(
                    select(func.count())
                    .select_from(PlatformAdminUser)
                    .where(
                        PlatformAdminUser.is_suspended.is_(False),
                        PlatformAdminUser.id != admin.id,
                    )
                )
            ).scalar_one()
            if remaining == 0:
                print("Refusing to suspend the last active super admin.")
                return 1
        admin.is_suspended = suspended
        await session.commit()
    print(f"{email} is now {'suspended' if suspended else 'active'}.")
    return 0


async def cmd_remove(email: str) -> int:
    async with AsyncSessionLocal() as session:
        admin = await _get(session, email)
        if not admin:
            print(f"No platform admin found for {email}.")
            return 1
        remaining = (
            await session.execute(
                select(func.count())
                .select_from(PlatformAdminUser)
                .where(PlatformAdminUser.id != admin.id)
            )
        ).scalar_one()
        if remaining == 0:
            print("Refusing to delete the last super admin.")
            return 1
        await session.delete(admin)
        await session.commit()
    print(f"Deleted super admin: {email}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="show every platform super admin")

    add = sub.add_parser("add", help="create a super admin")
    add.add_argument("email")
    add.add_argument("--password", help="fallback password (generated if omitted)")

    reset = sub.add_parser("set-password", help="reset the fallback password")
    reset.add_argument("email")
    reset.add_argument("--password", help="new password (generated if omitted)")

    suspend = sub.add_parser("suspend", help="block sign-in for this super admin")
    suspend.add_argument("email")

    unsuspend = sub.add_parser("unsuspend", help="restore access")
    unsuspend.add_argument("email")

    remove = sub.add_parser("remove", help="delete a super admin")
    remove.add_argument("email")
    return parser


async def main() -> int:
    args = build_parser().parse_args()
    try:
        if args.command == "list":
            return await cmd_list()
        if args.command == "add":
            return await cmd_add(args.email, args.password)
        if args.command == "set-password":
            return await cmd_set_password(args.email, args.password)
        if args.command == "suspend":
            return await cmd_set_suspended(args.email, True)
        if args.command == "unsuspend":
            return await cmd_set_suspended(args.email, False)
        if args.command == "remove":
            return await cmd_remove(args.email)
    finally:
        await engine.dispose()
    return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
