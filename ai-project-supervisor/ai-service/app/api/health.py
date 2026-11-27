from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.config import Settings, get_settings
from app.core.ollama_client import OllamaClient

router = APIRouter()


def get_ollama_client(settings: Settings = Depends(get_settings)) -> OllamaClient:
    return OllamaClient(settings)


@router.get("/health")
async def health(client: OllamaClient = Depends(get_ollama_client)) -> JSONResponse:
    ollama = await client.status()
    healthy = ollama["reachable"] and ollama["modelInstalled"]
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "ok" if healthy else "degraded",
            "service": "ai-service",
            "ollama": ollama,
        },
    )
