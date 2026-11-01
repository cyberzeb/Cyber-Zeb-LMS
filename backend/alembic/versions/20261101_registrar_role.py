"""University Edition: add the registrar role.

Revision ID: 20261101_registrar_role
Revises: 20260921_master_data
"""
from alembic import op
import sqlalchemy as sa

revision = "20261101_registrar_role"
down_revision = "20260921_master_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return  # SQLite stores enums as plain strings.
    labels = {
        row[0]
        for row in bind.execute(
            sa.text(
                "SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid "
                "WHERE t.typname = 'role'"
            )
        )
    }
    if not labels:
        return
    # Match the existing label style (enum names or enum values).
    label = "REGISTRAR" if "INSTRUCTOR" in labels else "registrar"
    with op.get_context().autocommit_block():
        op.execute(f"ALTER TYPE role ADD VALUE IF NOT EXISTS '{label}'")


def downgrade() -> None:
    # Postgres cannot drop a single enum value; leaving it is harmless.
    pass
