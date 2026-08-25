"""
Central application configuration.

All environment-dependent values MUST come from here. Never hardcode
secrets, provider keys, or environment-specific URLs anywhere else in
the codebase (Blueprint Section 16 - Secrets).
"""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import URL

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_DIR / ".env"
_SQLITE_PATH = str((_BACKEND_DIR / "brana_lms.db").resolve())


def _default_sqlite_url(driver: str) -> str:
    return URL.create(drivername=driver, database=_SQLITE_PATH).render_as_string(
        hide_password=False
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    # --- App ---
    APP_NAME: str = "Brana LMS API"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # --- Database (SQLite by default so local startup does not require Postgres) ---
    DATABASE_URL: str = _default_sqlite_url("sqlite+aiosqlite")
    DATABASE_URL_SYNC: str = _default_sqlite_url("sqlite")

    # --- Auth ---
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # --- Redis / Queue ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Object storage ---
    STORAGE_ENDPOINT: str = ""
    STORAGE_BUCKET: str = "brana-lms-files"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_REGION: str = ""

    # --- Zoom (Blueprint Section 10) ---
    ZOOM_CLIENT_ID: str = ""
    ZOOM_CLIENT_SECRET: str = ""
    ZOOM_WEBHOOK_SECRET_TOKEN: str = ""
    ZOOM_REDIRECT_URI: str = ""

    # --- Payments (Blueprint Section 13) ---
    PAYMENT_PROVIDER: str = "stripe"
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    CHAPA_SECRET_KEY: str = ""

    # --- Email / SMS (Blueprint Section 12) ---
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMS_PROVIDER_API_KEY: str = ""

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Settings are cached so .env is parsed once per process."""
    return Settings()


settings = get_settings()
