"""
Alembic environment.

IMPORTANT: every module's models.py must be imported below so its
tables register on Base.metadata before `alembic revision --autogenerate`
runs. When you add a new module's models, add the import here.
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.core.database import Base

# --- Import every module's models so Base.metadata is complete ---
from app.modules.tenants import models as tenants_models  # noqa: F401
from app.modules.identity import models as identity_models  # noqa: F401
from app.common import audit as audit_models  # noqa: F401
from app.modules.lms_store import models as lms_store_models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_SYNC)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL_SYNC
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.DATABASE_URL_SYNC, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
