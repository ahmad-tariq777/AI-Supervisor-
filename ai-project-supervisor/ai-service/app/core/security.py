import hmac

from fastapi import Header, HTTPException

from app.config import get_settings


def require_service_key(x_service_key: str | None = Header(default=None)) -> None:
    expected = get_settings().ai_service_key
    if not x_service_key or not hmac.compare_digest(
        x_service_key.encode("utf-8"), expected.encode("utf-8")
    ):
        raise HTTPException(
            status_code=401,
            detail={
                "code": "SERVICE_KEY_INVALID",
                "message": "A valid service key is required",
            },
        )
