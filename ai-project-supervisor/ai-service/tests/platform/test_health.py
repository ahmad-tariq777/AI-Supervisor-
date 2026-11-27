from fastapi.testclient import TestClient

from app.api.health import get_ollama_client
from app.main import app


class FakeClient:
    def __init__(self, status: dict) -> None:
        self._status = status

    async def status(self) -> dict:
        return self._status


def test_health_degraded_when_ollama_unreachable():
    app.dependency_overrides.clear()
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "degraded"
    assert body["ollama"]["reachable"] is False


def test_health_ok_when_model_installed():
    app.dependency_overrides[get_ollama_client] = lambda: FakeClient(
        {"reachable": True, "model": "llama3.2:3b", "modelInstalled": True}
    )
    try:
        with TestClient(app) as client:
            response = client.get("/health")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_degraded_when_model_missing():
    app.dependency_overrides[get_ollama_client] = lambda: FakeClient(
        {"reachable": True, "model": "llama3.2:3b", "modelInstalled": False}
    )
    try:
        with TestClient(app) as client:
            response = client.get("/health")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 503
    assert response.json()["ollama"]["modelInstalled"] is False


def test_request_id_is_echoed_and_generated():
    app.dependency_overrides.clear()
    with TestClient(app) as client:
        echoed = client.get("/health", headers={"X-Request-Id": "abc12345-req"})
        generated = client.get("/health")
    assert echoed.headers["X-Request-Id"] == "abc12345-req"
    assert len(generated.headers["X-Request-Id"]) >= 8
