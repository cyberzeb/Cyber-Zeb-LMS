#!/bin/sh
set -e

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

echo "Seeding demo data if database is empty..."
python scripts/seed_if_empty.py

exec "$@"
