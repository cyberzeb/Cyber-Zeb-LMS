"""
Onboarding business logic: public service requests and Super Admin
state machine (new → invoice_sent → payment_confirmed → activated).
"""
from __future__ import annotations

import logging
import re
import secrets
import string
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationAppError
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.onboarding.constants import ALWAYS_ON_MODULES, MODULE_LABELS, ModuleKey, module_labels
from app.modules.onboarding.email_service import (
    build_invoice_email,
    build_super_admin_alert,
    build_welcome_email,
    persist_email_log,
    send_email_sync,
)
from app.modules.onboarding.models import (
    AddOnModuleRequest,
    EmailStatus,
    EmailType,
    InstitutionAdminAccount,
    ModuleCatalogItem,
    PlatformActorType,
    PlatformAdminRole,
    PlatformAdminUser,
    PlatformAuditLog,
    PlatformSetting,
    RequestKind,
    ServiceRequest,
    ServiceRequestStatus,
    SiteContentBlock,
)
from app.modules.onboarding.repository import OnboardingRepository
from app.modules.onboarding.schemas import (
    AddOnModuleRequestCreate,
    AddOnModuleRequestOut,
    ActivateResponse,
    AnnouncementCreate,
    AnnouncementOut,
    InstitutionDetailOut,
    InstitutionListItemOut,
    InvitePlatformAdminBody,
    ModuleCatalogItemOut,
    ModuleCatalogPatch,
    ModuleCatalogUpsert,
    OverviewActivityItem,
    OverviewRecentRequest,
    PlatformAdminUserOut,
    PlatformAuditLogListOut,
    PlatformAuditLogOut,
    PlatformSettingOut,
    PlatformSettingPatch,
    RenewalTenantOut,
    SendInvoiceBody,
    ServiceRequestCreate,
    ServiceRequestOut,
    SiteContentBlockCreate,
    SiteContentBlockOut,
    SiteContentBlockPatch,
    SuperAdminLoginRequest,
    SuperAdminOverviewOut,
    SuperAdminTokenResponse,
    TenantActivationOut,
)
from app.modules.tenants.models import Tenant, TenantStatus, TenantType

EDITABLE_PLATFORM_SETTINGS: dict[str, str] = {
    "SUPER_ADMIN_NOTIFY_EMAIL": "Email address notified when a new service request arrives",
    "PUBLIC_BASE_DOMAIN": "Public base domain used to build institution links",
}

AUDIT_ACTION_LABELS: dict[str, str] = {
    "service_request.created": "New service request created",
    "service_request.invoice_sent": "Invoice sent",
    "service_request.payment_confirmed": "Payment confirmed",
    "service_request.rejected": "Service request rejected",
    "service_request.email_resent": "Email resent",
    "tenant.activated": "Tenant activated",
    "tenant.renewed": "Tenant renewed",
    "addon_request.created": "Add-on request created",
    "addon_request.invoice_sent": "Add-on invoice sent",
    "addon_request.payment_confirmed": "Add-on payment confirmed",
    "addon_request.activated": "Add-on modules activated",
    "addon_request.email_resent": "Add-on email resent",
    "module_catalog.created": "Module catalog item created",
    "module_catalog.updated": "Module catalog item updated",
    "platform_admin.login": "Super admin signed in",
    "platform_admin.invited": "Super admin invited",
    "site_content.created": "Landing content created",
    "site_content.updated": "Landing content updated",
    "platform_setting.updated": "Platform setting updated",
}

logger = logging.getLogger(__name__)
RESERVED_SUBDOMAINS = {"www", "api", "admin", "super-admin", "app", "mail", "blog"}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower().strip())
    slug = re.sub(r"(^-|-$)", "", slug)[:48]
    return slug or "institution"


def _generate_temp_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _institution_link(slug: str, base_domain: str | None = None) -> str:
    domain = (base_domain or settings.PUBLIC_BASE_DOMAIN).strip().removeprefix("https://").removeprefix("http://").rstrip("/")
    scheme = "http" if domain.endswith("localhost") or ".localhost" in domain else "https"
    return f"{scheme}://{slug}.{domain}"


def _tenant_out(tenant: Tenant) -> TenantActivationOut:
    slug = tenant.slug or tenant.code
    return TenantActivationOut(
        id=tenant.id,
        name=tenant.name,
        slug=slug,
        enabled_modules=list(tenant.enabled_modules or []),
        status=tenant.status.value if hasattr(tenant.status, "value") else str(tenant.status),
        institution_link=_institution_link(slug),
        renewal_date=tenant.renewal_date,
    )


DEFAULT_MODULE_DESCRIPTIONS: dict[ModuleKey, str] = {
    ModuleKey.TENANT_INSTITUTION_MGMT: "Tenant setup, branding, organizational structure and feature flags.",
    ModuleKey.IDENTITY_ACCESS: "Login, roles, permissions and account lifecycle.",
    ModuleKey.USER_PROFILES: "Learner, instructor, staff, parent and manager profiles.",
    ModuleKey.ACADEMIC_STRUCTURE: "Programs, terms, cohorts, sections and curriculum structure.",
    ModuleKey.COURSE_CATALOG_AUTHORING: "Course templates, lessons, outcomes and publishing workflow.",
    ModuleKey.CONTENT_MANAGEMENT: "Documents, media, links, packages and versioned content.",
    ModuleKey.ENROLLMENT_COHORTS: "Manual, bulk, invitation, cohort and rule-based enrollment.",
    ModuleKey.VIRTUAL_CLASSROOM: "Zoom scheduling, joining, recordings and attendance evidence.",
    ModuleKey.ATTENDANCE: "Session attendance, corrections, alerts and reports.",
    ModuleKey.ASSIGNMENTS_ASSESSMENTS: "Assignments, quizzes, question banks, rubrics and grading.",
    ModuleKey.GRADEBOOK_PROGRESS: "Weighted grades, progress, completion and transcript outputs.",
    ModuleKey.COMMUNICATION_NOTIFICATIONS: "Announcements, messages, email/SMS/push and support notices.",
    ModuleKey.PAYMENTS_BILLING: "Prices, invoices, checkout adapters and reconciliation controls.",
    ModuleKey.CERTIFICATES_CREDENTIALS: "Templates, issuing, verification, QR codes and expiry.",
    ModuleKey.PARENT_MANAGER_PORTAL: "Linked learner visibility for parents, guardians and managers.",
    ModuleKey.REPORTS_ANALYTICS: "Academic, engagement, finance and operational reporting.",
    ModuleKey.AI_SERVICES: "Controlled recommendations, risk indicators and assistant services.",
    ModuleKey.IOT_PHYSICAL_INTEGRATION: "Smart attendance, devices, kiosks and physical integrations.",
    ModuleKey.INTEGRATION_HUB_API: "SSO, Zoom, SIS/HR, LTI, webhooks and sync health.",
    ModuleKey.ADMINISTRATION_SUPPORT: "Settings, audit, help desk, localization, retention and backups.",
}

