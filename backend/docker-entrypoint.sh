#!/bin/sh
set -e

mkdir -p /code/data

is_sqlite() {
  case "${DATABASE_URL_SYNC:-}${DATABASE_URL:-}" in
    sqlite:*|sqlite+*|*sqlite:////*) return 0 ;;
    *) return 1 ;;
  esac
}

if is_sqlite; then
  echo "Using SQLite — creating tables if needed..."
  python - <<'PY' || echo "WARN: init_db failed (API will still start)"
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
print("SQLite tables ready")
PY
else
  echo "Waiting for PostgreSQL..."
  if python -c "import psycopg" 2>/dev/null; then
    until python - <<'PY'
import os, sys
import psycopg
url = os.environ.get("DATABASE_URL_SYNC", "")
try:
    with psycopg.connect(url, connect_timeout=3):
        pass
except Exception:
    sys.exit(1)
PY
    do
      sleep 2
    done
  fi
  echo "Running database migrations..."
  alembic upgrade head || echo "WARN: alembic upgrade failed"
fi

echo "Seeding demo data if database is empty..."
python scripts/seed_if_empty.py || echo "WARN: seed skipped or failed"

exec "$@"
