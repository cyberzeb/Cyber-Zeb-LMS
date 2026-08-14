"""
Request correlation ID middleware.

Section 15.3: "Return correlation IDs and log them for support."
Every response carries an X-Correlation-ID header; every log line in
this request's lifecycle should include it (wire this into whatever
structured logger the team adopts in core/logging_config.py).
"""
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
