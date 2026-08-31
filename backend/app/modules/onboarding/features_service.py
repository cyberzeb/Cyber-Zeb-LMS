"""
Super Admin features service — System Health, Integrations, Renewals Reminder,
Branding, Security Center, Analytics, Backup & Restore.

All audit calls follow the same _write_audit() pattern as OnboardingService._audit().
All email calls follow the send_email_sync → persist_email_log pattern.
"""
from __future__ import annotations

import base64
import logging
import os
import secrets
import subprocess
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlencode

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationAppError
from app.modules.identity.models import User, UserStatus
from app.modules.onboarding.email_service import persist_email_log, send_email_sync
from app.modules.onboarding.models import (
    AddOnModuleRequest,
    BackupRun,
    BackupStatus,
    EmailLog,
    EmailStatus,
    EmailType,
    InstitutionAdminAccount,
    PlatformActorType,
    PlatformAdminBan,
    PlatformAdminUser,
    PlatformAuditLog,
    PlatformBranding,
    PlatformIntegration,
    ServiceRequest,
    ServiceRequestStatus,
    UserBan,
    UserReport,
    UserReportStatus,
)
from app.modules.onboarding.schemas import (
    AdminBanIn,
    AdminBanOut,
    AdminUnbanIn,
    AnalyticsOut,
    BackupListOut,
    BackupRunOut,
    BrandingOut,
    BrandingPatch,
    IntegrationOAuthCallbackIn,
    IntegrationOAuthInitOut,
    IntegrationOut,
    ModuleDemandItem,
    RenewalReminderOut,
    RestoreIn,
    RevenueTrendItem,
    SuspendedAdminOut,
    SystemHealthOut,
    UserBanIn,
    UserBanOut,
    UserReportIn,
    UserReportOut,
    UserReportReviewIn,
    UserUnbanIn,
)
from app.modules.tenants.models import Tenant

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _human_size(n: int | None) -> str | None:
    if n is None:
        return None
    size = float(n)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} PB"


# ── Token encryption (Fernet; dev fallback = base64) ─────────────────────────

def _get_fernet():
    key = settings.TOKEN_ENCRYPTION_KEY
    if not key:
        return None
    try:
        from cryptography.fernet import Fernet
        return Fernet(key.encode())
    except Exception:
        logger.warning("TOKEN_ENCRYPTION_KEY invalid — tokens stored base64-only (dev mode)")
        return None


def _encrypt(value: str) -> str:
    f = _get_fernet()
    if f:
        return f.encrypt(value.encode()).decode()
    return base64.b64encode(value.encode()).decode()


def _decrypt(value: str) -> str | None:
    if not value:
        return None
    f = _get_fernet()
    try:
        if f:
            return f.decrypt(value.encode()).decode()
        return base64.b64decode(value.encode()).decode()
    except Exception:
        return None


# ── OAuth URL builders ────────────────────────────────────────────────────────

def _zoom_auth_url(state: str) -> str:
    return "https://zoom.us/oauth/authorize?" + urlencode({
        "response_type": "code",
        "client_id": settings.ZOOM_CLIENT_ID,
        "redirect_uri": settings.ZOOM_REDIRECT_URI,
        "state": state,
    })


def _teams_auth_url(state: str) -> str:
    return (
        f"https://login.microsoftonline.com/{settings.TEAMS_TENANT_ID}"
        "/oauth2/v2.0/authorize?" + urlencode({
            "client_id": settings.TEAMS_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": settings.TEAMS_REDIRECT_URI,
            "response_mode": "query",
            "scope": "OnlineMeetings.ReadWrite offline_access",
            "state": state,
        })
    )


def _google_auth_url(state: str) -> str:
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar openid email",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    })


def _webex_auth_url(state: str) -> str:
    return "https://webexapis.com/v1/authorize?" + urlencode({
        "client_id": settings.WEBEX_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.WEBEX_REDIRECT_URI,
        "scope": "spark:all meeting:schedules_write meeting:schedules_read",
        "state": state,
    })


_AUTH_URL_BUILDERS = {
    "zoom": _zoom_auth_url,
    "microsoft_teams": _teams_auth_url,
    "google_meet": _google_auth_url,
    "webex": _webex_auth_url,
}

_DISPLAY_NAMES = {
    "zoom": "Zoom",
    "microsoft_teams": "Microsoft Teams",
    "google_meet": "Google Meet",
    "webex": "Webex",
}


def _check_oauth_creds(platform: str) -> None:
    missing: list[str] = []
    if platform == "zoom":
        if not settings.ZOOM_CLIENT_ID: missing.append("ZOOM_CLIENT_ID")
        if not settings.ZOOM_CLIENT_SECRET: missing.append("ZOOM_CLIENT_SECRET")
    elif platform == "microsoft_teams":
        if not settings.TEAMS_CLIENT_ID: missing.append("TEAMS_CLIENT_ID")
        if not settings.TEAMS_CLIENT_SECRET: missing.append("TEAMS_CLIENT_SECRET")
    elif platform == "google_meet":
        if not settings.GOOGLE_CLIENT_ID: missing.append("GOOGLE_CLIENT_ID")
        if not settings.GOOGLE_CLIENT_SECRET: missing.append("GOOGLE_CLIENT_SECRET")
    elif platform == "webex":
        if not settings.WEBEX_CLIENT_ID: missing.append("WEBEX_CLIENT_ID")
        if not settings.WEBEX_CLIENT_SECRET: missing.append("WEBEX_CLIENT_SECRET")
    if missing:
        raise ValidationAppError(
            f"OAuth credentials not configured for {platform}. "
            f"Set: {', '.join(missing)}"
        )


