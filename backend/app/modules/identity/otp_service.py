"""
Email OTP login for portal access (demo: fixed code 000000).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.demo_auth import map_frontend_role
from app.core.exceptions import NotFoundError, ValidationAppError
from app.core.security import create_access_token, create_refresh_token
from app.modules.lms_store.service import LmsStoreService

logger = logging.getLogger(__name__)

DEMO_OTP_CODE = "000000"
OTP_TTL_MINUTES = 10

# In-memory challenge store (demo / single-process). Replace with Redis in production.
_challenges: dict[str, dict] = {}


@dataclass(frozen=True)
class PersonMatch:
    person_id: str
    email: str
    role: str
    display_name: str


def _challenge_key(tenant_code: str, email: str, role: str) -> str:
    return f"{tenant_code}:{email.strip().lower()}:{role}"


def _find_person_by_email_role(people: list, email: str, role: str) -> dict | None:
    normalized = email.strip().lower()
    for person in people:
        if not isinstance(person, dict):
            continue
        person_email = str(person.get("email", "")).strip().lower()
        person_role = str(person.get("role", ""))
        status = str(person.get("status", "active"))
        if person_email == normalized and person_role == role and status != "suspended":
            return person
    return None


class OtpAuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.store = LmsStoreService(db)

    # ── Institution Admin (real tenants created via onboarding activation) ──
    async def _find_institution_admin(self, email: str):
        """Return (admin_account, tenant) for a provisioned institution admin, or None."""
        from sqlalchemy import func, select

        from app.modules.onboarding.models import InstitutionAdminAccount
        from app.modules.tenants.models import Tenant

        normalized = email.strip().lower()
        result = await self.db.execute(
            select(InstitutionAdminAccount)
            .where(func.lower(InstitutionAdminAccount.email) == normalized)
            .order_by(InstitutionAdminAccount.created_at.desc())
            .limit(1)
        )
        admin = result.scalar_one_or_none()
        if not admin:
            return None
        tenant = (
            await self.db.execute(select(Tenant).where(Tenant.id == admin.tenant_id))
        ).scalar_one_or_none()
        if not tenant:
            return None
        return admin, tenant

    async def _send_institution_admin_code(self, email: str, tenant) -> dict:
        # The 6-digit access code was issued at activation and stored hashed; we
        # never resend it here, just acknowledge so the UI can prompt for it.
        logger.info("Institution admin login requested for %s (tenant %s)", email, tenant.code)
        return {
            "message": "Enter the 6-digit access code from your activation email",
            "email": email.strip().lower(),
            "role": "Admin",
            "expires_in_seconds": OTP_TTL_MINUTES * 60,
        }

    async def _verify_institution_admin_code(self, admin, tenant, code: str) -> dict:
        from app.core.security import verify_password

        if not verify_password(code.strip(), admin.temporary_password_hash):
            raise ValidationAppError("Invalid access code")

        backend_role = map_frontend_role("Admin")
        claims = {
            "tenant_id": str(tenant.id),
            "role": backend_role.value,
            "frontend_role": "Admin",
        }
        access = create_access_token(subject=str(admin.id), extra_claims=claims)
        refresh = create_refresh_token(subject=str(admin.id))

        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "person_id": str(admin.id),
            "frontend_role": "Admin",
            "display_name": tenant.name,
            "tenant_code": tenant.code,
            "tenant_name": tenant.name,
            "institution_type": tenant.institution_type.value,
        }

    async def send_code(self, tenant_code: str, email: str, role: str) -> dict:
        # Provisioned institution admins authenticate against their own tenant
        # with the 6-digit access code, not the shared demo people collection.
        if role == "Admin":
            match = await self._find_institution_admin(email)
            if match:
                _admin, tenant = match
                return await self._send_institution_admin_code(email, tenant)

        tenant_id = await self.store.resolve_tenant_id(tenant_code)
        people = await self.store.get_collection(tenant_id, "people", [])
        if not isinstance(people, list):
            raise ValidationAppError("People collection is invalid")

        person = _find_person_by_email_role(people, email, role)
        if not person:
            raise NotFoundError("No active account found for this email and role")

        code = DEMO_OTP_CODE
        key = _challenge_key(tenant_code, email, role)
        expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
        _challenges[key] = {
            "code": code,
            "person_id": str(person["id"]),
            "display_name": str(person.get("name", "")),
            "role": role,
            "tenant_id": str(tenant_id),
            "expires": expires,
        }

        # Demo: log instead of sending real email
        logger.info(
            "OTP for %s (%s): %s — expires %s",
            email,
            role,
            code,
            expires.isoformat(),
        )
        if settings.DEBUG:
            print(f"[Brana LMS] Login code for {email} ({role}): {code}")

        result: dict = {
            "message": "Verification code sent to your email",
            "email": email.strip().lower(),
            "role": role,
            "expires_in_seconds": OTP_TTL_MINUTES * 60,
        }
        if settings.DEBUG:
            result["demo_code"] = DEMO_OTP_CODE
        return result

    # ── Platform Super Admin OTP (uses PlatformAdminUser, not tenant people) ──
    async def send_super_admin_code(self, email: str) -> dict:
        from app.modules.onboarding.models import PlatformAdminRole
        from app.modules.onboarding.repository import OnboardingRepository

        repo = OnboardingRepository(self.db)
        admin = await repo.get_platform_admin_by_email(email.strip().lower())
        if not admin or admin.role != PlatformAdminRole.SUPER_ADMIN:
            raise NotFoundError("No active super admin account found for this email")

        code = DEMO_OTP_CODE
        key = _challenge_key("__superadmin__", email, "SuperAdmin")
        expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
        _challenges[key] = {
            "code": code,
            "admin_id": str(admin.id),
            "email": admin.email,
            "display_name": admin.email,
            "expires": expires,
            "super_admin": True,
        }

        logger.info("Super admin OTP for %s: %s — expires %s", email, code, expires.isoformat())
        if settings.DEBUG:
            print(f"[Brana LMS] Super admin login code for {email}: {code}")

        result: dict = {
            "message": "Verification code sent to your email",
            "email": admin.email,
            "role": "SuperAdmin",
            "expires_in_seconds": OTP_TTL_MINUTES * 60,
        }
        if settings.DEBUG:
            result["demo_code"] = DEMO_OTP_CODE
        return result

    async def verify_super_admin_code(self, email: str, code: str) -> dict:
        from app.modules.onboarding.models import PlatformAdminRole

        key = _challenge_key("__superadmin__", email, "SuperAdmin")
        challenge = _challenges.get(key)
        if not challenge:
            raise ValidationAppError("No verification request found. Request a new code.")

        expires: datetime = challenge["expires"]
        if datetime.now(timezone.utc) > expires:
            _challenges.pop(key, None)
            raise ValidationAppError("Code expired. Request a new one.")

        if code.strip() != challenge["code"]:
            raise ValidationAppError("Invalid verification code")

        admin_id = challenge["admin_id"]
        admin_email = challenge["email"]
        display_name = challenge["display_name"]
        _challenges.pop(key, None)

        # Mirror the claims minted by the password login so the token works with
        # every platform super-admin endpoint.
        claims = {
            "principal_type": "platform_admin",
            "role": PlatformAdminRole.SUPER_ADMIN.value,
            "email": admin_email,
        }
        access = create_access_token(subject=admin_id, extra_claims=claims)
        refresh = create_refresh_token(subject=admin_id)

        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "person_id": admin_id,
            "frontend_role": "SuperAdmin",
            "display_name": display_name,
        }

    # ── Email Lookup (email-first login) ──────────────────────────────────
    async def lookup_email(self, email: str):
        """
        Given an email, return what kind of account it belongs to.
        Checks (in order):
          1. Platform super admin
          2. Provisioned institution admin (InstitutionAdminAccount)
          3. Demo/berana tenant people collection
        """
        from app.modules.identity.schemas import EmailLookupResponse
        from app.modules.onboarding.models import PlatformAdminRole
        from app.modules.onboarding.repository import OnboardingRepository

        normalized = email.strip().lower()

        # 1. Super admin?
        repo = OnboardingRepository(self.db)
        admin = await repo.get_platform_admin_by_email(normalized)
        if admin and admin.role == PlatformAdminRole.SUPER_ADMIN:
            return EmailLookupResponse(found=True, is_super_admin=True, role="SuperAdmin")

        # 2. Provisioned institution admin?
        match = await self._find_institution_admin(normalized)
        if match:
            _admin, tenant = match
            return EmailLookupResponse(
                found=True,
                role="Admin",
                tenant_code=tenant.code,
                tenant_name=tenant.name,
                institution_type=tenant.institution_type.value if hasattr(tenant.institution_type, 'value') else str(tenant.institution_type),
            )

        # 3. Demo tenant people (berana)?
        try:
            tenant_id = await self.store.resolve_tenant_id("berana")
            people = await self.store.get_collection(tenant_id, "people", [])
            if isinstance(people, list):
                for person in people:
                    if not isinstance(person, dict):
                        continue
                    person_email = str(person.get("email", "")).strip().lower()
                    if person_email == normalized:
                        frontend_role = str(person.get("role", "Student"))
                        return EmailLookupResponse(
                            found=True,
                            is_demo=True,
                            role=frontend_role,
                            tenant_code="berana",
                        )
        except Exception:
            pass

        return EmailLookupResponse(found=False)

    async def verify_code(self, tenant_code: str, email: str, role: str, code: str) -> dict:
        if role == "Admin":
            match = await self._find_institution_admin(email)
            if match:
                admin, tenant = match
                return await self._verify_institution_admin_code(admin, tenant, code)

        key = _challenge_key(tenant_code, email, role)
        challenge = _challenges.get(key)
        if not challenge:
            raise ValidationAppError("No verification request found. Request a new code.")

        expires: datetime = challenge["expires"]
        if datetime.now(timezone.utc) > expires:
            _challenges.pop(key, None)
            raise ValidationAppError("Code expired. Request a new one.")

        if code.strip() != challenge["code"]:
            raise ValidationAppError("Invalid verification code")

        person_id = challenge["person_id"]
        frontend_role = challenge["role"]
        display_name = challenge["display_name"]
        tenant_id = challenge["tenant_id"]

        _challenges.pop(key, None)

        backend_role = map_frontend_role(frontend_role)
        claims = {
            "tenant_id": tenant_id,
            "role": backend_role.value,
            "frontend_role": frontend_role,
        }
        access = create_access_token(subject=person_id, extra_claims=claims)
        refresh = create_refresh_token(subject=person_id)

        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "person_id": person_id,
            "frontend_role": frontend_role,
            "display_name": display_name,
        }
