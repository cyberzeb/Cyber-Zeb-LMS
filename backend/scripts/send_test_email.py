"""
Send one test email with the app's own SMTP settings.

Run this before debugging the login flow: it proves whether the API can reach
the mail server at all, without touching the database or the OTP code path.

Usage (from backend/, with the venv python):
  python -m scripts.send_test_email you@example.com
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.modules.onboarding.email_service import (
    build_sign_in_code_email,
    describe_email_config,
    send_email_sync,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("to_email", help="recipient address")
    parser.add_argument(
        "--sample-code",
        action="store_true",
        help="send the real sign-in-code template instead of a plain test message",
    )
    args = parser.parse_args()

    print(f"SMTP: {describe_email_config()}")

    if args.sample_code:
        subject, body, html_body = build_sign_in_code_email(
            code="123456", ttl_minutes=settings.OTP_TTL_MINUTES, audience="SuperAdmin"
        )
    else:
        subject = "Berana LMS test email"
        body = (
            "This is a test message from the Berana LMS API.\n\n"
            f"Environment: {settings.APP_ENV}\n"
            f"Frontend: {settings.FRONTEND_BASE_URL}\n"
        )
        html_body = None

    result = send_email_sync(
        to_email=args.to_email, subject=subject, body=body, html_body=html_body
    )
    if result.ok:
        print(f"Sent to {args.to_email} (message id {result.provider_message_id})")
        if settings.SMTP_PORT == 1025:
            print("Open http://localhost:8025 to read it in Mailpit.")
        return 0

    print(f"FAILED: {result.error_message}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
