"""onboarding pricing addons subscriptions

Revision ID: 20260816_onboarding
Revises:
Create Date: 2026-08-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260816_onboarding"
down_revision = None
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def _has_column(table_name: str, column_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return column_name in {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return index_name in {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def upgrade() -> None:
    request_kind = postgresql.ENUM("new_institution", "add_modules", name="request_kind")
    request_kind_col = postgresql.ENUM(
        "new_institution", "add_modules", name="request_kind", create_type=False
    )
    addon_status = postgresql.ENUM(
        "new", "invoice_sent", "payment_confirmed", "activated", "rejected", name="addon_request_status"
    )
    addon_status_col = postgresql.ENUM(
        "new",
        "invoice_sent",
        "payment_confirmed",
        "activated",
        "rejected",
        name="addon_request_status",
        create_type=False,
    )
    tenantstatus = postgresql.ENUM("active", "expired", "suspended", "archived", name="tenantstatus")
    request_kind.create(op.get_bind(), checkfirst=True)
    addon_status.create(op.get_bind(), checkfirst=True)
    tenantstatus.create(op.get_bind(), checkfirst=True)
    op.execute("ALTER TYPE tenantstatus ADD VALUE IF NOT EXISTS 'expired'")

    if not _has_column("service_requests", "request_kind"):
        op.add_column(
            "service_requests",
            sa.Column("request_kind", request_kind_col, nullable=False, server_default="new_institution"),
        )
    if not _has_column("tenants", "subscription_start_date"):
        op.add_column("tenants", sa.Column("subscription_start_date", sa.Date(), nullable=True))
    if not _has_column("tenants", "renewal_date"):
        op.add_column("tenants", sa.Column("renewal_date", sa.Date(), nullable=True))
    if not _has_index("tenants", "ix_tenants_renewal_date"):
        op.create_index("ix_tenants_renewal_date", "tenants", ["renewal_date"], unique=False)

    if not _has_table("module_catalog_items"):
        op.create_table(
            "module_catalog_items",
            sa.Column("key", sa.String(length=80), nullable=False),
            sa.Column("display_name", sa.String(length=160), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("annual_price", sa.Numeric(12, 2), nullable=False),
            sa.Column("currency", sa.String(length=10), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("is_core", sa.Boolean(), nullable=False),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("key"),
        )
    if not _has_index("module_catalog_items", "ix_module_catalog_items_key"):
        op.create_index("ix_module_catalog_items_key", "module_catalog_items", ["key"], unique=True)
    if not _has_index("module_catalog_items", "ix_module_catalog_items_is_active"):
        op.create_index("ix_module_catalog_items_is_active", "module_catalog_items", ["is_active"], unique=False)

    if not _has_table("addon_module_requests"):
        op.create_table(
            "addon_module_requests",
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("contact_name", sa.String(length=200), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("requested_modules", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("status", addon_status_col, nullable=False),
            sa.Column("idempotency_key", sa.String(length=64), nullable=False),
            sa.Column("invoice_amount", sa.Numeric(12, 2), nullable=True),
            sa.Column("invoice_currency", sa.String(length=10), nullable=True),
            sa.Column("invoice_notes", sa.Text(), nullable=True),
            sa.Column("invoice_sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("payment_confirmed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("payment_confirmed_by", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("rejection_reason", sa.Text(), nullable=True),
            sa.Column("last_email_error", sa.Text(), nullable=True),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["payment_confirmed_by"], ["platform_admin_users.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("idempotency_key", name="uq_addon_requests_idempotency"),
        )
    if not _has_index("addon_module_requests", "ix_addon_module_requests_tenant_id"):
        op.create_index("ix_addon_module_requests_tenant_id", "addon_module_requests", ["tenant_id"], unique=False)
    if not _has_index("addon_module_requests", "ix_addon_module_requests_email"):
        op.create_index("ix_addon_module_requests_email", "addon_module_requests", ["email"], unique=False)
    if not _has_index("addon_module_requests", "ix_addon_module_requests_status"):
        op.create_index("ix_addon_module_requests_status", "addon_module_requests", ["status"], unique=False)
    if not _has_index("addon_module_requests", "ix_addon_module_requests_idempotency_key"):
        op.create_index(
            "ix_addon_module_requests_idempotency_key", "addon_module_requests", ["idempotency_key"], unique=False
        )


def downgrade() -> None:
    op.drop_index("ix_addon_module_requests_idempotency_key", table_name="addon_module_requests")
    op.drop_index("ix_addon_module_requests_status", table_name="addon_module_requests")
    op.drop_index("ix_addon_module_requests_email", table_name="addon_module_requests")
    op.drop_index("ix_addon_module_requests_tenant_id", table_name="addon_module_requests")
    op.drop_table("addon_module_requests")
    op.drop_index("ix_module_catalog_items_is_active", table_name="module_catalog_items")
    op.drop_index("ix_module_catalog_items_key", table_name="module_catalog_items")
    op.drop_table("module_catalog_items")
    op.drop_index("ix_tenants_renewal_date", table_name="tenants")
    op.drop_column("tenants", "renewal_date")
    op.drop_column("tenants", "subscription_start_date")
    op.drop_column("service_requests", "request_kind")
