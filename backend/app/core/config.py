"""
Central application configuration.

All environment-dependent values MUST come from here. Never hardcode
secrets, provider keys, or environment-specific URLs anywhere else in
the codebase (Blueprint Section 16 - Secrets).
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    APP_NAME: str = "Berana LMS API"
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
    STORAGE_BUCKET: str = "berana-lms-files"
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
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    # Prefer Gmail App Password (not the account password).
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""
    SMS_PROVIDER_API_KEY: str = ""

    # --- Onboarding / Super Admin ---
    SUPER_ADMIN_NOTIFY_EMAIL: str = "mekashabetel@gmail.com"
    PLATFORM_SUPER_ADMIN_EMAIL: str = "mekashabetel@gmail.com"
    PLATFORM_SUPER_ADMIN_PASSWORD: str = ""  # seed only; never hardcode in source
    FRONTEND_BASE_URL: str = "http://localhost:5173"
    PUBLIC_BASE_DOMAIN: str = "berana-lms.com"

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production", "false", "0", "no", "off"}:
                return False
            if normalized in {"dev", "development", "true", "1", "yes", "on"}:
                return True
        return value


@lru_cache
def get_settings() -> Settings:
    """Settings are cached so .env is parsed once per process."""
    return Settings()


settings = get_settings()
