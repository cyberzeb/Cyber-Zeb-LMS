"""
Application-level exceptions and their FastAPI handlers.

Every module should raise these instead of returning ad-hoc error
shapes, so API consumers get a consistent error object (Section 15.3).
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "app_error"

    def __init__(self, detail: str, error_code: str | None = None):
        self.detail = detail
        if error_code:
            self.error_code = error_code
        super().__init__(detail)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    error_code = "conflict"


class ValidationAppError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "validation_error"


class PermissionDeniedError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "permission_denied"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        correlation_id = getattr(request.state, "correlation_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.detail,
                    "correlation_id": correlation_id,
                    "details": [],
                }
            },
        )

    from fastapi import HTTPException

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        correlation_id = getattr(request.state, "correlation_id", None)
        detail = exc.detail
        if isinstance(detail, dict):
            message = str(detail.get("message") or detail)
        else:
            message = str(detail)
        code = "http_error"
        if exc.status_code == 401:
            code = "unauthorized"
        elif exc.status_code == 403:
            code = "permission_denied"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "correlation_id": correlation_id,
                    "details": [],
                }
            },
            headers=getattr(exc, "headers", None),
        )
