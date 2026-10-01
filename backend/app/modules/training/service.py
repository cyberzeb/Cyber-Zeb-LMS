"""
Training Edition registration and cohort enrollment.

Everything that decides who holds a seat runs here, on the server: the public
registration page, a signed-in learner registering for another program, and an
administrator enrolling people by hand. A paid program creates an invoice; once
it is paid (online through the payments checkout, or marked paid by an
administrator) the learner is enrolled in every course of the program.
"""
from __future__ import annotations

import re
import secrets
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ValidationAppError
from app.core.permissions import Role
from app.modules.lms_store.service import LmsStoreService
from app.modules.tenants.models import TenantStatus
from app.modules.training import logic

Record = dict[str, Any]

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SYSTEM = "system:training"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    return "".join(p[0] for p in parts[:2]).upper() or "?"


class TrainingService:
    def __init__(self, db: AsyncSession, today: Optional[date] = None):
        self.db = db
        self.store = LmsStoreService(db)
        self.today = today or date.today()

    # ── Loading and saving ────────────────────────────────────────────────────

    async def _load(self, tenant_id: uuid.UUID, *keys: str) -> dict[str, Any]:
        return {key: await self.store.get_collection(tenant_id, key) for key in keys}

    async def _save(self, tenant_id: uuid.UUID, key: str, upserts: list[Record], deletes: Optional[list[str]] = None) -> None:
        if not upserts and not deletes:
            return
        # These writes are decided by the rules in this service, so they run as
        # the system rather than through the per-role policy.
        await self.store.patch_collection(
            tenant_id,
            key,
            role=Role.INSTITUTION_ADMIN,
            person_id=SYSTEM,
            is_admin=True,
            upserts=[(record, None) for record in upserts],
            deletes=deletes or [],
            set_entries={},
            unset_keys=[],
        )

    async def training_tenant(self, tenant_code: str):
        tenant = await self.store.tenant_repo.get_by_code(tenant_code.strip().lower())
        if not tenant or getattr(tenant, "status", None) != TenantStatus.ACTIVE:
            raise NotFoundError("This training provider was not found.")
        if await self.store.edition(tenant.id) != "training":
            raise NotFoundError("This institution does not take public registrations.")
        return tenant

    # ── Public catalog ────────────────────────────────────────────────────────

    async def public_catalog(self, tenant_code: str) -> dict[str, Any]:
        """Programs with their open cohorts. No personal data."""
        tenant = await self.training_tenant(tenant_code)
        data = await self._load(tenant.id, "training-programs", "cohorts", "cohort-registrations", "courses", "people", "settings")
        registrations = logic.records(data["cohort-registrations"])
        courses = logic.by_id(data["courses"])
        people = logic.by_id(data["people"])
        general = (data["settings"] or {}).get("general") if isinstance(data["settings"], dict) else None
        name = (general or {}).get("name") or tenant.name

        programs = []
        for program in logic.records(data["training-programs"]):
            if program.get("status") not in (None, "", "active"):
                continue
            cohorts = []
            for cohort in logic.records(data["cohorts"]):
                if cohort.get("programId") != program.get("id"):
                    continue
                if cohort.get("status") == "cancelled" or logic.cohort_state(cohort, self.today) == "completed":
                    continue
                trainer = people.get(str(cohort.get("trainerId") or ""))
                reason = logic.registration_closed_reason(cohort, program, registrations, self.today)
                cohorts.append(
                    {
                        "id": cohort.get("id"),
                        "name": cohort.get("name"),
                        "startDate": cohort.get("startDate"),
                        "endDate": cohort.get("endDate"),
                        "schedule": cohort.get("schedule"),
                        "location": cohort.get("location"),
                        "deliveryMode": cohort.get("deliveryMode"),
                        "trainerName": (trainer or {}).get("name"),
                        "seatsLeft": logic.seats_left(cohort, registrations, self.today),
                        "price": logic.cohort_price(cohort, program),
                        "currency": logic.cohort_currency(cohort, program),
                        "registrationDeadline": cohort.get("registrationDeadline"),
                        "open": reason is None,
                        "closedReason": reason,
                    }
                )
            cohorts.sort(key=lambda c: str(c.get("startDate") or ""))
            programs.append(
                {
                    "id": program.get("id"),
                    "code": program.get("code"),
                    "name": program.get("name"),
                    "description": program.get("description"),
                    "level": program.get("level"),
                    "deliveryMode": program.get("deliveryMode"),
                    "durationWeeks": program.get("durationWeeks"),
                    "totalHours": program.get("totalHours"),
                    "credentialType": program.get("credentialType"),
                    "skills": program.get("skills") or [],
                    "price": logic.cohort_price({}, program),
                    "currency": logic.cohort_currency({}, program),
                    "courses": [
                        {"code": courses[c].get("code"), "title": courses[c].get("title")}
                        for c in program.get("courseIds") or []
                        if c in courses
                    ],
                    "cohorts": cohorts,
                }
            )
        return {"tenantCode": tenant.code, "organizationName": name, "programs": programs}

    # ── Registration ──────────────────────────────────────────────────────────

    async def public_register(self, tenant_code: str, payload: Record) -> Record:
        tenant = await self.training_tenant(tenant_code)
        name = " ".join(str(payload.get("name") or "").split())[:120]
        email = str(payload.get("email") or "").strip().lower()[:200]
        phone = str(payload.get("phone") or "").strip()[:40]
        organization = str(payload.get("organization") or "").strip()[:120]
        if len(name) < 2:
            raise ValidationAppError("Please enter your full name.")
        if not EMAIL_PATTERN.match(email):
            raise ValidationAppError("Please enter a valid email address.")

        people = logic.records(await self.store.get_collection(tenant.id, "people"))
        person = next((p for p in people if str(p.get("email", "")).strip().lower() == email), None)
        if person and person.get("role") != "Student":
            raise ConflictError("This email belongs to a staff account. Please register with a personal email.")
        if person and person.get("status") == "suspended":
            raise PermissionDeniedError("This account is suspended. Please contact the training provider.")

        # Check the cohort before creating an account, so a closed cohort leaves nothing behind.
        await self._open_cohort(tenant.id, str(payload.get("cohortId") or ""))
        if person is None:
            person = {
                "id": f"lrn-{secrets.token_hex(5)}",
                "name": name,
                "email": email,
                "phone": phone or None,
                "organization": organization or None,
                "role": "Student",
                "status": "active",
                "verificationStatus": "verified",
                "initials": _initials(name),
                "department": organization or "Independent learner",
                "campusId": "c1",
                "lastActive": "Never",
                "joinedAt": self.today.isoformat(),
                "source": "registration",
            }
            await self._save(tenant.id, "people", [person])
        result = await self.register(
            tenant.id, str(payload.get("cohortId") or ""), person, source="public", phone=phone, organization=organization
        )
        return {**result, "tenantCode": tenant.code, "email": email, "tenantId": str(tenant.id)}

    async def self_register(self, tenant_id: uuid.UUID, person_id: str, cohort_id: str) -> Record:
        people = logic.by_id(await self.store.get_collection(tenant_id, "people"))
        person = people.get(person_id)
        if not person or person.get("role") != "Student":
            raise PermissionDeniedError("Only learners can register for a cohort.")
        return await self.register(tenant_id, cohort_id, person, source="self")

    async def _open_cohort(self, tenant_id: uuid.UUID, cohort_id: str) -> tuple[Record, Record]:
        data = await self._load(tenant_id, "training-programs", "cohorts", "cohort-registrations")
        cohort = logic.by_id(data["cohorts"]).get(cohort_id)
        program = logic.by_id(data["training-programs"]).get(str((cohort or {}).get("programId")))
        reason = logic.registration_closed_reason(cohort, program, logic.records(data["cohort-registrations"]), self.today)
        if reason:
            raise ValidationAppError(reason)
        assert cohort is not None and program is not None
        return cohort, program

    async def register(
        self,
        tenant_id: uuid.UUID,
        cohort_id: str,
        person: Record,
        *,
        source: str,
        charge: bool = True,
        check_open: bool = True,
        phone: str = "",
        organization: str = "",
    ) -> Record:
        """Hold a seat for one learner. Paid programs get an invoice; free ones enroll at once."""
        data = await self._load(tenant_id, "training-programs", "cohorts", "cohort-registrations")
        registrations = logic.records(data["cohort-registrations"])
        cohort = logic.by_id(data["cohorts"]).get(cohort_id)
        program = logic.by_id(data["training-programs"]).get(str((cohort or {}).get("programId")))
        existing = logic.active_registration(registrations, cohort_id, str(person.get("id")), self.today)
        if existing:
            return self._summary(existing, program, cohort, already=True)
        if check_open:
            reason = logic.registration_closed_reason(cohort, program, registrations, self.today)
        else:
            reason = None if cohort and program else "This cohort does not exist."
            left = logic.seats_left(cohort, registrations, self.today) if cohort else None
            if reason is None and left is not None and left <= 0:
                reason = f"{cohort.get('name', 'This cohort')} is full. Raise its seat limit first."
        if reason:
            raise ValidationAppError(reason)
        assert cohort is not None and program is not None

        amount = logic.cohort_price(cohort, program) if charge else 0.0
        currency = logic.cohort_currency(cohort, program)
        registration: Record = {
            "id": f"reg-{secrets.token_hex(6)}",
            "cohortId": cohort_id,
            "programId": program.get("id"),
            "studentId": person.get("id"),
            "studentName": person.get("name", ""),
            "studentEmail": person.get("email", ""),
            "phone": phone or person.get("phone") or None,
            "organization": organization or person.get("organization") or None,
            "source": source,
            "amount": amount,
            "currency": currency,
            "createdAt": self.today.isoformat(),
            "registeredAt": _now(),
        }
        if amount > 0:
            invoice = logic.invoice_for(registration, program, cohort, amount, currency, self.today)
            registration.update({"status": "pending_payment", "invoiceId": invoice["id"]})
            await self._save(tenant_id, "payments", [invoice])
            await self._save(tenant_id, "cohort-registrations", [registration])
        else:
            registration.update({"status": "pending_payment"})
            await self._save(tenant_id, "cohort-registrations", [registration])
            registration = await self._enroll(tenant_id, registration, method="free" if charge else "waived")
        return self._summary(registration, program, cohort)

    def _summary(self, registration: Record, program: Optional[Record], cohort: Optional[Record], already: bool = False) -> Record:
        return {
            "registrationId": registration.get("id"),
            "status": registration.get("status"),
            "amount": registration.get("amount", 0),
            "currency": registration.get("currency", "ETB"),
            "invoiceId": registration.get("invoiceId"),
            "programName": (program or {}).get("name"),
            "cohortName": (cohort or {}).get("name"),
            "startDate": (cohort or {}).get("startDate"),
            "studentId": registration.get("studentId"),
            "alreadyRegistered": already,
        }

    async def _enroll(self, tenant_id: uuid.UUID, registration: Record, *, method: str) -> Record:
        """Confirm the seat and enroll the learner in every course of the program."""
        data = await self._load(tenant_id, "training-programs", "cohorts", "courses", "enrollments")
        cohort = logic.by_id(data["cohorts"]).get(str(registration.get("cohortId")))
        program = logic.by_id(data["training-programs"]).get(str(registration.get("programId")))
        if not cohort or not program:
            raise NotFoundError("The cohort for this registration no longer exists.")
        rows = logic.enrollment_rows(
            registration, program, cohort, logic.by_id(data["courses"]), logic.records(data["enrollments"]), self.today
        )
        await self._save(tenant_id, "enrollments", rows)
        confirmed = {**registration, "status": "enrolled", "confirmedAt": _now(), "confirmedBy": method}
        await self._save(tenant_id, "cohort-registrations", [confirmed])
        return confirmed

    # ── Payment and administration ────────────────────────────────────────────

    async def sync_paid(self, tenant_id: uuid.UUID) -> list[Record]:
        """Enroll every learner whose registration invoice is now paid. Safe to repeat."""
        data = await self._load(tenant_id, "cohort-registrations", "payments")
        invoices = logic.by_id(data["payments"])
        enrolled = []
        for registration in logic.records(data["cohort-registrations"]):
            if registration.get("status") != "pending_payment":
                continue
            invoice = invoices.get(str(registration.get("invoiceId") or ""))
            if invoice and invoice.get("status") == "paid":
                enrolled.append(await self._enroll(tenant_id, registration, method=str(invoice.get("method") or "paid")))
        return enrolled

    async def _registration(self, tenant_id: uuid.UUID, registration_id: str) -> Record:
        registration = logic.by_id(await self.store.get_collection(tenant_id, "cohort-registrations")).get(registration_id)
        if not registration:
            raise NotFoundError("Registration not found.")
        return registration

    async def admin_enroll(self, tenant_id: uuid.UUID, cohort_id: str, student_ids: list[str], *, charge: bool) -> list[Record]:
        people = logic.by_id(await self.store.get_collection(tenant_id, "people"))
        results = []
        for student_id in dict.fromkeys(student_ids):
            person = people.get(student_id)
            if not person or person.get("role") != "Student":
                raise ValidationAppError(f"{student_id} is not a learner.")
            results.append(await self.register(tenant_id, cohort_id, person, source="admin", charge=charge, check_open=False))
        return results

    async def confirm(self, tenant_id: uuid.UUID, registration_id: str, *, method: str = "offline") -> Record:
        """An administrator records payment received in person (or waives the fee)."""
        registration = await self._registration(tenant_id, registration_id)
        if registration.get("status") == "enrolled":
            return registration
        if registration.get("status") != "pending_payment":
            raise ValidationAppError("Only a registration awaiting payment can be confirmed.")
        invoice_id = registration.get("invoiceId")
        if invoice_id:
            invoice = logic.by_id(await self.store.get_collection(tenant_id, "payments")).get(str(invoice_id))
            if invoice and invoice.get("status") != "paid":
                paid = {
                    **invoice,
                    "status": "paid",
                    "paidAt": _now(),
                    "method": method,
                    "paymentReference": f"{method.upper()}-{secrets.token_hex(4).upper()}",
                }
                await self._save(tenant_id, "payments", [paid])
        return await self._enroll(tenant_id, registration, method=method)

    async def cancel(
        self,
        tenant_id: uuid.UUID,
        registration_id: str,
        *,
        by_person: Optional[str] = None,
        reason: str = "",
        refund: bool = False,
    ) -> Record:
        """
        Release the seat. A learner may only cancel their own unpaid registration;
        an administrator may also withdraw an enrolled learner.
        """
        registration = await self._registration(tenant_id, registration_id)
        if by_person is not None:
            if registration.get("studentId") != by_person:
                raise NotFoundError("Registration not found.")
            if registration.get("status") != "pending_payment":
                raise PermissionDeniedError("Contact the training provider to withdraw from a paid cohort.")
        if registration.get("status") == "cancelled":
            return registration

        invoice_id = str(registration.get("invoiceId") or "")
        invoice = logic.by_id(await self.store.get_collection(tenant_id, "payments")).get(invoice_id) if invoice_id else None
        if invoice and invoice.get("status") != "paid":
            await self._save(tenant_id, "payments", [], deletes=[invoice_id])
        elif invoice and refund:
            await self._save(tenant_id, "payments", [{**invoice, "status": "refunded", "refundedAt": _now()}])

        if registration.get("status") == "enrolled":
            enrollments = logic.records(await self.store.get_collection(tenant_id, "enrollments"))
            withdrawn = [
                {**e, "status": "withdrawn", "withdrawnOn": self.today.isoformat()}
                for e in enrollments
                if e.get("registrationId") == registration_id and e.get("status") != "withdrawn"
            ]
            await self._save(tenant_id, "enrollments", withdrawn)

        cancelled = {
            **registration,
            "status": "cancelled",
            "cancelledAt": _now(),
            "cancelledBy": "learner" if by_person else "admin",
            "cancelReason": reason[:300] or None,
        }
        await self._save(tenant_id, "cohort-registrations", [cancelled])
        return cancelled
