"""
Payments, Billing and Financial Controls module - FastAPI router.

Blueprint reference: Section 13 (Payments, Billing and Financial Controls)
"""
from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal
from app.modules.payments.service import PaymentsService, active_provider

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
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    path = payload.return_path if payload.return_path.startswith("/") else "/student/payments"
    return_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}{path}"
    return await PaymentsService(db).checkout(principal, invoice_id, return_url)


@router.post("/checkout/{tx_ref}/verify", response_model=CheckoutOut)
async def verify_checkout(
    tx_ref: str,
    db: AsyncSession = Depends(get_db),
    principal: DemoPrincipal = Depends(get_demo_principal),
):
    return await PaymentsService(db).verify(principal, tx_ref)
