from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery("brana", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

# Register scheduled tasks
celery_app.conf.beat_schedule = {
    "scheduled-backup": {
        "task": "backup.run_scheduled",
        # Default: daily at 02:00 UTC; override with BACKUP_SCHEDULE_CRON
        "schedule": crontab(minute=0, hour=2),
    },
}
celery_app.conf.timezone = "UTC"

# Auto-discover tasks so Celery finds them on worker startup
celery_app.autodiscover_tasks(["app.modules.onboarding"])
