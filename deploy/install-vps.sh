#!/bin/bash
# Run on the VPS after uploading the project (no Docker required).
# Usage: chmod +x deploy/install-vps.sh && ./deploy/install-vps.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${BRANA_PORT:-8085}"

echo "=== Berana LMS — VPS setup (port $PORT) ==="

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required. Install with: sudo apt install python3 python3-venv python3-pip"
  exit 1
fi

if [ ! -d "dist" ]; then
  echo "Error: dist/ folder missing. Build on your PC first:"
  echo "  npm run build"
  echo "Then re-upload the project."
  exit 1
fi

echo "Creating Python virtual environment..."
python3 -m venv backend/.venv
# shellcheck disable=SC1091
source backend/.venv/bin/activate

echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

if [ ! -f "backend/.env" ]; then
  cp deploy/env.vps.example backend/.env
  echo ""
  echo "Created backend/.env — edit it before starting:"
  echo "  nano backend/.env"
  echo "  Set JWT_SECRET_KEY and CORS_ORIGINS to http://YOUR_VPS_IP:$PORT"
  echo ""
  exit 0
fi

echo "Seeding demo data (skipped if already present)..."
cd backend
python scripts/seed_if_empty.py
cd "$ROOT"

echo ""
echo "Setup complete. Start the demo with:"
echo "  BRANA_PORT=$PORT ./deploy/start.sh"
echo ""
echo "Stakeholders open: http://YOUR_VPS_IP:$PORT"
echo "Demo password for seeded users: Demo123!"
