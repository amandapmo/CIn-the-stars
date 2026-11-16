import pytest
from fastapi.testclient import TestClient

import main


@pytest.mark.parametrize("origin", [
    "http://localhost:8112", "http://127.0.0.1:8112",
    "http://192.168.1.12:8081", "http://10.0.0.5:8081",
    "http://172.16.0.2:8081", "http://[::1]:8081",
])
def test_local_web_preflight_allows_chat_upload(origin):
    with TestClient(main.app) as client:
        response = client.options("/api/chat", headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert "access-control-allow-credentials" not in response.headers


@pytest.mark.parametrize("origin", [
    "https://untrusted.example", "http://localhost.attacker.example:8112",
    "http://192.168.1.1.attacker.example", "null",
])
def test_untrusted_origin_is_not_allowed(origin):
    with TestClient(main.app) as client:
        response = client.options("/api/chat", headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
        })
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_recommendation_router_is_mounted():
    with TestClient(main.app) as client:
        response = client.post("/api/recommendation", json={})
    assert response.status_code == 422
