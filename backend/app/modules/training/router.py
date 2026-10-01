"""
Training Edition endpoints.

`public_router` serves the public registration page (no sign-in): the program
catalog with open cohorts, and registering for one. `router` is for signed-in
people: learners registering for another program or cancelling an unpaid seat,
and administrators enrolling, confirming and cancelling.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.core.exceptions import AppError, PermissionDeniedError
from app.core.permissions import Role
from app.modules.training.emails import send_registration_emails
from app.modules.training.service import TrainingService


class TooManyRequests(AppError):
    status_code = 429
    error_code = "too_many_requests"


# A small in-process limit on public registrations per client address.
_WINDOW_SECONDS = 3600
_MAX_PER_WINDOW = 20
_recent: dict[str, deque] = defaultdict(deque)


def _throttle(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    hits = _recent[key]
    while hits and now - hits[0] > _WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= _MAX_PER_WINDOW:
        raise TooManyRequests("Too many registrations from this connection. Please try again later.")
    hits.append(now)


class PublicRegistrationIn(BaseModel):
    cohort_id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=40)
    organization: Optional[str] = Field(default=None, max_length=120)


class EnrollIn(BaseModel):
    student_ids: list[str] = Field(min_length=1, max_length=200)
    # False enrolls without an invoice (sponsored places, staff, scholarships).
    charge: bool = True


class CancelIn(BaseModel):
    reason: str = Field(default="", max_length=300)
    refund: bool = False


class ConfirmIn(BaseModel):
    # "offline" (cash / bank transfer received) or "waived".
    method: str = Field(default="offline", pattern="^(offline|waived)$")


public_router = APIRouter()
router = APIRouter()


@public_router.get("/{tenant_code}/catalog")
async def public_catalog(tenant_code: str, db: AsyncSession = Depends(get_db)):
    return await TrainingService(db).public_catalog(tenant_code)


@public_router.post("/{tenant_code}/register")
async def public_register(
    tenant_code: str,
    body: PublicRegistrationIn,
    request: Request,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    _throttle(request)
    result = await TrainingService(db).public_register(
        tenant_code,
        {
            "cohortId": body.cohort_id,
            "name": body.name,
            "email": body.email,
            "phone": body.phone,
            "organization": body.organization,
        },
    )
    tenant_id = result.pop("tenantId")
    if not result.get("alreadyRegistered"):
        background.add_task(send_registration_emails, tenant_id, [result["registrationId"]])
    return result


def _require_admin(principal: DemoPrincipal) -> None:
    if not principal.is_tenant_admin:
        raise PermissionDeniedError("Only administrators can manage cohort enrollment.")


@router.post("/cohorts/{cohort_id}/register")
async def register_me(
    cohort_id: str,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """A signed-in learner registers for a cohort."""
    if principal.role != Role.STUDENT:
        raise PermissionDeniedError("Only learners can register for a cohort.")
    result = await TrainingService(db).self_register(principal.tenant_id, principal.person_id, cohort_id)
    if not result.get("alreadyRegistered"):
        background.add_task(send_registration_emails, principal.tenant_id, [result["registrationId"]])
    return result


@router.post("/cohorts/{cohort_id}/enroll")
async def enroll_learners(
    cohort_id: str,
    body: EnrollIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    _require_admin(principal)
    results = await TrainingService(db).admin_enroll(
        principal.tenant_id, cohort_id, body.student_ids, charge=body.charge
    )
    fresh = [r["registrationId"] for r in results if not r.get("alreadyRegistered")]
    background.add_task(send_registration_emails, principal.tenant_id, fresh)
    return {"results": results}


@router.post("/registrations/{registration_id}/confirm")
async def confirm_registration(
    registration_id: str,
    body: ConfirmIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    _require_admin(principal)
    registration = await TrainingService(db).confirm(principal.tenant_id, registration_id, method=body.method)
    background.add_task(send_registration_emails, principal.tenant_id, [registration_id])
    return registration


@router.post("/registrations/{registration_id}/cancel")
async def cancel_registration(
    registration_id: str,
    body: CancelIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """Administrators cancel any registration; a learner only their own unpaid one."""
    service = TrainingService(db)
    if principal.is_tenant_admin:
        registration = await service.cancel(
            principal.tenant_id, registration_id, reason=body.reason, refund=body.refund
        )
    elif principal.role == Role.STUDENT:
        registration = await service.cancel(
            principal.tenant_id, registration_id, by_person=principal.person_id, reason=body.reason
        )
    else:
        raise PermissionDeniedError("You cannot cancel this registration.")
    background.add_task(send_registration_emails, principal.tenant_id, [registration_id])
    return registration


@router.post("/sync-payments")
async def sync_payments(
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    """Enroll everyone whose registration invoice has been paid (after an admin marks invoices paid)."""
    _require_admin(principal)
    enrolled = await TrainingService(db).sync_paid(principal.tenant_id)
    background.add_task(send_registration_emails, principal.tenant_id, [r["id"] for r in enrolled])
    return {"enrolled": [r["id"] for r in enrolled]}