def _token_status(row: PlatformIntegration) -> str:
    if not row.is_connected or not row.access_token_enc:
        return "missing"
    if row.token_expires_at and row.token_expires_at < _utcnow():
        return "expired"
    return "valid"


def _serialize_integration(row: PlatformIntegration) -> IntegrationOut:
    return IntegrationOut(
        id=row.id,
        platform=row.platform,
        display_name=row.display_name,
        is_connected=row.is_connected,
        connected_account=row.connected_account,
        token_expires_at=row.token_expires_at,
        last_health_check=row.last_health_check,
        last_health_ok=row.last_health_ok,
        token_status=_token_status(row),
        updated_at=row.updated_at,
    )


# ── Shared audit writer ───────────────────────────────────────────────────────

async def _audit(
    db: AsyncSession,
    *,
    actor_type: PlatformActorType,
    actor_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before: dict | None = None,
    after: dict | None = None,
    correlation_id: str | None = None,
) -> None:
    db.add(PlatformAuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after,
        correlation_id=correlation_id,
    ))
    await db.flush()


# ═══════════════════════════════════════════════════════════════════════════════
# 1. System Health
# ═══════════════════════════════════════════════════════════════════════════════

async def get_system_health(db: AsyncSession) -> SystemHealthOut:
    checked_at = _utcnow()

    # DB ping + latency
    db_ok = False
    db_latency_ms: float | None = None
    try:
        t0 = _utcnow()
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((_utcnow() - t0).total_seconds() * 1000, 2)
        db_ok = True
    except Exception:
        pass

    # Email health — last 24 h
    since_24h = checked_at - timedelta(hours=24)
    try:
        sent_count = (await db.execute(
            select(func.count()).select_from(EmailLog).where(
                EmailLog.sent_at >= since_24h,
                EmailLog.status == EmailStatus.SENT,
            )
        )).scalar_one()
        failed_count = (await db.execute(
            select(func.count()).select_from(EmailLog).where(
                EmailLog.sent_at >= since_24h,
                EmailLog.status == EmailStatus.FAILED,
            )
        )).scalar_one()
    except Exception:
        sent_count = failed_count = 0

    total_emails = sent_count + failed_count
    email_rate: float | None = (
        round(sent_count / total_emails * 100, 1) if total_emails > 0 else None
    )

    # DB size
    db_size_bytes: int | None = None
    try:
        db_size_bytes = (
            await db.execute(text("SELECT pg_database_size(current_database())"))
        ).scalar_one()
    except Exception:
        pass

    return SystemHealthOut(
        db_ok=db_ok,
        db_latency_ms=db_latency_ms,
        api_ok=True,
        email_sent_count_24h=sent_count,
        email_failed_count_24h=failed_count,
        email_success_rate_pct=email_rate,
        db_size_bytes=db_size_bytes,
        db_size_human=_human_size(db_size_bytes),
        checked_at=checked_at,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Integrations
# ═══════════════════════════════════════════════════════════════════════════════

async def _get_or_create_integration(db: AsyncSession, platform: str) -> PlatformIntegration:
    row = (await db.execute(
        select(PlatformIntegration).where(PlatformIntegration.platform == platform)
    )).scalar_one_or_none()
    if row is None:
        row = PlatformIntegration(
            platform=platform,
            display_name=_DISPLAY_NAMES.get(platform, platform),
        )
        db.add(row)
        await db.flush()
    return row


async def list_integrations(db: AsyncSession) -> list[IntegrationOut]:
    platforms = list(_DISPLAY_NAMES.keys())
    existing = {
        r.platform: r
        for r in (await db.execute(
            select(PlatformIntegration).where(PlatformIntegration.platform.in_(platforms))
        )).scalars().all()
    }
    out: list[IntegrationOut] = []
    created_any = False
    for p in platforms:
        if p not in existing:
            row = await _get_or_create_integration(db, p)
            created_any = True
        else:
            row = existing[p]
        out.append(_serialize_integration(row))
    if created_any:
        await db.commit()
    return out


async def begin_oauth(
    db: AsyncSession,
    platform: str,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> IntegrationOAuthInitOut:
    if platform not in _AUTH_URL_BUILDERS:
        raise ValidationAppError(f"Unknown integration platform: {platform}")
    _check_oauth_creds(platform)

    state = secrets.token_urlsafe(32)
    row = await _get_or_create_integration(db, platform)
    row.oauth_state = state

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="integration.oauth_initiated",
        entity_type="PlatformIntegration",
        entity_id=row.id,
        after={"platform": platform},
        correlation_id=correlation_id,
    )
    await db.commit()
    return IntegrationOAuthInitOut(
        authorization_url=_AUTH_URL_BUILDERS[platform](state),
        state=state,
    )


async def complete_oauth(
    db: AsyncSession,
    platform: str,
    payload: IntegrationOAuthCallbackIn,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> IntegrationOut:
    row = await _get_or_create_integration(db, platform)
    if row.oauth_state != payload.state:
        raise ValidationAppError("OAuth state mismatch — possible CSRF attack")

    try:
        import httpx
    except ImportError:
        raise ValidationAppError("httpx required for OAuth. Run: pip install httpx")

    token_data = await _exchange_code(platform, payload.code)
    access_token = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token", "")
    expires_in = token_data.get("expires_in")
    account_email = token_data.get("_account_email", "")

    row.access_token_enc = _encrypt(access_token) if access_token else None
    row.refresh_token_enc = _encrypt(refresh_token) if refresh_token else None
    row.token_expires_at = (
        _utcnow() + timedelta(seconds=int(expires_in)) if expires_in else None
    )
    row.connected_account = account_email
    row.is_connected = True
    row.oauth_state = None
    row.last_health_check = _utcnow()
    row.last_health_ok = True

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="integration.connected",
        entity_type="PlatformIntegration",
        entity_id=row.id,
        after={"platform": platform, "account": account_email},
        correlation_id=correlation_id,
    )
    await db.commit()
    return _serialize_integration(row)


async def _exchange_code(platform: str, code: str) -> dict:
    import httpx
    if platform == "zoom":
        creds = base64.b64encode(
            f"{settings.ZOOM_CLIENT_ID}:{settings.ZOOM_CLIENT_SECRET}".encode()
        ).decode()
        async with httpx.AsyncClient() as c:
            r = await c.post(
                "https://zoom.us/oauth/token",
                params={"grant_type": "authorization_code", "code": code,
                        "redirect_uri": settings.ZOOM_REDIRECT_URI},
                headers={"Authorization": f"Basic {creds}"},
            )
            r.raise_for_status()
            data = r.json()
        async with httpx.AsyncClient() as c:
            me = await c.get(
                "https://api.zoom.us/v2/users/me",
                headers={"Authorization": f"Bearer {data['access_token']}"},
            )
            if me.status_code == 200:
                data["_account_email"] = me.json().get("email", "")
        return data

    elif platform == "microsoft_teams":
        async with httpx.AsyncClient() as c:
            r = await c.post(
                f"https://login.microsoftonline.com/{settings.TEAMS_TENANT_ID}/oauth2/v2.0/token",
                data={
                    "client_id": settings.TEAMS_CLIENT_ID,
                    "client_secret": settings.TEAMS_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.TEAMS_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            r.raise_for_status()
            data = r.json()
        id_token = data.get("id_token", "")
        if id_token:
            try:
                import json
                part = id_token.split(".")[1]
                pad = "=" * (4 - len(part) % 4)
                claims = json.loads(base64.urlsafe_b64decode(part + pad))
                data["_account_email"] = claims.get("preferred_username") or claims.get("email", "")
            except Exception:
                pass
        return data

    elif platform == "google_meet":
        async with httpx.AsyncClient() as c:
            r = await c.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            r.raise_for_status()
            data = r.json()
        async with httpx.AsyncClient() as c:
            info = await c.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {data['access_token']}"},
            )
            if info.status_code == 200:
                data["_account_email"] = info.json().get("email", "")
        return data

    elif platform == "webex":
        async with httpx.AsyncClient() as c:
            r = await c.post(
                "https://webexapis.com/v1/access_token",
                data={
                    "client_id": settings.WEBEX_CLIENT_ID,
                    "client_secret": settings.WEBEX_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.WEBEX_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            r.raise_for_status()
            data = r.json()
        async with httpx.AsyncClient() as c:
            me = await c.get(
                "https://webexapis.com/v1/people/me",
                headers={"Authorization": f"Bearer {data['access_token']}"},
            )
            if me.status_code == 200:
                data["_account_email"] = (me.json().get("emails") or [""])[0]
        return data

    raise ValidationAppError(f"Unknown platform: {platform}")


async def disconnect_integration(
    db: AsyncSession,
    platform: str,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> IntegrationOut:
    row = (await db.execute(
        select(PlatformIntegration).where(PlatformIntegration.platform == platform)
    )).scalar_one_or_none()
    if row is None or not row.is_connected:
        raise ValidationAppError(f"{platform} is not currently connected")

    before = {"platform": platform, "account": row.connected_account}
    row.is_connected = False
    row.access_token_enc = None
    row.refresh_token_enc = None
    row.token_expires_at = None
    row.connected_account = None
    row.oauth_state = None
    row.last_health_ok = None

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="integration.disconnected",
        entity_type="PlatformIntegration",
        entity_id=row.id,
        before=before,
        after={"platform": platform},
        correlation_id=correlation_id,
    )
    await db.commit()
    return _serialize_integration(row)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Renewal Reminder
# ═══════════════════════════════════════════════════════════════════════════════

async def send_renewal_reminder(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> RenewalReminderOut:
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if tenant is None:
        raise NotFoundError("Tenant not found")

    admin_acc = (await db.execute(
        select(InstitutionAdminAccount).where(InstitutionAdminAccount.tenant_id == tenant_id)
    )).scalar_one_or_none()

    to_email = admin_acc.email if admin_acc else None
    if not to_email:
        raise ValidationAppError("No admin contact email found for this tenant")

    renewal_date_str = (
        tenant.renewal_date.strftime("%B %d, %Y") if tenant.renewal_date else "unknown date"
    )
    subject = f"Renewal Reminder — {tenant.name}"
    body = (
        f"Dear {tenant.name} administrator,\n\n"
        f"This is a reminder that your Berana LMS subscription for {tenant.name} "
        f"is due for renewal on {renewal_date_str}.\n\n"
        "Please contact Cyber-Zeb Consulting to proceed with your renewal and ensure "
        "uninterrupted access to your LMS.\n\n"
        "If you have already arranged your renewal, please disregard this message.\n\n"
        "— Cyber-Zeb Consulting / Berana LMS\n"
    )

    result = send_email_sync(to_email=to_email, subject=subject, body=body)

    db.add(EmailLog(
        email_type=EmailType.RENEWAL_REMINDER,
        to_email=to_email,
        subject=subject,
        body_preview=body[:4000],
        status=EmailStatus.SENT if result.ok else EmailStatus.FAILED,
        error_message=result.error_message,
    ))
    await db.flush()

    tenant.renewal_reminder_sent_at = _utcnow()

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="tenant.renewal_reminder_sent",
        entity_type="Tenant",
        entity_id=tenant.id,
        after={
            "tenant_name": tenant.name,
            "to_email": to_email,
            "renewal_date": str(tenant.renewal_date),
            "email_ok": result.ok,
        },
        correlation_id=correlation_id,
    )
    await db.commit()

    return RenewalReminderOut(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        reminder_sent_at=_utcnow(),
        email_ok=result.ok,
        error_message=result.error_message,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Branding
# ═══════════════════════════════════════════════════════════════════════════════

async def _get_or_create_branding(db: AsyncSession) -> PlatformBranding:
    row = (await db.execute(select(PlatformBranding).limit(1))).scalar_one_or_none()
    if row is None:
        row = PlatformBranding()
        db.add(row)
        await db.flush()
    return row


def _branding_out(row: PlatformBranding) -> BrandingOut:
    return BrandingOut(
        id=row.id,
        logo_url=row.logo_url,
        favicon_url=row.favicon_url,
        footer_text=row.footer_text,
        footer_links=row.footer_links,
        support_email=row.support_email,
        support_phone=row.support_phone,
        updated_at=row.updated_at,
    )


async def get_branding(db: AsyncSession) -> BrandingOut:
    row = await _get_or_create_branding(db)
    await db.commit()
    return _branding_out(row)


async def update_branding(
    db: AsyncSession,
    payload: BrandingPatch,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> BrandingOut:
    row = await _get_or_create_branding(db)
    before = {
        "footer_text": row.footer_text,
        "footer_links": row.footer_links,
        "support_email": row.support_email,
        "support_phone": row.support_phone,
    }

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)
    row.updated_by_admin_id = admin.id
    row.updated_at = _utcnow()

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="branding.updated",
        entity_type="PlatformBranding",
        entity_id=row.id,
        before=before,
        after=updates,
        correlation_id=correlation_id,
    )
    await db.commit()
    return _branding_out(row)


def _save_asset_local(filename: str, content: bytes) -> str:
    import re
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
    dest_dir = Path(__file__).parent.parent.parent / "static" / "branding"
    dest_dir.mkdir(parents=True, exist_ok=True)
    (dest_dir / safe).write_bytes(content)
    return f"/static/branding/{safe}"


async def _upload_to_s3(filename: str, content: bytes) -> str:
    try:
        import boto3
        from botocore.client import Config
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT or None,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            region_name=settings.STORAGE_REGION or "us-east-1",
            config=Config(signature_version="s3v4"),
        )
        key = f"branding/{filename}"
        s3.put_object(Bucket=settings.STORAGE_BUCKET, Key=key, Body=content, ACL="public-read")
        base = (
            settings.STORAGE_ENDPOINT.rstrip("/")
            if settings.STORAGE_ENDPOINT
            else f"https://{settings.STORAGE_BUCKET}.s3.amazonaws.com"
        )
        return f"{base}/{settings.STORAGE_BUCKET}/{key}"
    except Exception as exc:
        logger.error("S3 upload failed (%s), falling back to local", exc)
        return _save_asset_local(filename, content)


async def upload_branding_asset(
    db: AsyncSession,
    asset_type: str,
    filename: str,
    content: bytes,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> BrandingOut:
    if asset_type not in ("logo", "favicon"):
        raise ValidationAppError("asset_type must be 'logo' or 'favicon'")

    if (
        settings.STORAGE_ENDPOINT
        and settings.STORAGE_ACCESS_KEY
        and settings.STORAGE_SECRET_KEY
    ):
        public_url = await _upload_to_s3(filename, content)
    else:
        public_url = _save_asset_local(filename, content)

    row = await _get_or_create_branding(db)
    if asset_type == "logo":
        row.logo_url = public_url
    else:
        row.favicon_url = public_url
    row.updated_by_admin_id = admin.id
    row.updated_at = _utcnow()

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="branding.updated",
        entity_type="PlatformBranding",
        entity_id=row.id,
        after={f"{asset_type}_url": public_url},
        correlation_id=correlation_id,
    )
    await db.commit()
    return _branding_out(row)


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Security — Admin bans
# ═══════════════════════════════════════════════════════════════════════════════

async def list_platform_admins_with_status(db: AsyncSession) -> list[SuspendedAdminOut]:
    rows = (await db.execute(
        select(PlatformAdminUser).order_by(PlatformAdminUser.created_at)
    )).scalars().all()
    return [
        SuspendedAdminOut(
            id=r.id, email=r.email, role=r.role.value,
            is_suspended=r.is_suspended,
            suspension_reason=r.suspension_reason,
            suspended_at=r.suspended_at,
            created_at=r.created_at,
        )
        for r in rows
    ]


async def ban_platform_admin(
    db: AsyncSession,
    target_id: uuid.UUID,
    payload: AdminBanIn,
    *,
    acting_admin: PlatformAdminUser,
    correlation_id: str | None,
) -> AdminBanOut:
    if target_id == acting_admin.id:
        raise ValidationAppError("You cannot suspend your own account")

    target = (await db.execute(
        select(PlatformAdminUser).where(PlatformAdminUser.id == target_id)
    )).scalar_one_or_none()
    if target is None:
        raise NotFoundError("Platform admin not found")
    if target.is_suspended:
        raise ValidationAppError("Account is already suspended")

    target.is_suspended = True
    target.suspension_reason = payload.reason
    target.suspended_at = _utcnow()

    ban_record = PlatformAdminBan(
        target_admin_id=target.id,
        banned_by_admin_id=acting_admin.id,
        reason=payload.reason,
        is_active=True,
    )
    db.add(ban_record)
    await db.flush()

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=acting_admin.id,
        action="security.admin_banned",
        entity_type="PlatformAdminUser",
        entity_id=target.id,
        after={"email": target.email, "reason": payload.reason},
        correlation_id=correlation_id,
    )
    await db.commit()

    return AdminBanOut(
        id=ban_record.id,
        target_admin_id=target.id,
        target_admin_email=target.email,
        banned_by_admin_id=acting_admin.id,
        reason=payload.reason,
        is_active=True,
        unbanned_at=None,
        unban_reason=None,
        created_at=ban_record.created_at,
    )


async def unban_platform_admin(
    db: AsyncSession,
    target_id: uuid.UUID,
    payload: AdminUnbanIn,
    *,
    acting_admin: PlatformAdminUser,
    correlation_id: str | None,
) -> SuspendedAdminOut:
    target = (await db.execute(
        select(PlatformAdminUser).where(PlatformAdminUser.id == target_id)
    )).scalar_one_or_none()
    if target is None:
        raise NotFoundError("Platform admin not found")
    if not target.is_suspended:
        raise ValidationAppError("Account is not currently suspended")

    target.is_suspended = False
    target.suspension_reason = None
    target.suspended_at = None

    ban_record = (await db.execute(
        select(PlatformAdminBan).where(
            PlatformAdminBan.target_admin_id == target_id,
            PlatformAdminBan.is_active.is_(True),
        )
    )).scalar_one_or_none()
    if ban_record:
        ban_record.is_active = False
        ban_record.unbanned_at = _utcnow()
        ban_record.unbanned_by_admin_id = acting_admin.id
        ban_record.unban_reason = payload.reason

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=acting_admin.id,
        action="security.admin_unbanned",
        entity_type="PlatformAdminUser",
        entity_id=target.id,
        after={"email": target.email, "reason": payload.reason},
        correlation_id=correlation_id,
    )
    await db.commit()

    return SuspendedAdminOut(
        id=target.id, email=target.email, role=target.role.value,
        is_suspended=False, suspension_reason=None, suspended_at=None,
        created_at=target.created_at,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Security — User Reports & Bans
# ═══════════════════════════════════════════════════════════════════════════════

async def _enrich_report(db: AsyncSession, r: UserReport) -> UserReportOut:
    u = await db.get(User, r.reported_user_id) if r.reported_user_id else None
    t = await db.get(Tenant, r.tenant_id)
    return UserReportOut(
        id=r.id,
        reporter_user_id=r.reporter_user_id,
        reported_user_id=r.reported_user_id,
        reported_user_display_name=u.display_name if u else None,
        reported_user_email=u.email if u else None,
        tenant_id=r.tenant_id,
        tenant_name=t.name if t else None,
        reason=r.reason,
        description=r.description,
        status=r.status,
        reviewed_by_admin_id=r.reviewed_by_admin_id,
        reviewed_at=r.reviewed_at,
        review_notes=r.review_notes,
        created_at=r.created_at,
    )


async def create_user_report(
    db: AsyncSession,
    payload: UserReportIn,
    *,
    reporter_user_id: uuid.UUID | None = None,
    correlation_id: str | None = None,
) -> UserReportOut:
    report = UserReport(
        reporter_user_id=reporter_user_id,
        reported_user_id=payload.reported_user_id,
        tenant_id=payload.tenant_id,
        reason=payload.reason,
        description=payload.description,
        status=UserReportStatus.OPEN.value,
    )
    db.add(report)
    await db.flush()

    await _audit(
        db,
        actor_type=PlatformActorType.SYSTEM,
        actor_id=None,
        action="security.user_reported",
        entity_type="UserReport",
        entity_id=report.id,
        after={
            "reported_user_id": str(payload.reported_user_id),
            "tenant_id": str(payload.tenant_id),
            "reason": payload.reason,
        },
        correlation_id=correlation_id,
    )
    await db.commit()
    return await _enrich_report(db, report)


async def list_user_reports(
    db: AsyncSession,
    *,
    status: str | None = None,
    tenant_id: uuid.UUID | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[UserReportOut], int]:
    filters = []
    if status:
        filters.append(UserReport.status == status)
    if tenant_id:
        filters.append(UserReport.tenant_id == tenant_id)

    count_q = select(func.count()).select_from(UserReport)
    list_q = select(UserReport).order_by(UserReport.created_at.desc()).offset(offset).limit(limit)
    if filters:
        count_q = count_q.where(*filters)
        list_q = list_q.where(*filters)

    total = (await db.execute(count_q)).scalar_one()
    rows = (await db.execute(list_q)).scalars().all()
    items = [await _enrich_report(db, r) for r in rows]
    return items, total


async def review_user_report(
    db: AsyncSession,
    report_id: uuid.UUID,
    payload: UserReportReviewIn,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> UserReportOut:
    report = (await db.execute(
        select(UserReport).where(UserReport.id == report_id)
    )).scalar_one_or_none()
    if report is None:
        raise NotFoundError("Report not found")

    report.status = payload.status
    report.reviewed_by_admin_id = admin.id
    report.reviewed_at = _utcnow()
    report.review_notes = payload.notes

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="security.report_reviewed",
        entity_type="UserReport",
        entity_id=report.id,
        after={"status": payload.status, "notes": payload.notes},
        correlation_id=correlation_id,
    )
    await db.commit()
    return await _enrich_report(db, report)


async def ban_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    payload: UserBanIn,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> UserBanOut:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")

    user.status = UserStatus.SUSPENDED

    ban = UserBan(
        user_id=user_id,
        tenant_id=user.tenant_id,
        banned_by_admin_id=admin.id,
        reason=payload.reason,
        ban_scope=payload.ban_scope,
        is_active=True,
        report_id=payload.report_id,
    )
    db.add(ban)
    await db.flush()

    if payload.report_id:
        report = (await db.execute(
            select(UserReport).where(UserReport.id == payload.report_id)
        )).scalar_one_or_none()
        if report:
            report.status = UserReportStatus.BANNED.value
            report.reviewed_by_admin_id = admin.id
            report.reviewed_at = _utcnow()

    tenant = await db.get(Tenant, user.tenant_id)
    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="security.user_banned",
        entity_type="User",
        entity_id=user_id,
        after={
            "display_name": user.display_name,
            "email": user.email,
            "tenant_id": str(user.tenant_id),
            "reason": payload.reason,
        },
        correlation_id=correlation_id,
    )
    await db.commit()

    return UserBanOut(
        id=ban.id, user_id=user_id,
        user_display_name=user.display_name,
        user_email=user.email,
        tenant_id=user.tenant_id,
        tenant_name=tenant.name if tenant else None,
        banned_by_admin_id=admin.id,
        reason=payload.reason,
        ban_scope=payload.ban_scope,
        is_active=True,
        unbanned_at=None,
        report_id=payload.report_id,
        created_at=ban.created_at,
    )


async def unban_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    payload: UserUnbanIn,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
) -> UserBanOut:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")

    ban = (await db.execute(
        select(UserBan).where(UserBan.user_id == user_id, UserBan.is_active.is_(True))
    )).scalar_one_or_none()
    if ban is None:
        raise ValidationAppError("No active ban found for this user")

    ban.is_active = False
    ban.unbanned_at = _utcnow()
    ban.unbanned_by_admin_id = admin.id
    user.status = UserStatus.ACTIVE

    tenant = await db.get(Tenant, ban.tenant_id)
    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="security.user_unbanned",
        entity_type="User",
        entity_id=user_id,
        after={"reason": payload.reason},
        correlation_id=correlation_id,
    )
    await db.commit()

    return UserBanOut(
        id=ban.id, user_id=user_id,
        user_display_name=user.display_name,
        user_email=user.email,
        tenant_id=ban.tenant_id,
        tenant_name=tenant.name if tenant else None,
        banned_by_admin_id=ban.banned_by_admin_id,
        reason=ban.reason,
        ban_scope=ban.ban_scope,
        is_active=False,
        unbanned_at=ban.unbanned_at,
        report_id=ban.report_id,
        created_at=ban.created_at,
    )


