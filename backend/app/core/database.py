"""
Database engine and session management.

Rule (Blueprint Section 17.3 - Multi-Tenant Rule):
Every repository/query MUST apply tenant scope from the authenticated
server context, never from client input. Session helpers below are the
single choke point through which all DB access should flow.
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

IS_SQLITE = str(settings.DATABASE_URL).startswith("sqlite")

_engine_kwargs: dict = {"echo": settings.DEBUG}
if IS_SQLITE:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
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


def register_models() -> None:
    """Import ORM modules so Base.metadata includes every table."""
    from app.common import audit as audit_models  # noqa: F401
    from app.modules.identity import models as identity_models  # noqa: F401
    from app.modules.lms_store import models as lms_store_models  # noqa: F401
    from app.modules.tenants import models as tenants_models  # noqa: F401


async def init_db() -> None:
    """Create tables for local SQLite (Postgres uses Alembic migrations)."""
    if not IS_SQLITE:
        return
    register_models()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


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
