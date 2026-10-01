"""
Payments, Billing and Financial Controls module - FastAPI router.

Blueprint reference: Section 13 (Payments, Billing and Financial Controls)
"""
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.modules.payments.service import PaymentsService, active_provider
from app.modules.training.emails import send_registration_emails
from app.modules.training.service import TrainingService

router = APIRouter()


class CheckoutIn(BaseModel):
    # Where the provider sends the payer back (the portal payments page).
    return_path: str = "/student/payments"


class CheckoutOut(BaseModel):
    status: str
    provider: Optional[str] = None
    checkout_url: Optional[str] = None
    invoice: dict[str, Any]


@router.get("/provider")
async def payment_provider(_principal: DemoPrincipal = Depends(get_demo_principal)):
    """Which online payment option the portal should offer (chapa, demo or none)."""
    return {"provider": active_provider()}


@router.post("/invoices/{invoice_id}/checkout", response_model=CheckoutOut)
async def checkout_invoice(
    invoice_id: str,
    payload: CheckoutIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    path = payload.return_path if payload.return_path.startswith("/") else "/student/payments"
    return_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}{path}"
    result = await PaymentsService(db).checkout(principal, invoice_id, return_url)
    await _after_payment(db, principal, result, background)
    return result


@router.post("/checkout/{tx_ref}/verify", response_model=CheckoutOut)
async def verify_checkout(
    tx_ref: str,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    result = await PaymentsService(db).verify(principal, tx_ref)
    await _after_payment(db, principal, result, background)
    return result


async def _after_payment(db: AsyncSession, principal: DemoPrincipal, result: dict, background: BackgroundTasks) -> None:
    """A paid cohort registration fee confirms the learner's seat and enrolls them."""
    if result.get("status") != "paid" or not (result.get("invoice") or {}).get("registrationId"):
        return
    enrolled = await TrainingService(db).sync_paid(principal.tenant_id)
    if enrolled:
        background.add_task(send_registration_emails, principal.tenant_id, [r["id"] for r in enrolled])
