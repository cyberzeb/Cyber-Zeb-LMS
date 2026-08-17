"""
Password hashing and JWT helpers.

Blueprint Section 16 requirements enforced here:
- Strong password hashing (bcrypt)
- Short-lived access tokens + longer-lived refresh tokens
- No secrets ever hardcoded (pulled from app.core.config.settings)
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(plain_password: str) -> str:
    # bcrypt has a 72-byte input limit
    raw = plain_password.encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    raw = plain_password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(raw, hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, extra_claims: Optional[dict[str, Any]] = None) -> str:
    """
    subject: usually the user id.
    extra_claims: MUST include tenant_id and role so authorization
    middleware/dependencies can enforce scope without extra DB hits.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Raises jose.JWTError on invalid/expired token. Callers must handle it."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise exc