async def list_user_bans(
    db: AsyncSession,
    *,
    active_only: bool = True,
    tenant_id: uuid.UUID | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[UserBanOut], int]:
    filters = []
    if active_only:
        filters.append(UserBan.is_active.is_(True))
    if tenant_id:
        filters.append(UserBan.tenant_id == tenant_id)

    count_q = select(func.count()).select_from(UserBan)
    list_q = select(UserBan).order_by(UserBan.created_at.desc()).offset(offset).limit(limit)
    if filters:
        count_q = count_q.where(*filters)
        list_q = list_q.where(*filters)

    total = (await db.execute(count_q)).scalar_one()
    rows = (await db.execute(list_q)).scalars().all()

    async def _enrich_ban(b: UserBan) -> UserBanOut:
        u = await db.get(User, b.user_id)
        t = await db.get(Tenant, b.tenant_id)
        return UserBanOut(
            id=b.id, user_id=b.user_id,
            user_display_name=u.display_name if u else None,
            user_email=u.email if u else None,
            tenant_id=b.tenant_id,
            tenant_name=t.name if t else None,
            banned_by_admin_id=b.banned_by_admin_id,
            reason=b.reason, ban_scope=b.ban_scope,
            is_active=b.is_active, unbanned_at=b.unbanned_at,
            report_id=b.report_id, created_at=b.created_at,
        )

    return [await _enrich_ban(b) for b in rows], total


