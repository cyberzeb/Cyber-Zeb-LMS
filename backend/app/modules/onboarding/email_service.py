"""
SMTP email sender for onboarding, alert and sign-in emails.

Works against any SMTP server. Two configurations are supported:

* **Mailpit (local / staging)** - ``SMTP_HOST=localhost``, ``SMTP_PORT=1025``,
  no user, no TLS. Every message is captured and shown at http://localhost:8025
  instead of being delivered, so sign-in codes can be tested without owning a
  domain.
* **Gmail (production)** - set ``GMAIL_USER`` and ``GMAIL_APP_PASSWORD``; the
  Gmail host, port and STARTTLS are then applied automatically.

Nothing here raises: a failed send returns an unsuccessful ``EmailSendResult``
so callers can log it and carry on.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

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


@dataclass(frozen=True)
class SmtpConfig:
    host: str
    port: int
    user: str
    password: str
    starttls: bool
    use_ssl: bool
    from_email: str
    from_name: str
    timeout: int

    @property
    def uses_auth(self) -> bool:
        return bool(self.user and self.password)


def smtp_config() -> SmtpConfig:
    """
    Resolve the SMTP settings used for a send.

    Setting GMAIL_USER + GMAIL_APP_PASSWORD selects Gmail and fills in its host,
    port and STARTTLS, so production only needs those two values. Everything else
    comes straight from SMTP_* - which by default points at Mailpit.
    """
    if settings.GMAIL_USER and settings.GMAIL_APP_PASSWORD:
        return SmtpConfig(
            host="smtp.gmail.com",
            port=587,
            user=settings.GMAIL_USER,
            password=settings.GMAIL_APP_PASSWORD,
            starttls=True,
            use_ssl=False,
            # Gmail rewrites the sender to the authenticated account anyway.
            from_email=settings.GMAIL_USER,
            from_name=settings.SMTP_FROM_NAME,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        )
    return SmtpConfig(
        host=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        user=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        starttls=settings.SMTP_STARTTLS,
        use_ssl=settings.SMTP_SSL,
        from_email=settings.SMTP_FROM_EMAIL or settings.SMTP_USER,
        from_name=settings.SMTP_FROM_NAME,
        timeout=settings.SMTP_TIMEOUT_SECONDS,
    )


def describe_email_config() -> str:
    """One-line summary for logs and diagnostics. Never includes secrets."""
    if not settings.EMAIL_ENABLED:
        return "email disabled (EMAIL_ENABLED=false)"
    config = smtp_config()
    mode = "SSL" if config.use_ssl else ("STARTTLS" if config.starttls else "plain")
    auth = "auth" if config.uses_auth else "no-auth"
    return f"{config.host}:{config.port} ({mode}, {auth}) from {config.from_email}"


def send_email_sync(
    *, to_email: str, subject: str, body: str, html_body: str | None = None
) -> EmailSendResult:
    """
    Send one message. Blocking - call it from a worker thread when running on the
    event loop (``starlette.concurrency.run_in_threadpool``).
    """
    if not settings.EMAIL_ENABLED:
        msg = "Email sending is disabled (EMAIL_ENABLED=false)"
        logger.warning("%s - dropping message to %s", msg, to_email)
        return EmailSendResult(
            ok=False, body=body, subject=subject, to_email=to_email, error_message=msg
        )

    config = smtp_config()
    if not config.host:
        msg = "SMTP not configured (set SMTP_HOST, or GMAIL_USER + GMAIL_APP_PASSWORD)"
        logger.error(msg)
        return EmailSendResult(
            ok=False, body=body, subject=subject, to_email=to_email, error_message=msg
        )

    try:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr((config.from_name, config.from_email))
        message["To"] = to_email
        message["Message-ID"] = make_msgid(domain=config.from_email.split("@")[-1] or None)
        message.set_content(body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        if config.use_ssl:
            server = smtplib.SMTP_SSL(
                config.host,
                config.port,
                timeout=config.timeout,
                context=ssl.create_default_context(),
            )
        else:
            server = smtplib.SMTP(config.host, config.port, timeout=config.timeout)

        with server:
            server.ehlo()
            if config.starttls and not config.use_ssl:
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            # Mailpit and most internal relays accept mail without a login.
            if config.uses_auth:
                server.login(config.user, config.password)
            server.send_message(message, from_addr=config.from_email, to_addrs=[to_email])

        logger.info(
            "Email sent to %s via %s:%s (%s)", to_email, config.host, config.port, subject
        )
        return EmailSendResult(
            ok=True,
            body=body,
            subject=subject,
            to_email=to_email,
            provider_message_id=message["Message-ID"],
        )
    except Exception as exc:  # noqa: BLE001 - never crash the API on mail failure
        logger.exception(
            "Email send failed to %s via %s:%s", to_email, config.host, config.port
        )
        return EmailSendResult(
            ok=False,
            body=body,
            subject=subject,
            to_email=to_email,
            error_message=f"{type(exc).__name__}: {exc}",
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


def build_sign_in_code_email(
    *, code: str, ttl_minutes: int, audience: str
) -> tuple[str, str, str]:
    """Subject, plain-text body and HTML body for a one-time sign-in code."""
    where = "the Berana LMS Super Admin console" if audience == "SuperAdmin" else "Berana LMS"
    subject = "Your Berana LMS sign-in code"
    body = (
        f"Your sign-in code for {where} is: {code}\n\n"
        f"It expires in {ttl_minutes} minutes and can be used once.\n"
        "If you did not try to sign in, you can ignore this email — "
        "nobody can use this code without your inbox.\n\n"
        "— Cyber-Zeb Consulting / Berana LMS\n"
    )
    html_body = f"""<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Berana LMS</p>
      <h1 style="margin:0 0 16px;font-size:20px">Your sign-in code</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6">
        Use this code to sign in to {where}.
      </p>
      <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:.32em;
                background:#f1f5f9;border-radius:10px;padding:16px;text-align:center">{code}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.6">
        It expires in {ttl_minutes} minutes and can be used once.
      </p>
      <p style="margin:0;font-size:13px;color:#475569;line-height:1.6">
        If you did not try to sign in, you can ignore this email.
      </p>
    </div>
  </body>
</html>"""
    return subject, body, html_body
