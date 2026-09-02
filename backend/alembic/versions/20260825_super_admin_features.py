"""Super Admin features: integrations, security bans/reports, backup runs, branding, admin suspension

Revision ID: 20260825_super_admin_features
Revises: 20260821_superadmin_console
Create Date: 2026-08-25
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260825_super_admin_features"
down_revision = "20260821_superadmin"
branch_labels = None
depends_on = None


def _has_table(conn, name: str) -> bool:
    return conn.execute(
        sa.text(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t)"
        ),
        {"t": name},
    ).scalar()


def _has_column(conn, table: str, col: str) -> bool:
    return conn.execute(
        sa.text(
            "SELECT EXISTS(SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c)"
        ),
        {"t": table, "c": col},
    ).scalar()


def _has_enum_value(conn, enum_name: str, value: str) -> bool:
    return conn.execute(
        sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON e.enumtypid=t.oid "
            "WHERE t.typname=:n AND e.enumlabel=:v)"
        ),
        {"n": enum_name, "v": value},
    ).scalar()


def _has_index(conn, index_name: str) -> bool:
    return conn.execute(
        sa.text("SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname=:n)"),
        {"n": index_name},
    ).scalar()


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Add is_suspended + suspension_reason to platform_admin_users ──
    if not _has_column(conn, "platform_admin_users", "is_suspended"):
        op.add_column(
            "platform_admin_users",
            sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default="false"),
        )
    if not _has_column(conn, "platform_admin_users", "suspension_reason"):
        op.add_column(
            "platform_admin_users",
            sa.Column("suspension_reason", sa.Text(), nullable=True),
        )
    if not _has_column(conn, "platform_admin_users", "suspended_at"):
        op.add_column(
            "platform_admin_users",
            sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True),
        )

    # ── 2. Add renewal_reminder_sent_at to tenants ──
    if not _has_column(conn, "tenants", "renewal_reminder_sent_at"):
        op.add_column(
            "tenants",
            sa.Column("renewal_reminder_sent_at", sa.DateTime(timezone=True), nullable=True),
        )

    # ── 3. Add institution_type to tenants (enum already exists in DB from service_requests) ──
    if not _has_column(conn, "tenants", "institution_type"):
        op.add_column(
            "tenants",
            sa.Column("institution_type", sa.String(50), nullable=True),
        )

    # ── 4. platform_integrations table ──
    if not _has_table(conn, "platform_integrations"):
        op.create_table(
            "platform_integrations",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("platform", sa.String(40), nullable=False, unique=True),
            sa.Column("display_name", sa.String(120), nullable=False),
            sa.Column("is_connected", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("access_token_enc", sa.Text(), nullable=True),
            sa.Column("refresh_token_enc", sa.Text(), nullable=True),
            sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("oauth_state", sa.String(120), nullable=True),
            sa.Column("connected_account", sa.String(255), nullable=True),
            sa.Column("last_health_check", sa.DateTime(timezone=True), nullable=True),
            sa.Column("last_health_ok", sa.Boolean(), nullable=True),
            sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index("ix_platform_integrations_platform", "platform_integrations", ["platform"])

    # ── 5. platform_admin_bans table ──
    if not _has_table(conn, "platform_admin_bans"):
        op.create_table(
            "platform_admin_bans",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("target_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=False, index=True),
            sa.Column("banned_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=False),
            sa.Column("reason", sa.Text(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("unbanned_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("unbanned_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=True),
            sa.Column("unban_reason", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_platform_admin_bans_target", "platform_admin_bans", ["target_admin_id"])

    # ── 6. user_reports table ──
    if not _has_table(conn, "user_reports"):
        op.create_table(
            "user_reports",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("reporter_user_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("users.id"), nullable=True, index=True),
            sa.Column("reported_user_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("users.id"), nullable=False, index=True),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("tenants.id"), nullable=False, index=True),
            sa.Column("reason", sa.String(500), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(30), nullable=False, server_default="open"),
            sa.Column("reviewed_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("review_notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_user_reports_tenant", "user_reports", ["tenant_id"])
        op.create_index("ix_user_reports_status", "user_reports", ["status"])

    # ── 7. user_bans table ──
    if not _has_table(conn, "user_bans"):
        op.create_table(
            "user_bans",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("users.id"), nullable=False, index=True),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("tenants.id"), nullable=False, index=True),
            sa.Column("banned_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=False),
            sa.Column("reason", sa.Text(), nullable=False),
            sa.Column("ban_scope", sa.String(30), nullable=False, server_default="full_account"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("unbanned_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("unbanned_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=True),
            sa.Column("report_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("user_reports.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_user_bans_user", "user_bans", ["user_id"])
        op.create_index("ix_user_bans_tenant", "user_bans", ["tenant_id"])

    # ── 8. backup_runs table ──
    if not _has_table(conn, "backup_runs"):
        op.create_table(
            "backup_runs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="running"),
            sa.Column("file_path", sa.String(500), nullable=True),
            sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
            sa.Column("duration_seconds", sa.Numeric(10, 2), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("triggered_by", sa.String(30), nullable=False, server_default="scheduled"),
            sa.Column("triggered_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=True),
            sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_backup_runs_started_at", "backup_runs", ["started_at"])

    # ── 9. platform_branding table ──
    if not _has_table(conn, "platform_branding"):
        op.create_table(
            "platform_branding",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("logo_url", sa.String(500), nullable=True),
            sa.Column("favicon_url", sa.String(500), nullable=True),
            sa.Column("footer_text", sa.Text(), nullable=True),
            sa.Column("footer_links", postgresql.JSONB(), nullable=True),
            sa.Column("support_email", sa.String(255), nullable=True),
            sa.Column("support_phone", sa.String(50), nullable=True),
            sa.Column("updated_by_admin_id", postgresql.UUID(as_uuid=True),
                       sa.ForeignKey("platform_admin_users.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("platform_branding")
    op.drop_index("ix_backup_runs_started_at", "backup_runs")
    op.drop_table("backup_runs")
    op.drop_index("ix_user_bans_tenant", "user_bans")
    op.drop_index("ix_user_bans_user", "user_bans")
    op.drop_table("user_bans")
    op.drop_index("ix_user_reports_status", "user_reports")
    op.drop_index("ix_user_reports_tenant", "user_reports")
    op.drop_table("user_reports")
    op.drop_index("ix_platform_admin_bans_target", "platform_admin_bans")
    op.drop_table("platform_admin_bans")
    op.drop_index("ix_platform_integrations_platform", "platform_integrations")
    op.drop_table("platform_integrations")
