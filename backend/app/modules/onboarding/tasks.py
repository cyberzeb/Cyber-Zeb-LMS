"""
Celery beat tasks for scheduled operations.
Register via celery_app.conf.beat_schedule in celery_app.py.
"""
from __future__ import annotations

import asyncio
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="backup.run_scheduled")
def run_scheduled_backup() -> dict:
    """Triggered by Celery Beat on BACKUP_SCHEDULE_CRON."""
    async def _run():
        from app.core.database import AsyncSessionLocal
        from app.modules.onboarding import features_service as fs

        async with AsyncSessionLocal() as db:
            result = await fs.trigger_backup(db, admin=None, triggered_by="scheduled")
            return {"status": result.status, "id": str(result.id)}

    return asyncio.run(_run())
