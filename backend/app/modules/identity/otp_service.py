"""
Email OTP login for portal access.

Codes are random 6-digit values delivered by email, stored only as hashes, and
limited by expiry, attempt count and a resend cooldown. With DEMO_LOGIN_ENABLED
the code is always 000000 and is echoed back so demos work without email.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from starlette.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.demo_auth import map_frontend_role
from app.core.exceptions import NotFoundError, ValidationAppError
from app.core.security import create_access_token, create_refresh_token
from app.modules.lms_store.service import LmsStoreService

logger = logging.getLogger(__name__)

DEMO_OTP_CODE = "000000"
ADMIN_LOCKOUT_MINUTES = 15

# In-memory challenge store (single process). Replace with Redis when the API scales out.
_challenges: dict[str, dict] = {}
# Failed access-code attempts for provisioned institution admins: email -> (count, locked_until)
_admin_failures: dict[str, tuple[int, datetime | None]] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _new_code() -> str:
    if settings.DEMO_LOGIN_ENABLED:
        return DEMO_OTP_CODE
    return f"{secrets.randbelow(1_000_000):06d}"


def _start_challenge(key: str, extra: dict) -> str:
    """Create (or refresh) a challenge and return the plain code to deliver."""
    existing = _challenges.get(key)
    if existing:
        elapsed = (_now() - existing["sent_at"]).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed) + 1
            raise ValidationAppError(f"Please wait {wait} seconds before requesting a new code.")
    code = _new_code()
    _challenges[key] = {
        **extra,
        "code_hash": _hash_code(code),
        "attempts": 0,
        "sent_at": _now(),
        "expires": _now() + timedelta(minutes=settings.OTP_TTL_MINUTES),
    }
    return code


def _consume_challenge(key: str, code: str) -> dict:
    """Validate a submitted code; returns the challenge data on success."""
    challenge = _challenges.get(key)
    if not challenge:
        raise ValidationAppError("No verification request found. Request a new code.")
    if _now() > challenge["expires"]:
        _challenges.pop(key, None)
        raise ValidationAppError("Code expired. Request a new one.")
    if not hmac.compare_digest(_hash_code(code.strip()), challenge["code_hash"]):
        challenge["attempts"] += 1
        if challenge["attempts"] >= settings.OTP_MAX_ATTEMPTS:
            _challenges.pop(key, None)
            raise ValidationAppError("Too many incorrect attempts. Request a new code.")
        raise ValidationAppError("Invalid verification code")
    _challenges.pop(key, None)
    return challenge


async def _deliver_code(email: str, code: str, audience: str) -> None:
    if settings.DEMO_LOGIN_ENABLED:
        logger.info("Demo login code issued for %s (%s)", email, audience)
        return
    from app.modules.onboarding.email_service import send_email_sync

    body = (
        f"Your Berana LMS sign-in code is: {code}\n\n"
        f"It expires in {settings.OTP_TTL_MINUTES} minutes. "
        "If you did not try to sign in, you can ignore this email."
    )
    result = await run_in_threadpool(
        send_email_sync, to_email=email, subject="Your Berana LMS sign-in code", body=body
    )
    if not result.ok:
        raise ValidationAppError(
            "We could not send the sign-in code by email. Please contact your administrator."
        )


def _code_response(message_email: str, role: str) -> dict:
    result: dict = {
        "message": "Verification code sent to your email",
        "email": message_email,
        "role": role,
        "expires_in_seconds": settings.OTP_TTL_MINUTES * 60,
    }
    if settings.DEMO_LOGIN_ENABLED:
        result["demo_code"] = DEMO_OTP_CODE
    return result


async def _ensure_tenant_can_sign_in(db: AsyncSession, tenant_id) -> None:
    from sqlalchemy import select

    from app.modules.tenants.models import Tenant, TenantStatus

    tenant_status = (
        await db.execute(select(Tenant.status).where(Tenant.id == tenant_id))
    ).scalar_one_or_none()
    if tenant_status == TenantStatus.EXPIRED:
        raise ValidationAppError("Your institution's subscription has expired. Contact Cyber-Zeb Consulting.")
    if tenant_status in (TenantStatus.SUSPENDED, TenantStatus.ARCHIVED):
        raise ValidationAppError("Your institution's access is suspended. Contact Cyber-Zeb Consulting.")


def issue_portal_tokens(person_id: str, tenant_id: str, frontend_role: str) -> tuple[str, str]:
    """Access + refresh token for a tenant portal user. Both carry tenant and role."""
    claims = {
        "tenant_id": str(tenant_id),
        "role": map_frontend_role(frontend_role).value,
        "frontend_role": frontend_role,
    }
    access = create_access_token(subject=person_id, extra_claims=claims)
    refresh = create_refresh_token(subject=person_id, extra_claims={**claims, "portal": True})
    return access, refresh


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
            "expires_in_seconds": settings.OTP_TTL_MINUTES * 60,
        }

    async def _verify_institution_admin_code(self, admin, tenant, code: str) -> dict:
        from app.core.security import verify_password

        await _ensure_tenant_can_sign_in(self.db, tenant.id)

        key = admin.email.strip().lower()
        failures, locked_until = _admin_failures.get(key, (0, None))
        if locked_until and _now() < locked_until:
            raise ValidationAppError("Too many incorrect attempts. Try again in a few minutes.")
        if not verify_password(code.strip(), admin.temporary_password_hash):
            failures += 1
            if failures >= settings.OTP_MAX_ATTEMPTS:
                _admin_failures[key] = (0, _now() + timedelta(minutes=ADMIN_LOCKOUT_MINUTES))
            else:
                _admin_failures[key] = (failures, None)
            raise ValidationAppError("Invalid access code")
        _admin_failures.pop(key, None)

        access, refresh = issue_portal_tokens(str(admin.id), str(tenant.id), "Admin")

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
        await _ensure_tenant_can_sign_in(self.db, tenant_id)
        people = await self.store.get_collection(tenant_id, "people", [])
        if not isinstance(people, list):
            raise ValidationAppError("People collection is invalid")

        person = _find_person_by_email_role(people, email, role)
        if not person:
            raise NotFoundError("No active account found for this email and role")

        key = _challenge_key(tenant_code, email, role)
        code = _start_challenge(
            key,
            {
                "person_id": str(person["id"]),
                "display_name": str(person.get("name", "")),
                "role": role,
                "tenant_id": str(tenant_id),
            },
        )
        await _deliver_code(email.strip().lower(), code, role)
        return _code_response(email.strip().lower(), role)

    # ── Platform Super Admin OTP (uses PlatformAdminUser, not tenant people) ──
    async def send_super_admin_code(self, email: str) -> dict:
        from app.modules.onboarding.models import PlatformAdminRole
        from app.modules.onboarding.repository import OnboardingRepository

        repo = OnboardingRepository(self.db)
        admin = await repo.get_platform_admin_by_email(email.strip().lower())
        if not admin or admin.role != PlatformAdminRole.SUPER_ADMIN or admin.is_suspended:
            raise NotFoundError("No active super admin account found for this email")

        key = _challenge_key("__superadmin__", email, "SuperAdmin")
        code = _start_challenge(
            key,
            {"admin_id": str(admin.id), "email": admin.email, "display_name": admin.email},
        )
        await _deliver_code(admin.email, code, "SuperAdmin")
        return _code_response(admin.email, "SuperAdmin")

    async def verify_super_admin_code(self, email: str, code: str) -> dict:
        from app.modules.onboarding.models import PlatformAdminRole

        key = _challenge_key("__superadmin__", email, "SuperAdmin")
        challenge = _consume_challenge(key, code)
        admin_id = challenge["admin_id"]
        admin_email = challenge["email"]
        display_name = challenge["display_name"]

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
        challenge = _consume_challenge(key, code)
        person_id = challenge["person_id"]
        frontend_role = challenge["role"]
        display_name = challenge["display_name"]
        tenant_id = challenge["tenant_id"]

        access, refresh = issue_portal_tokens(person_id, tenant_id, frontend_role)

        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "person_id": person_id,
            "frontend_role": frontend_role,
            "display_name": display_name,
        }

    # ── Portal session refresh ─────────────────────────────────────────────
    async def refresh_portal(self, refresh_token: str) -> dict:
        """Exchange a portal refresh token for a new pair, re-checking the account."""
        import uuid

        from jose import JWTError
        from sqlalchemy import select

        from app.core.security import decode_token
        from app.modules.onboarding.models import InstitutionAdminAccount
        from app.modules.tenants.models import Tenant, TenantStatus

        invalid = ValidationAppError("Your session has ended. Please sign in again.")
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise invalid
        if payload.get("type") != "refresh" or not payload.get("portal"):
            raise invalid

        person_id = str(payload.get("sub", ""))
        frontend_role = str(payload.get("frontend_role", ""))
        try:
            tenant_id = uuid.UUID(str(payload.get("tenant_id")))
        except ValueError:
            raise invalid

        tenant = (await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
        if not tenant or tenant.status != TenantStatus.ACTIVE:
            raise invalid

        people = await self.store.get_collection(tenant_id, "people", [])
        person = next(
            (p for p in people if isinstance(p, dict) and str(p.get("id")) == person_id),
            None,
        ) if isinstance(people, list) else None
        if person is not None:
            if str(person.get("status", "active")) == "suspended" or str(person.get("role")) != frontend_role:
                raise invalid
        else:
            # Provisioned institution admins live outside the people collection.
            try:
                admin_uuid = uuid.UUID(person_id)
            except ValueError:
                raise invalid
            admin = (
                await self.db.execute(
                    select(InstitutionAdminAccount).where(
                        InstitutionAdminAccount.id == admin_uuid,
                        InstitutionAdminAccount.tenant_id == tenant_id,
                    )
                )
            ).scalar_one_or_none()
            if not admin or frontend_role != "Admin":
                raise invalid

        access, refresh = issue_portal_tokens(person_id, str(tenant_id), frontend_role)
        return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
