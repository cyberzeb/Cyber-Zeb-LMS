"""
Alembic environment.

IMPORTANT: every module's models.py must be imported below so its
tables register on Base.metadata before `alembic revision --autogenerate`
runs. When you add a new module's models, add the import here.
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.core.database import Base

# --- Import every module's models so Base.metadata is complete ---
from app.modules.tenants import models as tenants_models  # noqa: F401
from app.modules.identity import models as identity_models  # noqa: F401
from app.common import audit as audit_models  # noqa: F401
# TODO: as each module's models.py gains real tables, import it here too:
# from app.modules.academic import models as academic_models  # noqa: F401
# from app.modules.courses import models as courses_models  # noqa: F401
# ... etc for enrollment, live_sessions, attendance, assessments,
#     communication, payments, certificates, integrations, admin

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(settings.DATABASE_URL, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
