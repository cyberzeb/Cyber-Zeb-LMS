"""Gmail SMTP email sender for onboarding client + alert emails."""
from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.onboarding.models import EmailLog, EmailStatus, EmailType

logger = logging.getLogger(__name__)


class EmailSendResult:
    def __init__(
        self,
        *,
        ok: bool,
        body: str,
        subject: str,
        to_email: str,
        error_message: str | None = None,
        provider_message_id: str | None = None,
    ):
        self.ok = ok
        self.body = body
        self.subject = subject
        self.to_email = to_email
        self.error_message = error_message
        self.provider_message_id = provider_message_id


def _smtp_credentials() -> tuple[str, str, str, int]:
    """Prefer GMAIL_* (app password), fall back to SMTP_*."""
    user = settings.GMAIL_USER or settings.SMTP_USER
    password = settings.GMAIL_APP_PASSWORD or settings.SMTP_PASSWORD
    host = settings.SMTP_HOST or "smtp.gmail.com"
    port = settings.SMTP_PORT or 587
    return user, password, host, port


def send_email_sync(*, to_email: str, subject: str, body: str) -> EmailSendResult:
    user, password, host, port = _smtp_credentials()
    if not user or not password:
        msg = "SMTP not configured (set GMAIL_USER and GMAIL_APP_PASSWORD)"
        logger.error(msg)
        return EmailSendResult(
            ok=False, body=body, subject=subject, to_email=to_email, error_message=msg
        )

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = user
        message["To"] = to_email
        message.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(host, port, timeout=12) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(user, password)
            server.sendmail(user, [to_email], message.as_string())

        return EmailSendResult(ok=True, body=body, subject=subject, to_email=to_email)
    except Exception as exc:  # noqa: BLE001 — never crash the API on mail failure
        logger.exception("Email send failed to %s", to_email)
        return EmailSendResult(
            ok=False,
            body=body,
            subject=subject,
            to_email=to_email,
            error_message=str(exc),
        )


async def persist_email_log(
    db: AsyncSession,
    *,
    email_type: EmailType,
    result: EmailSendResult,
    service_request_id=None,
    addon_module_request_id=None,
) -> EmailLog:
    entry = EmailLog(
        service_request_id=service_request_id,
        addon_module_request_id=addon_module_request_id,
        email_type=email_type,
        to_email=result.to_email,
        subject=result.subject,
        body_preview=result.body[:4000],
        provider_message_id=result.provider_message_id,
        status=EmailStatus.SENT if result.ok else EmailStatus.FAILED,
        error_message=result.error_message,
    )
    db.add(entry)
    await db.flush()
    return entry


def build_invoice_email(
    *,
    institution_name: str,
    module_labels: list[str],
    amount: str,
    currency: str,
    invoice_notes: str,
    phone: str,
) -> tuple[str, str]:
    subject = f"Your Berana LMS Proposal for {institution_name}"
    modules_block = "\n".join(f"  • {label}" for label in module_labels)
    body = f"""Dear partner,

Thank you for requesting Berana LMS for {institution_name}.

Selected modules:
{modules_block}

Invoice amount: {amount} {currency}

Payment instructions:
{invoice_notes}

Once payment is confirmed, we will activate your institution workspace and send login credentials.

— Cyber-Zeb Consulting / Berana LMS
"""
    # SMS provider not in scope yet — keep phone on file for a future adapter.
    logger.info("SMS not yet wired, phone on file: %s", phone)
    return subject, body


def build_welcome_email(
    *,
    institution_name: str,
    institution_link: str,
    admin_email: str,
    temporary_password: str,
) -> tuple[str, str]:
    subject = f"Your Berana LMS is ready — {institution_name}"
    body = f"""Dear partner,

Your Berana LMS workspace for {institution_name} is ready.

Unique institution link:
{institution_link}

Sign in at the Berana login page and choose the "Institution Admin" role.
Login email: {admin_email}
Access code (6-digit): {temporary_password}

Enter the access code like a one-time code to reach your institution workspace,
where you can start adding programs, courses, instructors and learners.

— Cyber-Zeb Consulting / Berana LMS
"""
    return subject, body


def build_super_admin_alert(
    *,
    institution_name: str,
    contact_name: str,
    email: str,
    phone: str,
    modules: list[str],
) -> tuple[str, str]:
    subject = f"[Berana LMS] New service request — {institution_name}"
    body = f"""A new service request needs review.

Institution: {institution_name}
Contact: {contact_name}
Email: {email}
Phone: {phone}
Modules: {', '.join(modules)}

Open the Super Admin console to send an invoice or reject the request.
"""
    return subject, body
