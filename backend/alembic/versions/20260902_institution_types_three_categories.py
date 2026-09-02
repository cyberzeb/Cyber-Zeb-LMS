"""Reduce institution types to 3 categories and wipe demo tenant data.

Revision ID: 20260902_institution_types
Revises: 20260825_super_admin_features
Create Date: 2026-09-02
"""
from __future__ import annotations

from alembic import op

revision = "20260902_institution_types"
down_revision = "20260825_super_admin_features"
branch_labels = None
depends_on = None

NEW_INSTITUTION_TYPES = ("college_university", "training", "corporate")

# Delete child rows before parents. Tenants must be removed before service_requests
# because tenants.service_request_id references service_requests.
WIPE_STATEMENTS = (
    "DELETE FROM email_logs",
    "DELETE FROM addon_module_requests",
    "DELETE FROM institution_admin_accounts",
    "DELETE FROM user_bans",
    "DELETE FROM user_reports",
    "DELETE FROM guardian_links",
    "DELETE FROM user_role_assignments",
    "DELETE FROM departments",
    "DELETE FROM campuses",
    "DELETE FROM users",
    "DELETE FROM tenants",
    "DELETE FROM service_requests",
)


def upgrade() -> None:
    # Local demo data only — must complete before narrowing enum types.
    for stmt in WIPE_STATEMENTS:
        op.execute(stmt)

    # service_requests.institution_type
    op.execute("ALTER TYPE institution_type RENAME TO institution_type_old")
    op.execute(f"CREATE TYPE institution_type AS ENUM {NEW_INSTITUTION_TYPES}")
    op.execute(
        "ALTER TABLE service_requests "
        "ALTER COLUMN institution_type TYPE institution_type "
        "USING institution_type::text::institution_type"
    )
    op.execute("DROP TYPE institution_type_old")

    # tenants.tenant_type
    op.execute("ALTER TYPE tenanttype RENAME TO tenanttype_old")
    op.execute(f"CREATE TYPE tenanttype AS ENUM {NEW_INSTITUTION_TYPES}")
    op.execute(
        "ALTER TABLE tenants "
        "ALTER COLUMN tenant_type TYPE tenanttype "
        "USING tenant_type::text::tenanttype"
    )
    op.execute("DROP TYPE tenanttype_old")

    # tenants.institution_type — promote from nullable varchar to strict enum
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS institution_type")
    op.execute(
        "ALTER TABLE tenants ADD COLUMN institution_type institution_type NOT NULL "
        "DEFAULT 'training'"
    )
    op.execute("ALTER TABLE tenants ALTER COLUMN institution_type DROP DEFAULT")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrade not supported — old institution categories were removed intentionally."
    )