DEFAULT_MODULE_PRICES: dict[ModuleKey, Decimal] = {
    ModuleKey.TENANT_INSTITUTION_MGMT: Decimal("0"),
    ModuleKey.IDENTITY_ACCESS: Decimal("0"),
    ModuleKey.USER_PROFILES: Decimal("250"),
    ModuleKey.ACADEMIC_STRUCTURE: Decimal("400"),
    ModuleKey.COURSE_CATALOG_AUTHORING: Decimal("600"),
    ModuleKey.CONTENT_MANAGEMENT: Decimal("500"),
    ModuleKey.ENROLLMENT_COHORTS: Decimal("350"),
    ModuleKey.VIRTUAL_CLASSROOM: Decimal("450"),
    ModuleKey.ATTENDANCE: Decimal("300"),
    ModuleKey.ASSIGNMENTS_ASSESSMENTS: Decimal("500"),
    ModuleKey.GRADEBOOK_PROGRESS: Decimal("450"),
    ModuleKey.COMMUNICATION_NOTIFICATIONS: Decimal("250"),
    ModuleKey.PAYMENTS_BILLING: Decimal("350"),
    ModuleKey.CERTIFICATES_CREDENTIALS: Decimal("250"),
    ModuleKey.PARENT_MANAGER_PORTAL: Decimal("300"),
    ModuleKey.REPORTS_ANALYTICS: Decimal("550"),
    ModuleKey.AI_SERVICES: Decimal("700"),
    ModuleKey.IOT_PHYSICAL_INTEGRATION: Decimal("650"),
    ModuleKey.INTEGRATION_HUB_API: Decimal("500"),
    ModuleKey.ADMINISTRATION_SUPPORT: Decimal("300"),
}


def serialize_service_request(
    sr: ServiceRequest,
    tenant: Tenant | None = None,
    *,
    estimated_total: Decimal | None = None,
    estimated_currency: str | None = None,
) -> ServiceRequestOut:
    return ServiceRequestOut(
        id=sr.id,
        institution_name=sr.institution_name,
        request_kind=sr.request_kind,
        institution_type=sr.institution_type,
        contact_name=sr.contact_name,
        email=sr.email,
        phone=sr.phone,
        estimated_users=sr.estimated_users,
        preferred_slug=sr.preferred_slug,
        requested_modules=list(sr.requested_modules or []),
        message=sr.message,
        status=sr.status,
        invoice_amount=sr.invoice_amount,
        invoice_currency=sr.invoice_currency,
        invoice_notes=sr.invoice_notes,
        invoice_sent_at=sr.invoice_sent_at,
        payment_confirmed_at=sr.payment_confirmed_at,
        payment_confirmed_by=sr.payment_confirmed_by,
        activated_at=sr.activated_at,
        rejected_at=sr.rejected_at,
        rejection_reason=sr.rejection_reason,
        last_email_error=sr.last_email_error,
        estimated_total=estimated_total,
        estimated_currency=estimated_currency,
        created_at=sr.created_at,
        updated_at=sr.updated_at,
        tenant=_tenant_out(tenant) if tenant else None,
        email_logs=list(sr.email_logs or []),
    )


def serialize_addon_request(
    req: AddOnModuleRequest,
    tenant: Tenant,
    *,
    estimated_total: Decimal | None = None,
    estimated_currency: str | None = None,
) -> AddOnModuleRequestOut:
    return AddOnModuleRequestOut(
        id=req.id,
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        tenant_slug=tenant.slug or tenant.code,
        contact_name=req.contact_name,
        email=req.email,
        phone=req.phone,
        requested_modules=list(req.requested_modules or []),
        message=req.message,
        status=req.status,
        invoice_amount=req.invoice_amount,
        invoice_currency=req.invoice_currency,
        invoice_notes=req.invoice_notes,
        invoice_sent_at=req.invoice_sent_at,
        payment_confirmed_at=req.payment_confirmed_at,
        payment_confirmed_by=req.payment_confirmed_by,
        activated_at=req.activated_at,
        rejected_at=req.rejected_at,
        rejection_reason=req.rejection_reason,
        last_email_error=req.last_email_error,
        estimated_total=estimated_total,
        estimated_currency=estimated_currency,
        created_at=req.created_at,
        updated_at=req.updated_at,
        email_logs=list(req.email_logs or []),
    )


def _audit_summary(action: str, after: dict | None) -> str:
    label = AUDIT_ACTION_LABELS.get(action, action.replace(".", " ").replace("_", " "))
    if not after:
        return label
    if action == "tenant.activated" and after.get("slug"):
        return f"Tenant {after['slug']} activated"
    if action == "tenant.renewed" and after.get("renewal_date"):
        return f"Tenant renewed through {after['renewal_date']}"
    if action == "service_request.created" and after.get("institution_name"):
        return f"Service request for {after['institution_name']} created"
    if after.get("institution_name"):
        return f"{label} — {after['institution_name']}"
    if after.get("key"):
        return f"{label} ({after['key']})"
    if after.get("email"):
        return f"{label} — {after['email']}"
    return label


class OnboardingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OnboardingRepository(db)

    async def _sr_out(
        self, sr: ServiceRequest, tenant: Tenant | None = None
    ) -> ServiceRequestOut:
        total, currency = await self.calculate_module_total(list(sr.requested_modules or []))
        return serialize_service_request(
            sr, tenant, estimated_total=total, estimated_currency=currency
        )

    async def _addon_out(
        self, req: AddOnModuleRequest, tenant: Tenant
    ) -> AddOnModuleRequestOut:
        total, currency = await self.calculate_module_total(list(req.requested_modules or []))
        return serialize_addon_request(
            req, tenant, estimated_total=total, estimated_currency=currency
        )

    async def _resolve_invoice_amount(
        self, body: SendInvoiceBody, module_keys: list[str]
    ) -> tuple[Decimal, str]:
        estimated_total, estimated_currency = await self.calculate_module_total(module_keys)
        amount = body.invoice_amount
        if amount is None or amount <= 0:
            amount = estimated_total
        if amount <= 0:
            raise ValidationAppError(
                "Invoice amount is required when the calculated module estimate is zero"
            )
        currency = (body.invoice_currency or estimated_currency or "USD").upper()
        return amount, currency

    async def _audit(
        self,
        *,
        actor_type: PlatformActorType,
        actor_id: uuid.UUID | None,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID,
        before: dict | None,
        after: dict | None,
        correlation_id: str | None,
    ) -> None:
        await self.repo.write_platform_audit(
            PlatformAuditLog(
                actor_type=actor_type,
                actor_id=actor_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                before=before,
                after=after,
                correlation_id=correlation_id,
            )
        )

    async def ensure_default_module_catalog(self) -> None:
        existing_items = await self.repo.list_module_catalog(active_only=False)
        existing_keys = {item.key for item in existing_items}
        changed = False
        for key in ModuleKey:
            if key.value in existing_keys:
                continue
            self.db.add(
                ModuleCatalogItem(
                    key=key.value,
                    display_name=MODULE_LABELS[key],
                    description=DEFAULT_MODULE_DESCRIPTIONS[key],
                    annual_price=DEFAULT_MODULE_PRICES[key],
                    currency="USD",
                    is_active=True,
                    is_core=key in ALWAYS_ON_MODULES,
                )
            )
            changed = True
        if changed:
            await self.db.commit()

    async def list_module_catalog(self, *, active_only: bool) -> list[ModuleCatalogItemOut]:
        await self.ensure_default_module_catalog()
        items = await self.repo.list_module_catalog(active_only=active_only)
        return [ModuleCatalogItemOut.model_validate(item) for item in items]

    async def create_module_catalog_item(
        self,
        payload: ModuleCatalogUpsert,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ModuleCatalogItemOut:
        existing = await self.repo.get_module_catalog_by_key(payload.key)
        if existing:
            raise ValidationAppError("Module key already exists")
        item = ModuleCatalogItem(
            key=payload.key,
            display_name=payload.display_name,
            description=payload.description,
            annual_price=payload.annual_price,
            currency=payload.currency.upper(),
            is_active=payload.is_active,
            is_core=payload.is_core,
        )
        self.db.add(item)
        await self.db.flush()
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="module_catalog.created",
            entity_type="ModuleCatalogItem",
            entity_id=item.id,
            before=None,
            after={"key": item.key, "annual_price": str(item.annual_price)},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        return ModuleCatalogItemOut.model_validate(item)

    async def update_module_catalog_item(
        self,
        item_id: uuid.UUID,
        payload: ModuleCatalogPatch,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ModuleCatalogItemOut:
        item = await self.repo.get_module_catalog_item(item_id)
        if not item:
            raise NotFoundError("Module catalog item not found")
        before = {
            "display_name": item.display_name,
            "description": item.description,
            "annual_price": str(item.annual_price),
            "currency": item.currency,
            "is_active": item.is_active,
        }
        updates = payload.model_dump(exclude_unset=True)
        for field, value in updates.items():
            if field == "currency" and isinstance(value, str):
                value = value.upper()
            setattr(item, field, value)
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="module_catalog.updated",
            entity_type="ModuleCatalogItem",
            entity_id=item.id,
            before=before,
            after={
                "display_name": item.display_name,
                "description": item.description,
                "annual_price": str(item.annual_price),
                "currency": item.currency,
                "is_active": item.is_active,
            },
            correlation_id=correlation_id,
        )
        await self.db.commit()
        return ModuleCatalogItemOut.model_validate(item)

    async def calculate_module_total(self, module_keys: list[str]) -> tuple[Decimal, str]:
        await self.ensure_default_module_catalog()
        items = await self.repo.list_module_catalog(active_only=False)
        by_key = {item.key: item for item in items}
        total = Decimal("0")
        currency = "USD"
        for key in module_keys:
            item = by_key.get(key)
            if item:
                total += item.annual_price
                currency = item.currency
        return total, currency

    async def login_super_admin(self, payload: SuperAdminLoginRequest) -> SuperAdminTokenResponse:
        admin = await self.repo.get_platform_admin_by_email(payload.email.lower())
        if not admin or not verify_password(payload.password, admin.password_hash):
            raise ValidationAppError("Invalid email or password")
        if admin.role != PlatformAdminRole.SUPER_ADMIN:
            raise PermissionDeniedError("Not a platform super admin")

        token = create_access_token(
            subject=str(admin.id),
            extra_claims={
                "principal_type": "platform_admin",
                "role": PlatformAdminRole.SUPER_ADMIN.value,
                "email": admin.email,
            },
        )
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="platform_admin.login",
            entity_type="PlatformAdminUser",
            entity_id=admin.id,
            before=None,
            after={"email": admin.email},
            correlation_id=None,
        )
        await self.db.commit()
        return SuperAdminTokenResponse(access_token=token, email=admin.email)

    async def create_service_request(
        self,
        payload: ServiceRequestCreate,
        *,
        idempotency_key: str,
        correlation_id: str | None,
    ) -> tuple[ServiceRequestOut, bool]:
        if not idempotency_key or len(idempotency_key) < 8:
            raise ValidationAppError("Idempotency-Key header is required")

        existing = await self.repo.get_service_request_by_idempotency(idempotency_key)
        if existing:
            tenant = await self.repo.get_tenant_by_service_request(existing.id)
            return await self._sr_out(existing, tenant), False

        modules = [m.value for m in payload.requested_modules]
        for required in ALWAYS_ON_MODULES:
            if required.value not in modules:
                modules.insert(0, required.value)

        sr = ServiceRequest(
            institution_name=payload.institution_name.strip(),
            request_kind=RequestKind.NEW_INSTITUTION,
            institution_type=payload.institution_type,
            contact_name=payload.contact_name.strip(),
            email=str(payload.email).lower(),
            phone=payload.phone.strip(),
            estimated_users=payload.estimated_users.strip(),
            preferred_slug=(payload.preferred_slug or "").strip().lower() or None,
            requested_modules=modules,
            message=(payload.message or "").strip() or None,
            status=ServiceRequestStatus.NEW,
            idempotency_key=idempotency_key,
        )
        self.db.add(sr)
        await self.db.flush()

        await self._audit(
            actor_type=PlatformActorType.SYSTEM,
            actor_id=None,
            action="service_request.created",
            entity_type="ServiceRequest",
            entity_id=sr.id,
            before=None,
            after={"institution_name": sr.institution_name, "status": sr.status.value},
            correlation_id=correlation_id,
        )
        # Persist and return immediately so the landing form is not blocked by
        # (or timed out on) the secondary notify email.
        await self.db.commit()
        reloaded = await self.repo.get_service_request(sr.id)
        return await self._sr_out(reloaded or sr), True

    async def notify_new_service_request(
        self, service_request_id: uuid.UUID, modules: list[str]
    ) -> None:
        """Best-effort super-admin alert — never raise to the public create path."""
        try:
            sr = await self.repo.get_service_request(service_request_id)
            if not sr:
                return
            labels = module_labels(modules)
            subject, body = build_super_admin_alert(
                institution_name=sr.institution_name,
                contact_name=sr.contact_name,
                email=sr.email,
                phone=sr.phone,
                modules=labels,
            )
            notify_to = await self.get_setting_value(
                "SUPER_ADMIN_NOTIFY_EMAIL",
                settings.SUPER_ADMIN_NOTIFY_EMAIL or settings.GMAIL_USER or "",
            )
            if not notify_to:
                return
            result = send_email_sync(to_email=notify_to, subject=subject, body=body)
            await persist_email_log(
                self.db,
                service_request_id=sr.id,
                email_type=EmailType.SUPER_ADMIN_ALERT,
                result=result,
            )
            if not result.ok:
                sr.last_email_error = result.error_message
            await self.db.commit()
        except Exception:  # noqa: BLE001 — public create must still succeed
            logger.exception(
                "Super-admin notify failed for service request %s", service_request_id
            )
            try:
                await self.db.rollback()
            except Exception:  # noqa: BLE001
                pass

    async def create_addon_request(
        self,
        payload: AddOnModuleRequestCreate,
        *,
        idempotency_key: str,
        correlation_id: str | None,
    ) -> AddOnModuleRequestOut:
        if not idempotency_key or len(idempotency_key) < 8:
            raise ValidationAppError("Idempotency-Key header is required")
        existing = await self.repo.get_addon_request_by_idempotency(idempotency_key)
        if existing:
            tenant = await self.repo.get_tenant_by_slug(str(existing.tenant_id))
            tenant = tenant or await self._tenant_by_id(existing.tenant_id)
            if not tenant:
                raise NotFoundError("Tenant not found")
            return await self._addon_out(existing, tenant)

        tenant = await self.repo.find_tenant_for_addon(payload.tenant_lookup)
        if not tenant:
            raise NotFoundError("Institution not found")
        enabled = set(tenant.enabled_modules or [])
        requested = [m.value for m in payload.requested_modules if m.value not in enabled]
        if not requested:
            raise ValidationAppError("No new modules selected")

        req = AddOnModuleRequest(
            tenant_id=tenant.id,
            contact_name=payload.contact_name.strip(),
            email=str(payload.email).lower(),
            phone=(payload.phone or "").strip() or None,
            requested_modules=requested,
            message=(payload.message or "").strip() or None,
            status=ServiceRequestStatus.NEW,
            idempotency_key=idempotency_key,
        )
        self.db.add(req)
        await self.db.flush()
        await self._audit(
            actor_type=PlatformActorType.SYSTEM,
            actor_id=None,
            action="addon_request.created",
            entity_type="AddOnModuleRequest",
            entity_id=req.id,
            before=None,
            after={"tenant_id": str(tenant.id), "requested_modules": requested},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        # Reload with relationships — serializing the expired/unloaded instance after
        # commit can fail in async SQLAlchemy and surface as a client "Network Error"
        # even though the row was already saved.
        reloaded = await self.repo.get_addon_request(req.id)
        return await self._addon_out(reloaded or req, tenant)

    async def _tenant_by_id(self, tenant_id: uuid.UUID) -> Tenant | None:
        from sqlalchemy import select

        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def list_addon_requests(
        self, *, status: ServiceRequestStatus | None, offset: int, limit: int
    ) -> tuple[list[AddOnModuleRequestOut], int]:
        items, total = await self.repo.list_addon_requests(status=status, offset=offset, limit=limit)
        out: list[AddOnModuleRequestOut] = []
        for item in items:
            tenant = await self._tenant_by_id(item.tenant_id)
            if tenant:
                out.append(await self._addon_out(item, tenant))
        return out, total

    async def list_service_requests(
        self, *, status: ServiceRequestStatus | None, offset: int, limit: int
    ) -> tuple[list[ServiceRequestOut], int]:
        items, total = await self.repo.list_service_requests(
            status=status, offset=offset, limit=limit
        )
        out: list[ServiceRequestOut] = []
        for sr in items:
            tenant = await self.repo.get_tenant_by_service_request(sr.id)
            out.append(await self._sr_out(sr, tenant))
        return out, total

    async def get_service_request(self, request_id: uuid.UUID) -> ServiceRequestOut:
        sr = await self.repo.get_service_request(request_id)
        if not sr:
            raise NotFoundError("Service request not found")
        tenant = await self.repo.get_tenant_by_service_request(sr.id)
        return await self._sr_out(sr, tenant)

    async def get_addon_request(self, request_id: uuid.UUID) -> AddOnModuleRequestOut:
        req = await self.repo.get_addon_request(request_id)
        if not req:
            raise NotFoundError("Add-on request not found")
        tenant = await self._tenant_by_id(req.tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        return await self._addon_out(req, tenant)

    async def send_invoice(
        self,
        request_id: uuid.UUID,
        body: SendInvoiceBody,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ServiceRequestOut:
        sr = await self.repo.get_service_request(request_id)
        if not sr:
            raise NotFoundError("Service request not found")
        if sr.status != ServiceRequestStatus.NEW:
            raise ValidationAppError(
                f"Cannot send invoice from status '{sr.status.value}' (expected 'new')"
            )

        before = {"status": sr.status.value}
        amount, currency = await self._resolve_invoice_amount(
            body, list(sr.requested_modules or [])
        )
        sr.invoice_amount = amount
        sr.invoice_currency = currency
        sr.invoice_notes = body.invoice_notes
        sr.invoice_sent_at = _utcnow()
        sr.status = ServiceRequestStatus.INVOICE_SENT
        sr.last_email_error = None

        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="service_request.invoice_sent",
            entity_type="ServiceRequest",
            entity_id=sr.id,
            before=before,
            after={
                "status": sr.status.value,
                "invoice_amount": str(sr.invoice_amount),
                "invoice_currency": sr.invoice_currency,
            },
            correlation_id=correlation_id,
        )

        labels = module_labels(sr.requested_modules or [])
        subject, email_body = build_invoice_email(
            institution_name=sr.institution_name,
            module_labels=labels,
            amount=str(sr.invoice_amount),
            currency=sr.invoice_currency or "ETB",
            invoice_notes=sr.invoice_notes or "",
            phone=sr.phone,
        )
        result = send_email_sync(to_email=sr.email, subject=subject, body=email_body)
        await persist_email_log(
            self.db,
            service_request_id=sr.id,
            email_type=EmailType.PAYMENT_INVOICE,
            result=result,
        )
        if not result.ok:
            sr.last_email_error = result.error_message

        await self.db.commit()
        reloaded = await self.repo.get_service_request(sr.id)
        return await self._sr_out(reloaded or sr)

    async def confirm_payment(
        self,
        request_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ServiceRequestOut:
        sr = await self.repo.get_service_request(request_id)
        if not sr:
            raise NotFoundError("Service request not found")
        if sr.status != ServiceRequestStatus.INVOICE_SENT:
            raise ValidationAppError(
                f"Cannot confirm payment from status '{sr.status.value}' "
                "(expected 'invoice_sent')"
            )

        before = {"status": sr.status.value}
        sr.status = ServiceRequestStatus.PAYMENT_CONFIRMED
        sr.payment_confirmed_at = _utcnow()
        sr.payment_confirmed_by = admin.id

        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="service_request.payment_confirmed",
            entity_type="ServiceRequest",
            entity_id=sr.id,
            before=before,
            after={"status": sr.status.value, "payment_confirmed_by": str(admin.id)},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        reloaded = await self.repo.get_service_request(sr.id)
        return await self._sr_out(reloaded or sr)

    async def _allocate_slug(self, preferred: str | None, institution_name: str) -> str:
        base = _slugify(preferred) if preferred else _slugify(institution_name)
        if base in RESERVED_SUBDOMAINS:
            base = f"{base}-institution"
        candidate = base
        suffix = 2
        while await self.repo.slug_taken(candidate):
            candidate = f"{base}{suffix}"
            suffix += 1
            if suffix > 1000:
                candidate = f"{base}-{secrets.token_hex(3)}"
                break
        return candidate

    async def activate(
        self,
        request_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ActivateResponse:
        sr = await self.repo.get_service_request(request_id)
        if not sr:
            raise NotFoundError("Service request not found")

        existing_tenant = await self.repo.get_tenant_by_service_request(sr.id)
        if sr.status == ServiceRequestStatus.ACTIVATED and existing_tenant:
            return ActivateResponse(
                service_request=await self._sr_out(sr, existing_tenant),
                tenant=_tenant_out(existing_tenant),
                already_activated=True,
            )

        if sr.status != ServiceRequestStatus.PAYMENT_CONFIRMED:
            raise ValidationAppError(
                f"Cannot activate from status '{sr.status.value}' "
                "(expected 'payment_confirmed')"
            )

        if existing_tenant:
            # Defensive: status lagged but tenant exists — treat as idempotent.
            sr.status = ServiceRequestStatus.ACTIVATED
            sr.activated_at = sr.activated_at or _utcnow()
            await self.db.commit()
            return ActivateResponse(
                service_request=await self._sr_out(sr, existing_tenant),
                tenant=_tenant_out(existing_tenant),
                already_activated=True,
            )

        slug = await self._allocate_slug(sr.preferred_slug, sr.institution_name)
        modules = list(dict.fromkeys([*(sr.requested_modules or [])]))
        for required in ALWAYS_ON_MODULES:
            if required.value not in modules:
                modules.insert(0, required.value)

        try:
            tenant_type = TenantType(sr.institution_type.value)
        except ValueError:
            tenant_type = TenantType.TRAINING_PROVIDER

        before = {"status": sr.status.value}
        temp_password = _generate_temp_password()
        # Never log or return plaintext password except in the outbound email.

        tenant = Tenant(
            code=slug,
            name=sr.institution_name,
            tenant_type=tenant_type,
            status=TenantStatus.ACTIVE,
            slug=slug,
            service_request_id=sr.id,
            enabled_modules=modules,
            currency=sr.invoice_currency or "ETB",
            subscription_start_date=date.today(),
            renewal_date=date.today() + timedelta(days=365),
        )
        self.db.add(tenant)
        await self.db.flush()

        admin_account = InstitutionAdminAccount(
            tenant_id=tenant.id,
            email=sr.email,
            temporary_password_hash=hash_password(temp_password),
            must_change_password=True,
        )
        self.db.add(admin_account)

        sr.status = ServiceRequestStatus.ACTIVATED
        sr.activated_at = _utcnow()
        sr.last_email_error = None

        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="tenant.activated",
            entity_type="ServiceRequest",
            entity_id=sr.id,
            before=before,
            after={
                "status": sr.status.value,
                "tenant_id": str(tenant.id),
                "slug": slug,
                "enabled_modules": modules,
            },
            correlation_id=correlation_id,
        )

        link = await self.institution_link(slug)
        subject, email_body = build_welcome_email(
            institution_name=sr.institution_name,
            institution_link=link,
            admin_email=sr.email,
            temporary_password=temp_password,
        )
        result = send_email_sync(to_email=sr.email, subject=subject, body=email_body)
        await persist_email_log(
            self.db,
            service_request_id=sr.id,
            email_type=EmailType.ACTIVATION_WELCOME,
            result=result,
        )
        if not result.ok:
            sr.last_email_error = result.error_message

        await self.db.commit()
        reloaded = await self.repo.get_service_request(sr.id)
        tenant_out = _tenant_out(tenant)
        return ActivateResponse(
            service_request=await self._sr_out(reloaded or sr, tenant),
            tenant=tenant_out,
            already_activated=False,
        )

    async def reject(
        self,
        request_id: uuid.UUID,
        *,
        reason: str,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ServiceRequestOut:
        sr = await self.repo.get_service_request(request_id)
        if not sr:
            raise NotFoundError("Service request not found")
        if sr.status not in (ServiceRequestStatus.NEW, ServiceRequestStatus.INVOICE_SENT):
            raise ValidationAppError(
                f"Cannot reject from status '{sr.status.value}' "
                "(allowed: new, invoice_sent)"
            )

        before = {"status": sr.status.value}
        sr.status = ServiceRequestStatus.REJECTED
        sr.rejected_at = _utcnow()
        sr.rejection_reason = reason.strip()

        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="service_request.rejected",
            entity_type="ServiceRequest",
            entity_id=sr.id,
            before=before,
            after={"status": sr.status.value, "rejection_reason": sr.rejection_reason},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        reloaded = await self.repo.get_service_request(sr.id)
        return await self._sr_out(reloaded or sr)

    async def send_addon_invoice(
        self,
        request_id: uuid.UUID,
        body: SendInvoiceBody,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> AddOnModuleRequestOut:
        req = await self.repo.get_addon_request(request_id)
        if not req:
            raise NotFoundError("Add-on request not found")
        tenant = await self._tenant_by_id(req.tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        if req.status != ServiceRequestStatus.NEW:
            raise ValidationAppError(f"Cannot send invoice from status '{req.status.value}'")
        before = {"status": req.status.value}
        amount, currency = await self._resolve_invoice_amount(
            body, list(req.requested_modules or [])
        )
        req.invoice_amount = amount
        req.invoice_currency = currency
        req.invoice_notes = body.invoice_notes
        req.invoice_sent_at = _utcnow()
        req.status = ServiceRequestStatus.INVOICE_SENT
        req.last_email_error = None
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="addon_request.invoice_sent",
            entity_type="AddOnModuleRequest",
            entity_id=req.id,
            before=before,
            after={"status": req.status.value, "invoice_amount": str(req.invoice_amount)},
            correlation_id=correlation_id,
        )
        # Commit workflow state first; email is secondary and must not undo it
        # or delay/fail the HTTP response (false client "Network Error").
        await self.db.commit()
        reloaded = await self.repo.get_addon_request(req.id)
        return await self._addon_out(reloaded or req, tenant)

    async def send_addon_invoice_email(self, request_id: uuid.UUID) -> None:
        """Best-effort invoice email after send-invoice already committed."""
        try:
            req = await self.repo.get_addon_request(request_id)
            if not req:
                return
            tenant = await self._tenant_by_id(req.tenant_id)
            if not tenant:
                return
            subject, email_body = build_invoice_email(
                institution_name=tenant.name,
                module_labels=module_labels(req.requested_modules or []),
                amount=str(req.invoice_amount),
                currency=req.invoice_currency or "USD",
                invoice_notes=req.invoice_notes or "",
                phone=req.phone or "",
            )
            result = send_email_sync(to_email=req.email, subject=subject, body=email_body)
            await persist_email_log(
                self.db,
                addon_module_request_id=req.id,
                email_type=EmailType.PAYMENT_INVOICE,
                result=result,
            )
            if not result.ok:
                req.last_email_error = result.error_message
            else:
                req.last_email_error = None
            await self.db.commit()
        except Exception:  # noqa: BLE001
            logger.exception("Add-on invoice email failed for %s", request_id)
            try:
                await self.db.rollback()
            except Exception:  # noqa: BLE001
                pass

    async def confirm_addon_payment(
        self,
        request_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> AddOnModuleRequestOut:
        req = await self.repo.get_addon_request(request_id)
        if not req:
            raise NotFoundError("Add-on request not found")
        tenant = await self._tenant_by_id(req.tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        if req.status != ServiceRequestStatus.INVOICE_SENT:
            raise ValidationAppError(f"Cannot confirm payment from status '{req.status.value}'")
        before = {"status": req.status.value}
        req.status = ServiceRequestStatus.PAYMENT_CONFIRMED
        req.payment_confirmed_at = _utcnow()
        req.payment_confirmed_by = admin.id
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="addon_request.payment_confirmed",
            entity_type="AddOnModuleRequest",
            entity_id=req.id,
            before=before,
            after={"status": req.status.value, "payment_confirmed_by": str(admin.id)},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        reloaded = await self.repo.get_addon_request(req.id)
        return await self._addon_out(reloaded or req, tenant)

    async def activate_addon_request(
        self,
        request_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> AddOnModuleRequestOut:
        req = await self.repo.get_addon_request(request_id)
        if not req:
            raise NotFoundError("Add-on request not found")
        tenant = await self._tenant_by_id(req.tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        if req.status == ServiceRequestStatus.ACTIVATED:
            return await self._addon_out(req, tenant)
        if req.status != ServiceRequestStatus.PAYMENT_CONFIRMED:
            raise ValidationAppError(f"Cannot approve add-on from status '{req.status.value}'")
        before = {"status": req.status.value, "enabled_modules": list(tenant.enabled_modules or [])}
        merged = list(dict.fromkeys([*(tenant.enabled_modules or []), *(req.requested_modules or [])]))
        tenant.enabled_modules = merged
        req.status = ServiceRequestStatus.ACTIVATED
        req.activated_at = _utcnow()
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="addon_request.activated",
            entity_type="AddOnModuleRequest",
            entity_id=req.id,
            before=before,
            after={"status": req.status.value, "enabled_modules": merged},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        reloaded = await self.repo.get_addon_request(req.id)
        return await self._addon_out(reloaded or req, tenant)

    async def list_renewals(self, *, days: int | None = 30) -> list[RenewalTenantOut]:
        before = date.today() + timedelta(days=days) if days is not None else None
        tenants = await self.repo.list_renewal_tenants(before=before)
        out: list[RenewalTenantOut] = []
        for t in tenants:
            out.append(
                RenewalTenantOut(
                    id=t.id,
                    name=t.name,
                    slug=t.slug or t.code,
                    status=t.status.value,
                    enabled_modules=list(t.enabled_modules or []),
                    subscription_start_date=t.subscription_start_date,
                    renewal_date=t.renewal_date,
                    institution_link=await self.institution_link(t.slug or t.code),
                )
            )
        return out

    async def mark_tenant_renewed(
        self,
        tenant_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> RenewalTenantOut:
        tenant = await self._tenant_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        before = {"status": tenant.status.value, "renewal_date": str(tenant.renewal_date)}
        base = tenant.renewal_date if tenant.renewal_date and tenant.renewal_date > date.today() else date.today()
        tenant.renewal_date = base + timedelta(days=365)
        tenant.status = TenantStatus.ACTIVE
        if not tenant.subscription_start_date:
            tenant.subscription_start_date = date.today()
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="tenant.renewed",
            entity_type="Tenant",
            entity_id=tenant.id,
            before=before,
            after={"status": tenant.status.value, "renewal_date": str(tenant.renewal_date)},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        return RenewalTenantOut(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug or tenant.code,
            status=tenant.status.value,
            enabled_modules=list(tenant.enabled_modules or []),
            subscription_start_date=tenant.subscription_start_date,
            renewal_date=tenant.renewal_date,
            institution_link=await self.institution_link(tenant.slug or tenant.code),
        )

    async def expire_overdue_tenants(self, *, correlation_id: str | None) -> dict[str, int]:
        count = await self.repo.mark_expired_tenants(date.today())
        await self.db.commit()
        return {"expired": count}

    async def resolve_tenant_by_subdomain(self, slug: str) -> RenewalTenantOut:
        tenant = await self.repo.get_tenant_by_slug(_slugify(slug))
        if not tenant:
            raise NotFoundError("Institution not found")
        if tenant.status == TenantStatus.EXPIRED:
            raise PermissionDeniedError("Subscription expired. Please contact Cyber-Zeb Consulting to renew.")
        return RenewalTenantOut(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug or tenant.code,
            status=tenant.status.value,
            enabled_modules=list(tenant.enabled_modules or []),
            subscription_start_date=tenant.subscription_start_date,
            renewal_date=tenant.renewal_date,
            institution_link=await self.institution_link(tenant.slug or tenant.code),
        )

    async def resend_service_request_email(
        self,
        request_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> ServiceRequestOut:
        sr = await self.repo.get_service_request(request_id)
        if not sr:
            raise NotFoundError("Service request not found")
        failed = await self.repo.get_latest_failed_email_for_service_request(sr.id)
        if not failed:
            raise ValidationAppError("No failed email found to resend for this request")
        result = send_email_sync(
            to_email=failed.to_email,
            subject=failed.subject,
            body=failed.body_preview,
        )
        await persist_email_log(
            self.db,
            service_request_id=sr.id,
            email_type=failed.email_type,
            result=result,
        )
        if result.ok:
            sr.last_email_error = None
        else:
            sr.last_email_error = result.error_message
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="service_request.email_resent",
            entity_type="ServiceRequest",
            entity_id=sr.id,
            before={"last_email_error": failed.error_message},
            after={
                "ok": result.ok,
                "email_type": failed.email_type.value,
                "error": result.error_message,
            },
            correlation_id=correlation_id,
        )
        await self.db.commit()
        reloaded = await self.repo.get_service_request(sr.id)
        tenant = await self.repo.get_tenant_by_service_request(sr.id)
        return await self._sr_out(reloaded or sr, tenant)

    async def resend_addon_request_email(
        self,
        request_id: uuid.UUID,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> AddOnModuleRequestOut:
        req = await self.repo.get_addon_request(request_id)
        if not req:
            raise NotFoundError("Add-on request not found")
        tenant = await self._tenant_by_id(req.tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        failed = await self.repo.get_latest_failed_email_for_addon(req.id)
        if not failed:
            raise ValidationAppError("No failed email found to resend for this request")
        result = send_email_sync(
            to_email=failed.to_email,
            subject=failed.subject,
            body=failed.body_preview,
        )
        await persist_email_log(
            self.db,
            addon_module_request_id=req.id,
            email_type=failed.email_type,
            result=result,
        )
        if result.ok:
            req.last_email_error = None
        else:
            req.last_email_error = result.error_message
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="addon_request.email_resent",
            entity_type="AddOnModuleRequest",
            entity_id=req.id,
            before={"last_email_error": failed.error_message},
            after={
                "ok": result.ok,
                "email_type": failed.email_type.value,
                "error": result.error_message,
            },
            correlation_id=correlation_id,
        )
        await self.db.commit()
        reloaded = await self.repo.get_addon_request(req.id)
        return await self._addon_out(reloaded or req, tenant)

    async def get_overview(self) -> SuperAdminOverviewOut:
        total_institutions = await self.repo.count_tenants()
        active_institutions = await self.repo.count_tenants(status=TenantStatus.ACTIVE)
        pending_statuses = (
            ServiceRequestStatus.NEW,
            ServiceRequestStatus.INVOICE_SENT,
            ServiceRequestStatus.PAYMENT_CONFIRMED,
        )
        pending_sr = 0
        pending_addon = 0
        for st in pending_statuses:
            pending_sr += await self.repo.count_service_requests(status=st)
            pending_addon += await self.repo.count_addon_requests(status=st)

        tenants = await self.repo.list_tenants()
        revenue = Decimal("0")
        currency = "USD"
        for tenant in tenants:
            if tenant.status != TenantStatus.ACTIVE:
                continue
            total, curr = await self.calculate_module_total(list(tenant.enabled_modules or []))
            revenue += total
            currency = curr

        renewals = await self.list_renewals(days=30)
        recent_sr, _ = await self.repo.list_service_requests(status=None, offset=0, limit=5)
        recent_addon, _ = await self.repo.list_addon_requests(status=None, offset=0, limit=5)
        recent_requests: list[OverviewRecentRequest] = []
        for sr in recent_sr:
            recent_requests.append(
                OverviewRecentRequest(
                    id=sr.id,
                    kind="service_request",
                    name=sr.institution_name,
                    status=sr.status.value,
                    created_at=sr.created_at,
                )
            )
        for req in recent_addon:
            tenant = await self._tenant_by_id(req.tenant_id)
            recent_requests.append(
                OverviewRecentRequest(
                    id=req.id,
                    kind="addon_request",
                    name=tenant.name if tenant else str(req.tenant_id),
                    status=req.status.value,
                    created_at=req.created_at,
                )
            )
        recent_requests.sort(key=lambda r: r.created_at, reverse=True)
        recent_requests = recent_requests[:8]

        audit_items, _ = await self.repo.list_audit_logs(
            action=None, since=None, until=None, offset=0, limit=10
        )
        activity = [
            OverviewActivityItem(
                id=entry.id,
                summary=_audit_summary(entry.action, entry.after),
                created_at=entry.created_at,
                action=entry.action,
            )
            for entry in audit_items
        ]

        return SuperAdminOverviewOut(
            total_institutions=total_institutions,
            active_institutions=active_institutions,
            pending_service_requests=pending_sr,
            pending_addon_requests=pending_addon,
            estimated_annual_revenue=revenue,
            revenue_currency=currency,
            renewing_within_30_days=len(renewals),
            recent_requests=recent_requests,
            upcoming_renewals=renewals[:5],
            recent_activity=activity,
        )

    async def list_institutions(self) -> list[InstitutionListItemOut]:
        tenants = await self.repo.list_tenants()
        out: list[InstitutionListItemOut] = []
        for t in tenants:
            out.append(
                InstitutionListItemOut(
                    id=t.id,
                    name=t.name,
                    slug=t.slug or t.code,
                    status=t.status.value,
                    enabled_modules=list(t.enabled_modules or []),
                    renewal_date=t.renewal_date,
                    institution_link=await self.institution_link(t.slug or t.code),
                )
            )
        return out

    async def get_institution(self, tenant_id: uuid.UUID) -> InstitutionDetailOut:
        tenant = await self._tenant_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Institution not found")
        admin_acct = await self.repo.get_institution_admin_for_tenant(tenant.id)
        total, currency = await self.calculate_module_total(list(tenant.enabled_modules or []))
        return InstitutionDetailOut(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug or tenant.code,
            status=tenant.status.value,
            enabled_modules=list(tenant.enabled_modules or []),
            subscription_start_date=tenant.subscription_start_date,
            renewal_date=tenant.renewal_date,
            institution_link=await self.institution_link(tenant.slug or tenant.code),
            admin_email=admin_acct.email if admin_acct else None,
            estimated_total=total,
            estimated_currency=currency,
        )

    async def list_public_site_content(self) -> list[SiteContentBlockOut]:
        items = await self.repo.list_site_content_blocks(active_only=True)
        return [SiteContentBlockOut.model_validate(item) for item in items]

    async def list_site_content(self) -> list[SiteContentBlockOut]:
        items = await self.repo.list_site_content_blocks(active_only=False)
        return [SiteContentBlockOut.model_validate(item) for item in items]

    async def create_site_content(
        self,
        payload: SiteContentBlockCreate,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> SiteContentBlockOut:
        existing = await self.repo.get_site_content_by_key(payload.key)
        if existing:
            raise ValidationAppError("Content block key already exists")
        block = SiteContentBlock(
            key=payload.key,
            value=payload.value,
            is_active=payload.is_active,
        )
        self.db.add(block)
        await self.db.flush()
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="site_content.created",
            entity_type="SiteContentBlock",
            entity_id=block.id,
            before=None,
            after={"key": block.key, "is_active": block.is_active},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        await self.db.refresh(block)
        return SiteContentBlockOut.model_validate(block)

    async def upsert_announcement(
        self,
        payload: AnnouncementCreate,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> AnnouncementOut:
        key = "announcement_banner"
        existing = await self.repo.get_site_content_by_key(key)
        if existing:
            before = {"value": existing.value, "is_active": existing.is_active}
            existing.value = payload.value
            existing.is_active = payload.is_active
            await self._audit(
                actor_type=PlatformActorType.PLATFORM_ADMIN,
                actor_id=admin.id,
                action="site_content.updated",
                entity_type="SiteContentBlock",
                entity_id=existing.id,
                before=before,
                after={"key": key, "value": existing.value, "is_active": existing.is_active},
                correlation_id=correlation_id,
            )
            await self.db.commit()
            await self.db.refresh(existing)
            return AnnouncementOut(value=existing.value, is_active=existing.is_active)
        block = SiteContentBlock(key=key, value=payload.value, is_active=payload.is_active)
        self.db.add(block)
        await self.db.flush()
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="site_content.created",
            entity_type="SiteContentBlock",
            entity_id=block.id,
            before=None,
            after={"key": key, "is_active": block.is_active},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        await self.db.refresh(block)
        return AnnouncementOut(value=block.value, is_active=block.is_active)

    async def update_site_content(
        self,
        block_id: uuid.UUID,
        payload: SiteContentBlockPatch,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> SiteContentBlockOut:
        block = await self.repo.get_site_content_by_id(block_id)
        if not block:
            raise NotFoundError("Content block not found")
        before = {"value": block.value, "is_active": block.is_active}
        updates = payload.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(block, field, value)
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="site_content.updated",
            entity_type="SiteContentBlock",
            entity_id=block.id,
            before=before,
            after={"key": block.key, "value": block.value, "is_active": block.is_active},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        await self.db.refresh(block)
        return SiteContentBlockOut.model_validate(block)

    async def list_audit_logs(
        self,
        *,
        action: str | None,
        since: datetime | None,
        until: datetime | None,
        offset: int,
        limit: int,
    ) -> PlatformAuditLogListOut:
        items, total = await self.repo.list_audit_logs(
            action=action, since=since, until=until, offset=offset, limit=limit
        )
        out: list[PlatformAuditLogOut] = []
        for entry in items:
            actor_email = None
            if entry.actor_id:
                admin = await self.repo.get_platform_admin_by_id(entry.actor_id)
                actor_email = admin.email if admin else None
            out.append(
                PlatformAuditLogOut(
                    id=entry.id,
                    actor_type=entry.actor_type.value
                    if hasattr(entry.actor_type, "value")
                    else str(entry.actor_type),
                    actor_id=entry.actor_id,
                    actor_email=actor_email,
                    action=entry.action,
                    entity_type=entry.entity_type,
                    entity_id=entry.entity_id,
                    before=entry.before,
                    after=entry.after,
                    correlation_id=entry.correlation_id,
                    created_at=entry.created_at,
                    summary=_audit_summary(entry.action, entry.after),
                )
            )
        return PlatformAuditLogListOut(items=out, total=total)

    async def ensure_default_platform_settings(self) -> None:
        defaults = {
            "SUPER_ADMIN_NOTIFY_EMAIL": settings.SUPER_ADMIN_NOTIFY_EMAIL or "",
            "PUBLIC_BASE_DOMAIN": settings.PUBLIC_BASE_DOMAIN or "",
        }
        changed = False
        for key, value in defaults.items():
            existing = await self.repo.get_platform_setting(key)
            if existing:
                continue
            self.db.add(
                PlatformSetting(
                    key=key,
                    value=value,
                    description=EDITABLE_PLATFORM_SETTINGS.get(key, ""),
                )
            )
            changed = True
        if changed:
            await self.db.commit()

    async def get_setting_value(self, key: str, fallback: str) -> str:
        row = await self.repo.get_platform_setting(key)
        if row and row.value.strip():
            return row.value.strip()
        return fallback

    async def institution_link(self, slug: str) -> str:
        base_domain = await self.get_setting_value(
            "PUBLIC_BASE_DOMAIN",
            settings.PUBLIC_BASE_DOMAIN or "",
        )
        return _institution_link(slug, base_domain=base_domain or None)

    async def list_platform_settings(self) -> list[PlatformSettingOut]:
        await self.ensure_default_platform_settings()
        items = await self.repo.list_platform_settings()
        return [PlatformSettingOut.model_validate(item) for item in items]

    async def update_platform_setting(
        self,
        key: str,
        payload: PlatformSettingPatch,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> PlatformSettingOut:
        if key not in EDITABLE_PLATFORM_SETTINGS:
            raise ValidationAppError("Setting key is not editable")
        await self.ensure_default_platform_settings()
        row = await self.repo.get_platform_setting(key)
        if not row:
            raise NotFoundError("Setting not found")
        before = {"value": row.value}
        row.value = payload.value.strip()
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="platform_setting.updated",
            entity_type="PlatformSetting",
            entity_id=row.id,
            before=before,
            after={"key": key, "value": row.value},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        return PlatformSettingOut.model_validate(row)

    async def list_platform_admins(self) -> list[PlatformAdminUserOut]:
        items = await self.repo.list_platform_admins()
        return [PlatformAdminUserOut.model_validate(item) for item in items]

    async def invite_platform_admin(
        self,
        payload: InvitePlatformAdminBody,
        *,
        admin: PlatformAdminUser,
        correlation_id: str | None,
    ) -> PlatformAdminUserOut:
        email = str(payload.email).lower()
        existing = await self.repo.get_platform_admin_by_email(email)
        if existing:
            raise ValidationAppError("A platform admin with this email already exists")
        temp_password = _generate_temp_password()
        new_admin = PlatformAdminUser(
            email=email,
            password_hash=hash_password(temp_password),
            role=PlatformAdminRole.SUPER_ADMIN,
        )
        self.db.add(new_admin)
        await self.db.flush()
        subject = "Your Berana LMS Super Admin account"
        body = (
            f"You have been invited as a Berana LMS Super Admin.\n\n"
            f"Login: {settings.FRONTEND_BASE_URL.rstrip('/')}/super-admin/login\n"
            f"Email: {email}\n"
            f"Temporary password: {temp_password}\n\n"
            f"Please sign in and change this password as soon as possible.\n"
        )
        result = send_email_sync(to_email=email, subject=subject, body=body)
        await persist_email_log(
            self.db,
            email_type=EmailType.SUPER_ADMIN_ALERT,
            result=result,
        )
        await self._audit(
            actor_type=PlatformActorType.PLATFORM_ADMIN,
            actor_id=admin.id,
            action="platform_admin.invited",
            entity_type="PlatformAdminUser",
            entity_id=new_admin.id,
            before=None,
            after={"email": email, "invite_email_ok": result.ok},
            correlation_id=correlation_id,
        )
        await self.db.commit()
        return PlatformAdminUserOut.model_validate(new_admin)

    async def list_platform_email_logs(
        self, *, status: EmailStatus | None, offset: int, limit: int
    ) -> tuple[list, int]:
        from app.modules.onboarding.schemas import EmailLogOut

        items, total = await self.repo.list_email_logs(status=status, offset=offset, limit=limit)
        return [EmailLogOut.model_validate(item) for item in items], total

    async def export_service_requests_csv(self) -> str:
        import csv
        import io

        items, _ = await self.repo.list_service_requests(status=None, offset=0, limit=5000)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "id",
                "institution_name",
                "contact_name",
                "email",
                "status",
                "requested_modules",
                "invoice_amount",
                "invoice_currency",
                "created_at",
            ]
        )
        for sr in items:
            writer.writerow(
                [
                    str(sr.id),
                    sr.institution_name,
                    sr.contact_name,
                    sr.email,
                    sr.status.value,
                    "|".join(sr.requested_modules or []),
                    sr.invoice_amount or "",
                    sr.invoice_currency or "",
                    sr.created_at.isoformat() if sr.created_at else "",
                ]
            )
        return buf.getvalue()

    async def export_tenants_csv(self) -> str:
        import csv
        import io

        tenants = await self.repo.list_tenants()
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "id",
                "name",
                "slug",
                "status",
                "enabled_modules",
                "subscription_start_date",
                "renewal_date",
            ]
        )
        for t in tenants:
            writer.writerow(
                [
                    str(t.id),
                    t.name,
                    t.slug or t.code,
                    t.status.value,
                    "|".join(t.enabled_modules or []),
                    t.subscription_start_date.isoformat() if t.subscription_start_date else "",
                    t.renewal_date.isoformat() if t.renewal_date else "",
                ]
            )
        return buf.getvalue()
