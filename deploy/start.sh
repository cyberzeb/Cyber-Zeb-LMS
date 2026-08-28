#!/bin/bash
# Start (or restart) the demo server on the VPS.
# Usage: BRANA_PORT=8085 ./deploy/start.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${BRANA_PORT:-8085}"
PID_FILE="$ROOT/deploy/.brana-demo.pid"
LOG_FILE="$ROOT/deploy/brana-demo.log"

if [ ! -f "backend/.env" ]; then
  echo "Missing backend/.env — run ./deploy/install-vps.sh first"
  exit 1
fi

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Stopping existing demo (PID $(cat "$PID_FILE"))..."
  kill "$(cat "$PID_FILE")" || true
  sleep 1
fi

# shellcheck disable=SC1091
source backend/.venv/bin/activate

echo "Starting Berana LMS on port $PORT ..."
nohup env BRANA_PORT="$PORT" python deploy/run_demo.py >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

sleep 2
if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Running (PID $(cat "$PID_FILE")). Logs: $LOG_FILE"
  echo "Open: http://YOUR_VPS_IP:$PORT"
else
  echo "Failed to start. Check logs:"
  tail -20 "$LOG_FILE"
  exit 1
fi
