import logging

import httpx

from app.config import Settings
from app.core.logging import get_logger, log_event

logger = get_logger(__name__)


class OllamaUnavailableError(Exception):
    pass


def _model_installed(installed: list[str], wanted: str) -> bool:
    if wanted in installed:
        return True
    if ":" not in wanted:
        return f"{wanted}:latest" in installed
    return False


class OllamaClient:
    def __init__(self, settings: Settings) -> None:
        self._base_url = settings.ollama_base_url.rstrip("/")
        self._model = settings.ollama_model
        self._status_timeout = settings.ollama_status_timeout_seconds
        self._generate_timeout = settings.ollama_generate_timeout_seconds

    async def status(self) -> dict:
        result = {
            "reachable": False,
            "model": self._model,
            "modelInstalled": False,
        }
        try:
            async with httpx.AsyncClient(timeout=self._status_timeout) as client:
                response = await client.get(f"{self._base_url}/api/tags")
                response.raise_for_status()
                body = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            log_event(
                logger,
                logging.WARNING,
                "ollama.status_failed",
                error=type(exc).__name__,
            )
            return result

        installed = [item.get("name", "") for item in body.get("models", [])]
        result["reachable"] = True
        result["modelInstalled"] = _model_installed(installed, self._model)
        return result

    async def generate(self, prompt: str, temperature: float = 0.2, num_ctx: int = 4096) -> str:
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature, "num_ctx": num_ctx},
        }
        try:
            async with httpx.AsyncClient(timeout=self._generate_timeout) as client:
                response = await client.post(f"{self._base_url}/api/generate", json=payload)
                response.raise_for_status()
                return response.json()["response"]
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            raise OllamaUnavailableError("Ollama did not return a usable response") from exc
