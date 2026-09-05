"""
Database engine and session management.

Rule (Blueprint Section 17.3 - Multi-Tenant Rule):
Every repository/query MUST apply tenant scope from the authenticated
server context, never from client input. Session helpers below are the
single choke point through which all DB access should flow.
"""
from typing import AsyncGenerator

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

from app.core.config import settings


@compiles(JSONB, "sqlite")
def _sqlite_jsonb(_type, _compiler, **_kw):
    return "JSON"


@compiles(PG_UUID, "sqlite")
def _sqlite_pg_uuid(_type, _compiler, **_kw):
    return "CHAR(36)"

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

_connect_args: dict = {}
_engine_kwargs: dict = {"echo": settings.DEBUG, "connect_args": _connect_args}

if _is_sqlite:
    # QueuePool (pool_size/max_overflow) is invalid for SQLite and crashes startup.
    _engine_kwargs["poolclass"] = StaticPool
elif settings.DATABASE_URL.startswith("postgresql+asyncpg://") and "neon.tech" in settings.DATABASE_URL:
    import ssl as _ssl

    _connect_args["ssl"] = _ssl.create_default_context()
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20
else:
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for every ORM model in every module."""
    pass


async def init_db() -> None:
    """Create tables for SQLite (and any empty database). Idempotent."""
    import app.common.audit  # noqa: F401
    import app.modules.academic.models  # noqa: F401
    import app.modules.admin.models  # noqa: F401
    import app.modules.assessments.models  # noqa: F401
    import app.modules.attendance.models  # noqa: F401
    import app.modules.certificates.models  # noqa: F401
    import app.modules.communication.models  # noqa: F401
    import app.modules.courses.models  # noqa: F401
    import app.modules.enrollment.models  # noqa: F401
    import app.modules.identity.models  # noqa: F401
    import app.modules.integrations.models  # noqa: F401
    import app.modules.live_sessions.models  # noqa: F401
    import app.modules.lms_store.models  # noqa: F401
    import app.modules.onboarding.models  # noqa: F401
    import app.modules.parent_portal.models  # noqa: F401
    import app.modules.payments.models  # noqa: F401
    import app.modules.reports.models  # noqa: F401
    import app.modules.tenants.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import inspect as sa_inspect

    def _has_tenants(sync_conn) -> bool:
        return sa_inspect(sync_conn).has_table("tenants")

    async with engine.connect() as conn:
        if not await conn.run_sync(_has_tenants):
            raise RuntimeError("SQLite init_db ran but table 'tenants' was not created")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a request-scoped DB session.
    Usage: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
