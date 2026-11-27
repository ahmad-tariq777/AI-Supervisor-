import logging
import re
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.health import router as health_router
from app.config import get_settings
from app.core.logging import configure_logging, get_logger, log_event, request_id_var

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger("ai-service")

VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")

app = FastAPI(
    title="AI Project Supervisor - AI Service",
    version="0.1.0",
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None,
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    incoming = request.headers.get("x-request-id", "")
    request_id = incoming if VALID_REQUEST_ID.match(incoming) else uuid4().hex
    token = request_id_var.set(request_id)
    started = time.perf_counter()
    try:
        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        log_event(
            logger,
            logging.INFO,
            "request.completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            durationMs=round((time.perf_counter() - started) * 1000, 2),
        )
        return response
    finally:
        request_id_var.reset(token)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    error = detail if isinstance(detail, dict) else {"code": "HTTP_ERROR", "message": str(detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {**error, "requestId": request_id_var.get()}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("request.failed", exc_info=exc, extra={"fields": {"path": request.url.path}})
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong",
                "requestId": request_id_var.get(),
            }
        },
    )


app.include_router(health_router)