# ═══════════════════════════════════════════════════════════════════════════════
# 7. Analytics
# ═══════════════════════════════════════════════════════════════════════════════

async def get_analytics(
    db: AsyncSession,
    *,
    since: datetime | None = None,
    until: datetime | None = None,
    institution_type: str | None = None,
) -> AnalyticsOut:
    # ── Module demand ─────────────────────────────────────────────────────────
    # We aggregate requested_modules JSONB arrays by unnesting them
    sr_filters = [ServiceRequest.status == ServiceRequestStatus.ACTIVATED]
    if since:
        sr_filters.append(ServiceRequest.created_at >= since)
    if until:
        sr_filters.append(ServiceRequest.created_at <= until)
    if institution_type:
        sr_filters.append(ServiceRequest.institution_type == institution_type)

    # Raw query: unnest JSONB array and count
    sr_module_counts_q = await db.execute(
        text(
            "SELECT module_key, COUNT(*) AS cnt FROM service_requests, "
            "jsonb_array_elements_text(requested_modules) AS module_key "
            "WHERE status = 'activated' "
            + ("AND institution_type = :itype " if institution_type else "")
            + ("AND created_at >= :since " if since else "")
            + ("AND created_at <= :until " if until else "")
            + "GROUP BY module_key"
        ),
        {
            k: v for k, v in {
                "itype": institution_type,
                "since": since,
                "until": until,
            }.items() if v is not None
        },
    )
    sr_counts = {row[0]: int(row[1]) for row in sr_module_counts_q.fetchall()}

    addon_filters_str = (
        ("AND institution_type = :itype " if institution_type else "")
        + ("AND amr.created_at >= :since " if since else "")
        + ("AND amr.created_at <= :until " if until else "")
    )
    addon_module_counts_q = await db.execute(
        text(
            "SELECT module_key, COUNT(*) AS cnt FROM addon_module_requests amr "
            "JOIN tenants t ON t.id = amr.tenant_id, "
            "jsonb_array_elements_text(amr.requested_modules) AS module_key "
            "WHERE amr.status = 'activated' "
            + addon_filters_str
            + "GROUP BY module_key"
        ),
        {
            k: v for k, v in {
                "itype": institution_type,
                "since": since,
                "until": until,
            }.items() if v is not None
        },
    )
    addon_counts = {row[0]: int(row[1]) for row in addon_module_counts_q.fetchall()}

    all_module_keys = set(sr_counts.keys()) | set(addon_counts.keys())
    from app.modules.onboarding.constants import MODULE_LABELS
    module_demand = sorted(
        [
            ModuleDemandItem(
                module_key=k,
                display_name=MODULE_LABELS.get(k, k),  # type: ignore[arg-type]
                request_count=sr_counts.get(k, 0),
                addon_count=addon_counts.get(k, 0),
                total_count=sr_counts.get(k, 0) + addon_counts.get(k, 0),
            )
            for k in all_module_keys
        ],
        key=lambda x: x.total_count,
        reverse=True,
    )

    # ── Revenue trend (last 6 months of activated service requests) ───────────
    revenue_q = await db.execute(
        text(
            "SELECT TO_CHAR(payment_confirmed_at, 'YYYY-MM') AS period, "
            "SUM(invoice_amount) AS revenue, "
            "invoice_currency, "
            "COUNT(*) AS cnt "
            "FROM service_requests "
            "WHERE status = 'activated' AND payment_confirmed_at IS NOT NULL "
            "AND payment_confirmed_at >= NOW() - INTERVAL '6 months' "
            "GROUP BY period, invoice_currency ORDER BY period"
        )
    )
    revenue_trend = [
        RevenueTrendItem(
            period=row[0],
            revenue=Decimal(str(row[1] or 0)),
            currency=row[2] or "USD",
            confirmed_count=int(row[3]),
        )
        for row in revenue_q.fetchall()
    ]

    # ── Avg activation time ───────────────────────────────────────────────────
    avg_q = await db.execute(
        text(
            "SELECT AVG(EXTRACT(EPOCH FROM (activated_at - created_at)) / 86400.0) "
            "FROM service_requests WHERE status = 'activated' AND activated_at IS NOT NULL"
        )
    )
    avg_val = avg_q.scalar_one()
    avg_activation_days = round(float(avg_val), 1) if avg_val is not None else None

    total_activated = (await db.execute(
        select(func.count()).select_from(ServiceRequest).where(
            ServiceRequest.status == ServiceRequestStatus.ACTIVATED
        )
    )).scalar_one()

    # ── Institution type counts (from tenants) ────────────────────────────────
    type_q = await db.execute(
        text(
            "SELECT institution_type, COUNT(*) FROM tenants "
            "WHERE institution_type IS NOT NULL GROUP BY institution_type"
        )
    )
    institution_type_counts = {row[0]: int(row[1]) for row in type_q.fetchall()}

    return AnalyticsOut(
        module_demand=module_demand,
        revenue_trend=revenue_trend,
        avg_activation_days=avg_activation_days,
        total_activated=total_activated,
        institution_type_counts=institution_type_counts,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 8. Backup & Restore
# ═══════════════════════════════════════════════════════════════════════════════

def _backup_dir() -> Path:
    d = Path(settings.BACKUP_DIR)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _backup_run_out(run: BackupRun) -> BackupRunOut:
    return BackupRunOut(
        id=run.id,
        status=run.status,
        file_path=run.file_path,
        file_size_bytes=run.file_size_bytes,
        file_size_human=_human_size(run.file_size_bytes),
        duration_seconds=run.duration_seconds,
        error_message=run.error_message,
        triggered_by=run.triggered_by,
        triggered_by_admin_id=run.triggered_by_admin_id,
        started_at=run.started_at,
        completed_at=run.completed_at,
    )


async def list_backup_runs(
    db: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 20,
) -> BackupListOut:
    total = (await db.execute(select(func.count()).select_from(BackupRun))).scalar_one()
    rows = (await db.execute(
        select(BackupRun).order_by(BackupRun.started_at.desc()).offset(offset).limit(limit)
    )).scalars().all()
    return BackupListOut(items=[_backup_run_out(r) for r in rows], total=total)


async def trigger_backup(
    db: AsyncSession,
    *,
    admin: PlatformAdminUser | None = None,
    triggered_by: str = "manual",
    correlation_id: str | None = None,
) -> BackupRunOut:
    """Create a BackupRun record, then execute pg_dump synchronously in a thread."""
    import asyncio

    run = BackupRun(
        status=BackupStatus.RUNNING.value,
        triggered_by=triggered_by,
        triggered_by_admin_id=admin.id if admin else None,
    )
    db.add(run)
    await db.flush()
    await db.commit()  # commit so the run ID is persisted before the long process

    # Run pg_dump in a thread to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _run_pg_dump, str(run.id))

    # Reload the run and update it
    run = (await db.execute(select(BackupRun).where(BackupRun.id == run.id))).scalar_one()
    run.status = result["status"]
    run.file_path = result.get("file_path")
    run.file_size_bytes = result.get("file_size_bytes")
    run.duration_seconds = result.get("duration_seconds")
    run.error_message = result.get("error_message")
    run.completed_at = _utcnow()

    if admin:
        await _audit(
            db,
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="backup.created",
            entity_type="BackupRun",
            entity_id=run.id,
            after={"status": run.status, "file_path": run.file_path},
            correlation_id=correlation_id,
        )
    await db.commit()
    return _backup_run_out(run)


def _run_pg_dump(run_id: str) -> dict:
    """Synchronous pg_dump execution — runs in a thread pool."""
    import time
    from urllib.parse import urlparse

    db_url = settings.DATABASE_URL_SYNC
    # Convert asyncpg URL to standard postgres URL for pg_dump
    db_url_clean = db_url.replace("postgresql+asyncpg://", "postgresql://").replace(
        "postgresql+psycopg2://", "postgresql://"
    )
    parsed = urlparse(db_url_clean)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{ts}_{run_id[:8]}.dump"
    dest = _backup_dir() / filename

    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    cmd = [
        "pg_dump",
        "--format=custom",
        "--no-password",
        f"--host={parsed.hostname or 'localhost'}",
        f"--port={parsed.port or 5432}",
        f"--username={parsed.username or 'postgres'}",
        f"--file={dest}",
        parsed.path.lstrip("/"),
    ]

    t0 = time.monotonic()
    try:
        proc = subprocess.run(cmd, env=env, capture_output=True, timeout=600)
        duration = round(time.monotonic() - t0, 2)
        if proc.returncode != 0:
            return {
                "status": BackupStatus.FAILED.value,
                "error_message": proc.stderr.decode()[:2000],
                "duration_seconds": Decimal(str(duration)),
            }
        size = dest.stat().st_size
        return {
            "status": BackupStatus.SUCCESS.value,
            "file_path": str(dest),
            "file_size_bytes": size,
            "duration_seconds": Decimal(str(duration)),
        }
    except subprocess.TimeoutExpired:
        return {"status": BackupStatus.FAILED.value, "error_message": "pg_dump timed out after 600s"}
    except FileNotFoundError:
        return {
            "status": BackupStatus.FAILED.value,
            "error_message": "pg_dump not found — ensure postgresql-client is installed",
        }
    except Exception as exc:
        return {"status": BackupStatus.FAILED.value, "error_message": str(exc)[:2000]}


async def restore_from_backup(
    db: AsyncSession,
    payload: RestoreIn,
    *,
    admin: PlatformAdminUser,
    correlation_id: str | None,
    expected_confirmation: str,
) -> dict:
    """Run pg_restore — destructive, requires typed confirmation."""
    if payload.confirmation.strip() != expected_confirmation.strip():
        raise ValidationAppError(
            f"Confirmation text does not match. Expected: '{expected_confirmation}'"
        )

    run = (await db.execute(
        select(BackupRun).where(
            BackupRun.id == payload.backup_id,
            BackupRun.status == BackupStatus.SUCCESS.value,
        )
    )).scalar_one_or_none()
    if run is None:
        raise NotFoundError("Backup run not found or was not successful")
    if not run.file_path or not Path(run.file_path).exists():
        raise ValidationAppError("Backup file no longer exists on disk")

    await _audit(
        db,
        actor_type=PlatformActorType.PLATFORM_ADMIN,
        actor_id=admin.id,
        action="backup.restore_initiated",
        entity_type="BackupRun",
        entity_id=run.id,
        after={"file_path": run.file_path, "confirmed_by": admin.email},
        correlation_id=correlation_id,
    )
    await db.commit()

    # Run pg_restore in background thread
    import asyncio
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _run_pg_restore, run.file_path)
    return result


def _run_pg_restore(file_path: str) -> dict:
    from urllib.parse import urlparse

    db_url = settings.DATABASE_URL_SYNC.replace("postgresql+asyncpg://", "postgresql://").replace(
        "postgresql+psycopg2://", "postgresql://"
    )
    parsed = urlparse(db_url)
    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    cmd = [
        "pg_restore",
        "--clean",
        "--if-exists",
        "--no-password",
        f"--host={parsed.hostname or 'localhost'}",
        f"--port={parsed.port or 5432}",
        f"--username={parsed.username or 'postgres'}",
        f"--dbname={parsed.path.lstrip('/')}",
        file_path,
    ]
    try:
        proc = subprocess.run(cmd, env=env, capture_output=True, timeout=1800)
        if proc.returncode != 0:
            return {"ok": False, "error": proc.stderr.decode()[:2000]}
        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
