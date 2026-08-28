#!/usr/bin/env python3
"""
Single-port demo server for VPS without Docker or nginx.

Serves the built frontend (dist/) and the FastAPI API on one port, e.g. 8085.
Run from repo root after: npm run build && deploy/install-vps.sh
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
sys.path.insert(0, str(ROOT / "backend"))

import uvicorn
from starlette.staticfiles import StaticFiles

from app.main import app

if DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(DIST), html=True), name="frontend")
else:
    print(f"Warning: {DIST} not found — API only. Run 'npm run build' first.", file=sys.stderr)

if __name__ == "__main__":
    port = int(os.environ.get("BRANA_PORT", "8085"))
    host = os.environ.get("BRANA_HOST", "0.0.0.0")
    print(f"Berana LMS demo → http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
