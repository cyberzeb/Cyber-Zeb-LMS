"""
Emails for cohort registration: one message per step, not one per course.

* registered, payment due — how much, by when, and how to pay online;
* enrolled — the seat is confirmed, with the cohort's dates and schedule;
* cancelled — the seat was released.

They follow the institution's "Training" notification switch.
"""
from __future__ import annotations

import logging
import uuid
from urllib.parse import quote
from typing import Any, Optional

from app.modules.communication.notifications import Email, _institution, _link, _render, event_enabled
from app.modules.training import logic

logger = logging.getLogger(__name__)

Record = dict[str, Any]
CONTEXT = ("people", "settings", "training-programs", "cohorts")


def _money(registration: Record) -> str:
    amount = float(registration.get("amount") or 0)
    shown = f"{amount:,.0f}" if amount == int(amount) else f"{amount:,.2f}"
    return f"{shown} {registration.get('currency') or 'ETB'}"


def plan_registration_email(registration: Record, data: dict[str, Any]) -> Optional[Email]:
    if not event_enabled(data, "training"):
        return None
    person = logic.by_id(data.get("people")).get(str(registration.get("studentId")))
    to = str((person or {}).get("email") or registration.get("studentEmail") or "").strip().lower()
    if not to:
        return None
    cohort = logic.by_id(data.get("cohorts")).get(str(registration.get("cohortId"))) or {}
    program = logic.by_id(data.get("training-programs")).get(str(registration.get("programId"))) or {}
    institution = _institution(data)
    title = program.get("name") or "your program"
    dates = f"{cohort.get('startDate', '')} to {cohort.get('endDate', '')}".strip(" to")
    where = cohort.get("location") or cohort.get("deliveryMode") or ""
    status = registration.get("status")

    if status == "pending_payment":
        subject = f"Complete your registration for {title}"
        heading = "Your seat is reserved — one step left"
        lines = [
            f"Thank you for registering for {title} ({cohort.get('name', '')}).",
            f"Registration fee: {_money(registration)}. We hold your seat for {logic.HOLD_DAYS} days.",
            f"Sign in with this email address ({to}) — we send you a one-time code — and pay online to confirm your place.",
        ]
        cta = ("Sign in and pay", _link(f"/login?email={quote(to)}&redirect=%2Fstudent%2Fpayments"))
    elif status == "enrolled":
        subject = f"You're enrolled: {title}"
        heading = "Your place is confirmed"
        lines = [
            f"You are enrolled in {title} — {cohort.get('name', '')}.",
            f"Dates: {dates}." if dates else "",
            f"Schedule: {cohort['schedule']}." if cohort.get("schedule") else "",
            f"Where: {where}." if where else "",
            f"Sign in with {to} to start learning — we send you a one-time code.",
        ]
        cta = ("Open the learner portal", _link("/student"))
    elif status == "cancelled":
        subject = f"Registration cancelled: {title}"
        heading = "Your registration was cancelled"
        lines = [
            f"Your place in {title} — {cohort.get('name', '')} has been released.",
            "If this is a mistake, contact the training team or register again while seats are available.",
        ]
        cta = None
    else:
        return None
    body, page = _render(institution, heading, lines, cta)
    return Email(to=to, subject=f"{subject} — {institution}", body=body, html=page)


async def send_registration_emails(tenant_id: uuid.UUID, registration_ids: list[str]) -> None:
    """Background task. Never raises: an email problem must not undo a registration."""
    from starlette.concurrency import run_in_threadpool

    from app.core.config import settings
    from app.core.database import AsyncSessionLocal
    from app.modules.lms_store.service import LmsStoreService
    from app.modules.onboarding.email_service import send_email_sync

    if not registration_ids or not settings.EMAIL_ENABLED:
        return
    try:
        async with AsyncSessionLocal() as db:
            store = LmsStoreService(db)
            data = {key: await store.get_collection(tenant_id, key) for key in CONTEXT}
            registrations = logic.by_id(await store.get_collection(tenant_id, "cohort-registrations"))
        for registration_id in dict.fromkeys(registration_ids):
            registration = registrations.get(registration_id)
            email = plan_registration_email(registration, data) if registration else None
            if email:
                await run_in_threadpool(
                    send_email_sync, to_email=email.to, subject=email.subject, body=email.body, html_body=email.html
                )
    except Exception:  # noqa: BLE001
        logger.exception("Registration email failed")
