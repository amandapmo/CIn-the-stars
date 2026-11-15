from collections.abc import Mapping
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

import main
from services.google_weather import GOOGLE_WEATHER_URL


@pytest.fixture
def weather_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("GOOGLE_WEATHER_API_KEY", "test-key")

    def client_for(handler):
        async def override_google_client():
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                yield client

        main.app.dependency_overrides[main.get_google_client] = (
            override_google_client
        )
        return TestClient(main.app)

    yield client_for
    main.app.dependency_overrides.clear()


def google_weather_response(**overrides: Any) -> dict[str, Any]:
    response: dict[str, Any] = {
        "currentTime": "2026-11-15T12:00:00Z",
        "timeZone": {"id": "America/Recife"},
        "weatherCondition": {"description": {"text": "Sunny"}},
        "temperature": {"degrees": 31.5, "unit": "CELSIUS"},
        "feelsLikeTemperature": {"degrees": 34, "unit": "CELSIUS"},
        "relativeHumidity": 65,
        "precipitation": {
            "probability": {"percent": 20},
            "qpf": {"quantity": 0.4, "unit": "MILLIMETERS"},
        },
        "wind": {
            "speed": {"value": 8, "unit": "KILOMETERS_PER_HOUR"}
        },
    }
    response.update(overrides)
    return response


def test_current_weather_normalizes_google_response_and_request(
    weather_client,
):
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url).startswith(GOOGLE_WEATHER_URL)
        assert request.url.params["key"] == "test-key"
        assert request.url.params["location.latitude"] == "-9.3828"
        assert request.url.params["location.longitude"] == "-40.5028"
        assert request.url.params["unitsSystem"] == "METRIC"
        assert request.url.params["languageCode"] == "en"
        return httpx.Response(200, json=google_weather_response())

    with weather_client(handler) as client:
        response = client.get(
            "/api/weather/current?lat=-9.3828&lon=-40.5028"
        )

    assert response.status_code == 200
    assert response.json() == {
        "latitude": -9.3828,
        "longitude": -40.5028,
        "temperature_c": 31.5,
        "feels_like_c": 34,
        "humidity_percent": 65,
        "condition": "Sunny",
        "precipitation_probability_percent": 20,
        "precipitation_mm": 0.4,
        "wind_speed_kmh": 8,
        "observed_at": "2026-11-15T12:00:00Z",
        "time_zone_id": "America/Recife",
        "source": "Google Weather API",
    }


@pytest.mark.parametrize(
    ("lat", "lon"),
    [("-90.1", "0"), ("90.1", "0"), ("0", "-180.1"), ("0", "180.1")],
)
def test_invalid_coordinates_return_validation_error(
    weather_client, lat: str, lon: str
):
    with weather_client(
        lambda _request: httpx.Response(200, json=google_weather_response())
    ) as client:
        response = client.get(
            f"/api/weather/current?lat={lat}&lon={lon}"
        )

    assert response.status_code == 422


def test_missing_api_key_returns_configuration_error(
    weather_client, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.delenv("GOOGLE_WEATHER_API_KEY")

    with weather_client(
        lambda _request: httpx.Response(200, json=google_weather_response())
    ) as client:
        response = client.get("/api/weather/current?lat=0&lon=0")

    assert response.status_code == 503
    assert response.json() == {"detail": "Weather service is not configured."}


@pytest.mark.parametrize(
    ("status_code", "expected_status"),
    [(403, 502), (429, 503), (500, 502)],
)
def test_google_errors_are_sanitized(
    weather_client, status_code: int, expected_status: int
):
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code,
            json={"error": {"message": "sensitive upstream details"}},
        )

    with weather_client(handler) as client:
        response = client.get("/api/weather/current?lat=0&lon=0")

    assert response.status_code == expected_status
    assert "sensitive upstream details" not in response.text
    assert "test-key" not in response.text


def test_google_timeout_returns_gateway_timeout(weather_client):
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("private request details")

    with weather_client(handler) as client:
        response = client.get("/api/weather/current?lat=0&lon=0")

    assert response.status_code == 504
    assert "private request details" not in response.text
    assert "test-key" not in response.text


def test_invalid_google_response_returns_bad_gateway(weather_client):
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"not-json")

    with weather_client(handler) as client:
        response = client.get("/api/weather/current?lat=0&lon=0")

    assert response.status_code == 502
    assert response.json() == {
        "detail": "Weather provider returned an invalid response."
    }


def test_network_failure_returns_sanitized_bad_gateway(weather_client):
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("private connection details")

    with weather_client(handler) as client:
        response = client.get("/api/weather/current?lat=0&lon=0")

    assert response.status_code == 502
    assert "private connection details" not in response.text
    assert "test-key" not in response.text


def test_missing_optional_weather_values_are_null(weather_client):
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "temperature": {"degrees": 24},
                "precipitation": {
                    "probability": {},
                    "qpf": {"quantity": 0.5, "unit": "INCHES"},
                },
                "wind": {"speed": {"value": 4, "unit": "MILES_PER_HOUR"}},
            },
        )

    with weather_client(handler) as client:
        response = client.get("/api/weather/current?lat=0&lon=0")

    assert response.status_code == 200
    data: Mapping[str, Any] = response.json()
    assert data["temperature_c"] is None
    assert data["feels_like_c"] is None
    assert data["humidity_percent"] is None
    assert data["condition"] is None
    assert data["precipitation_probability_percent"] is None
    assert data["precipitation_mm"] is None
    assert data["wind_speed_kmh"] is None
    assert data["observed_at"] is None
    assert data["time_zone_id"] is None
