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

    async def send_code(self, tenant_code: str, email: str, role: str) -> dict:
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

    async def verify_code(self, tenant_code: str, email: str, role: str, code: str) -> dict:
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
