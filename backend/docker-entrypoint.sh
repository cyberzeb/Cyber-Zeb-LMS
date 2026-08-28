#!/bin/sh
set -e

is_sqlite() {
  case "$DATABASE_URL_SYNC" in
    sqlite:*|"") return 0 ;;
    *) return 1 ;;
  esac
}

if is_sqlite; then
  echo "Using SQLite..."
  mkdir -p /code/data
  python - <<'PY'
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
PY
else
  echo "Waiting for PostgreSQL..."
  until python - <<'PY'
import os
import sys
import psycopg
url = os.environ["DATABASE_URL_SYNC"]
try:
    with psycopg.connect(url, connect_timeout=3):
        pass
except Exception:
    sys.exit(1)
PY
  do
    sleep 2
  done

  echo "Running database migrations..."
  alembic upgrade head
fi

echo "Seeding demo data if database is empty..."
python scripts/seed_if_empty.py

exec "$@"
