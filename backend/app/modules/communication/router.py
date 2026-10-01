"""
Communication, Notifications and Support module - FastAPI router.

Blueprint reference: Section 12 (Communication, Notifications and Support)

Event emails are sent automatically from the data store (see notifications.py).
These endpoints cover reminders that people trigger themselves.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.core.permissions import Role
from app.modules.communication.training_reminders import (
    REMINDER_KEYS,
    plan_manual_reminder,
    run_for_tenant,
)
from app.modules.lms_store.scope import ScopeContext
from app.modules.lms_store.service import LmsStoreService

router = APIRouter()


class RemindRequest(BaseModel):
    employee_id: str


class RemindResult(BaseModel):
    sent: bool
    message: str


class RunResult(BaseModel):
    sent: int


@router.post("/remind", response_model=RemindResult)
async def remind_employee(
    body: RemindRequest,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """Email an employee a list of the training they still owe. Admins, or the employee's manager."""
    store = LmsStoreService(db)
    if not principal.is_tenant_admin:
        if principal.role != Role.MANAGER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins and managers can send reminders")
        ctx = ScopeContext(lambda k: store.get_collection(principal.tenant_id, k), principal.person_id, principal.role)
        if body.employee_id not in await ctx.managed_employee_ids():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This person is not on your team")

    data = {k: await store.get_collection(principal.tenant_id, k) for k in REMINDER_KEYS}
    sender = next(
        (p.get("name") for p in data.get("people") or [] if isinstance(p, dict) and p.get("id") == principal.person_id),
        None,
    ) or "Your learning team"
    mail = plan_manual_reminder(data, body.employee_id, sender)
    if mail is None:
        return RemindResult(sent=False, message="Nothing outstanding — no reminder needed.")

    from app.modules.onboarding.email_service import send_email_sync

    result = await run_in_threadpool(
        send_email_sync, to_email=mail.to, subject=mail.subject, body=mail.body, html_body=mail.html
    )
    if not result.ok:
        return RemindResult(sent=False, message="The reminder could not be emailed. Check the email settings.")
    return RemindResult(sent=True, message=f"Reminder sent to {mail.to}.")


@router.post("/training-reminders", response_model=RunResult)
async def run_training_reminders(principal: DemoPrincipal = Depends(get_demo_principal)):
    """Run today's due-soon / overdue / renewal reminders now (they also run automatically)."""
    if not principal.is_tenant_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrators only")
    return RunResult(sent=await run_for_tenant(principal.tenant_id))
