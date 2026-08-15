"""
Brana LMS API - application entrypoint.

This wires together: CORS, correlation-id middleware, global exception
handlers, and the versioned API router. Individual business logic lives
in app/modules/*, never here.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.common.middleware import CorrelationIdMiddleware
from app.core.config import settings
from app.core.exceptions import register_exception_handlers

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Brana LMS - modular monolith backend (Cyber-Zeb Consulting)",
)

app.add_middleware(CorrelationIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": settings.APP_NAME}
