"""
Payments module - invoice checkout on the server.

Invoices live in the tenant's `payments` collection. Only this service marks an
invoice paid, and only after the provider confirms it:

- Chapa (ETB gateway) when CHAPA_SECRET_KEY is set: we create a hosted checkout
  and mark the invoice paid only after `verify` re-queries Chapa for the result.
- Demo provider only when DEMO_LOGIN_ENABLED is on: the invoice is settled
  immediately with a DEMO- reference, so stakeholder demos work without a gateway.
- Otherwise online payment is reported as not configured.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.demo_auth import DemoPrincipal
from app.core.exceptions import AppError, NotFoundError, PermissionDeniedError, ValidationAppError
from app.core.permissions import Role
from app.modules.lms_store.service import LmsStoreService

CHAPA_API = "https://api.chapa.co/v1"


class PaymentProviderUnavailable(AppError):
    status_code = 503
    error_code = "payment_provider_unavailable"


def active_provider() -> Optional[str]:
    if settings.CHAPA_SECRET_KEY:
        return "chapa"
    if settings.DEMO_LOGIN_ENABLED:
        return "demo"
    return None


class PaymentsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.store = LmsStoreService(db)

    async def _payer_learner_ids(self, principal: DemoPrincipal) -> set[str]:
        if principal.role not in (Role.STUDENT, Role.PARENT_GUARDIAN):
            raise PermissionDeniedError("Only students and guardians can pay invoices online")
        ctx = self.store.scope_context(principal.tenant_id, principal.person_id, principal.role)
        return await ctx.learner_ids()

    async def _load_invoices(self, tenant_id: uuid.UUID) -> list[dict[str, Any]]:
        row = await self.store.repo.get(tenant_id, "payments", for_update=True)
        return list(row.data) if row is not None and isinstance(row.data, list) else []

    async def _save_invoice(self, tenant_id: uuid.UUID, invoices: list, invoice: dict) -> dict:
        updated = [invoice if isinstance(i, dict) and i.get("id") == invoice["id"] else i for i in invoices]
        await self.store.repo.upsert(tenant_id, "payments", updated)
        await self.db.commit()
        return invoice

    async def checkout(self, principal: DemoPrincipal, invoice_id: str, return_url: str) -> dict[str, Any]:
        learners = await self._payer_learner_ids(principal)
        invoices = await self._load_invoices(principal.tenant_id)
        invoice = next((i for i in invoices if isinstance(i, dict) and i.get("id") == invoice_id), None)
        if not invoice or invoice.get("studentId") not in learners:
            raise NotFoundError("Invoice not found")
        if invoice.get("status") == "paid":
            raise ValidationAppError("This invoice is already paid")

        provider = active_provider()
        if provider is None:
            raise PaymentProviderUnavailable(
                "Online payment is not configured for this institution. Please pay at the finance office."
            )

        now = datetime.now(timezone.utc).isoformat()
        if provider == "demo":
            settled = {
                **invoice,
                "status": "paid",
                "paidAt": now,
                "method": "demo",
                "paymentReference": f"DEMO-{uuid.uuid4().hex[:10].upper()}",
            }
            await self._save_invoice(principal.tenant_id, invoices, settled)
            return {"status": "paid", "provider": "demo", "invoice": settled, "checkout_url": None}

        tx_ref = f"berana-{invoice_id}-{uuid.uuid4().hex[:8]}"
        me = await self.store.scope_context(principal.tenant_id, principal.person_id, principal.role).me()
        name = str((me or {}).get("name") or "Berana Learner").split(" ", 1)
        body = {
            "amount": str(invoice.get("amount")),
            "currency": invoice.get("currency") or "ETB",
            "email": (me or {}).get("email") or None,
            "first_name": name[0],
            "last_name": name[1] if len(name) > 1 else "",
            "tx_ref": tx_ref,
            "return_url": f"{return_url}{'&' if '?' in return_url else '?'}tx_ref={tx_ref}",
            "customization": {"title": "Berana LMS", "description": str(invoice.get("label", ""))[:50]},
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{CHAPA_API}/transaction/initialize",
                json=body,
                headers={"Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}"},
            )
        try:
            data = response.json() or {}
        except ValueError:
            data = {}
        checkout_url = (data.get("data") or {}).get("checkout_url")
        if response.status_code >= 400 or not checkout_url:
            raise PaymentProviderUnavailable("The payment provider could not start checkout. Try again later.")

        pending = {**invoice, "checkoutRef": tx_ref, "checkoutStartedAt": now}
        await self._save_invoice(principal.tenant_id, invoices, pending)
        return {"status": "redirect", "provider": "chapa", "invoice": pending, "checkout_url": checkout_url}

    async def verify(self, principal: DemoPrincipal, tx_ref: str) -> dict[str, Any]:
        """Confirm a Chapa checkout with Chapa itself before marking the invoice paid."""
        learners = await self._payer_learner_ids(principal)
        invoices = await self._load_invoices(principal.tenant_id)
        invoice = next(
            (i for i in invoices if isinstance(i, dict) and i.get("checkoutRef") == tx_ref),
            None,
        )
        if not invoice or invoice.get("studentId") not in learners:
            raise NotFoundError("Payment not found")
        if invoice.get("status") == "paid":
            return {"status": "paid", "invoice": invoice}
        if not settings.CHAPA_SECRET_KEY:
            raise PaymentProviderUnavailable("Online payment is not configured")

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{CHAPA_API}/transaction/verify/{tx_ref}",
                headers={"Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}"},
            )
        try:
            data = (response.json() or {}).get("data") or {}
        except ValueError:
            data = {}
        paid = (
            response.status_code == 200
            and data.get("status") == "success"
            and float(data.get("amount") or 0) >= float(invoice.get("amount") or 0)
            and (data.get("currency") or invoice.get("currency")) == (invoice.get("currency") or "ETB")
        )
        if not paid:
            return {"status": "pending", "invoice": invoice}

        settled = {
            **invoice,
            "status": "paid",
            "paidAt": datetime.now(timezone.utc).isoformat(),
            "method": "chapa",
            "paymentReference": data.get("reference") or tx_ref,
        }
        await self._save_invoice(principal.tenant_id, invoices, settled)
        return {"status": "paid", "invoice": settled}
