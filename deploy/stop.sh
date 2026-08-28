#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/deploy/.brana-demo.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  kill "$(cat "$PID_FILE")"
  rm -f "$PID_FILE"
  echo "Stopped."
else
  echo "Demo server is not running."
  rm -f "$PID_FILE"
fi
