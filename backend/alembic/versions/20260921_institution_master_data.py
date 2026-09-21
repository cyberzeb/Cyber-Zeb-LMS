"""Institution Master Data on service requests.

Adds the validated master data document (Master_Data.pdf) and the
system-generated institution reference ("INST-0001").

Both columns are nullable: requests created before the master data form existed
keep working, and a short enquiry may still be submitted without one.

Revision ID: 20260921_master_data
Revises: 20260902_institution_types
Create Date: 2026-09-21
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260921_master_data"
down_revision = "20260902_institution_types"
branch_labels = None
depends_on = None


def _json_type():
    """JSONB on Postgres, plain JSON on SQLite (the Docker/default deployment)."""
    return postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite")


def upgrade() -> None:
    op.add_column("service_requests", sa.Column("master_data", _json_type(), nullable=True))
    op.add_column(
        "service_requests", sa.Column("institution_ref", sa.String(length=20), nullable=True)
    )
    op.create_index(
        "ix_service_requests_institution_ref", "service_requests", ["institution_ref"]
    )
    # Unique only where present, so existing rows with NULL do not collide.
    op.create_unique_constraint(
        "uq_service_requests_institution_ref", "service_requests", ["institution_ref"]
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_service_requests_institution_ref", "service_requests", type_="unique"
    )
    op.drop_index("ix_service_requests_institution_ref", table_name="service_requests")
    op.drop_column("service_requests", "institution_ref")
    op.drop_column("service_requests", "master_data")
