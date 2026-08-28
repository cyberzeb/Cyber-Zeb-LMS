"""superadmin console: email log addon fk, site content, platform settings

Revision ID: 20260821_superadmin
Revises: 20260816_onboarding
Create Date: 2026-08-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260821_superadmin"
down_revision = "20260816_onboarding"
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
    if _has_table("email_logs") and not _has_column("email_logs", "addon_module_request_id"):
        op.add_column(
            "email_logs",
            sa.Column(
                "addon_module_request_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("addon_module_requests.id"),
                nullable=True,
            ),
        )
        if not _has_index("email_logs", "ix_email_logs_addon_module_request_id"):
            op.create_index(
                "ix_email_logs_addon_module_request_id",
                "email_logs",
                ["addon_module_request_id"],
            )

    if not _has_table("site_content_blocks"):
        op.create_table(
            "site_content_blocks",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("key", sa.String(80), nullable=False),
            sa.Column("value", sa.Text(), nullable=False, server_default=""),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.UniqueConstraint("key", name="uq_site_content_blocks_key"),
        )
        op.create_index("ix_site_content_blocks_key", "site_content_blocks", ["key"])
        op.create_index("ix_site_content_blocks_is_active", "site_content_blocks", ["is_active"])

    if not _has_table("platform_settings"):
        op.create_table(
            "platform_settings",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("key", sa.String(80), nullable=False),
            sa.Column("value", sa.Text(), nullable=False, server_default=""),
            sa.Column("description", sa.String(300), nullable=False, server_default=""),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.UniqueConstraint("key", name="uq_platform_settings_key"),
        )
        op.create_index("ix_platform_settings_key", "platform_settings", ["key"])


def downgrade() -> None:
    if _has_table("platform_settings"):
        op.drop_table("platform_settings")
    if _has_table("site_content_blocks"):
        op.drop_table("site_content_blocks")
    if _has_table("email_logs") and _has_column("email_logs", "addon_module_request_id"):
        if _has_index("email_logs", "ix_email_logs_addon_module_request_id"):
            op.drop_index("ix_email_logs_addon_module_request_id", table_name="email_logs")
        op.drop_column("email_logs", "addon_module_request_id")
