from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.security import require_service_key

guarded = FastAPI()


@guarded.get("/guarded", dependencies=[Depends(require_service_key)])
def guarded_route():
    return {"ok": True}


def test_rejects_missing_key():
    response = TestClient(guarded).get("/guarded")
    assert response.status_code == 401


def test_rejects_wrong_key():
    response = TestClient(guarded).get("/guarded", headers={"X-Service-Key": "wrong-key-value"})
    assert response.status_code == 401


def test_accepts_correct_key():
    response = TestClient(guarded).get(
        "/guarded", headers={"X-Service-Key": "test-service-key-123"}
    )
    assert response.status_code == 200
