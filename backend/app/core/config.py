"""
Central application configuration.

All environment-dependent values MUST come from here. Never hardcode
secrets, provider keys, or environment-specific URLs anywhere else in
the codebase (Blueprint Section 16 - Secrets).
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    APP_NAME: str = "Brana LMS API"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # --- Auth ---
    JWT_SECRET_KEY: str
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
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Settings are cached so .env is parsed once per process."""
    return Settings()


settings = get_settings()
