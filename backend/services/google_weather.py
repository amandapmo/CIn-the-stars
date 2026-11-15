import math
from collections.abc import Mapping
from typing import Any

import httpx

GOOGLE_WEATHER_URL = (
    "https://weather.googleapis.com/v1/currentConditions:lookup"
)


class WeatherProviderError(Exception):
    def __init__(self, status_code: int, public_message: str) -> None:
        super().__init__(public_message)
        self.status_code = status_code
        self.public_message = public_message


async def request_current_conditions(
    client: httpx.AsyncClient, api_key: str, latitude: float, longitude: float
) -> Mapping[str, Any]:
    try:
        response = await client.get(
            GOOGLE_WEATHER_URL,
            params={
                "key": api_key,
                "location.latitude": latitude,
                "location.longitude": longitude,
                "unitsSystem": "METRIC",
                "languageCode": "en",
            },
        )
    except httpx.TimeoutException:
        raise WeatherProviderError(
            504, "Weather provider timed out."
        ) from None
    except httpx.RequestError:
        raise WeatherProviderError(
            502, "Weather provider is unavailable."
        ) from None

    if response.status_code == 429:
        raise WeatherProviderError(
            503, "Weather provider quota is temporarily unavailable."
        )
    if response.status_code != 200:
        raise WeatherProviderError(502, "Weather provider returned an error.")

    try:
        payload = response.json()
    except ValueError:
        raise WeatherProviderError(
            502, "Weather provider returned an invalid response."
        ) from None

    if not isinstance(payload, Mapping):
        raise WeatherProviderError(
            502, "Weather provider returned an invalid response."
        )
    return payload


def _object(value: Any) -> Mapping[str, Any]:
    return value if isinstance(value, Mapping) else {}


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def _percentage(value: Any) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value if 0 <= value <= 100 else None


def _metric_quantity(value: Any, expected_unit: str) -> float | None:
    measurement = _object(value)
    if measurement.get("unit") != expected_unit:
        return None
    return _number(measurement.get("quantity"))


def _metric_value(value: Any, expected_unit: str) -> float | None:
    measurement = _object(value)
    if measurement.get("unit") != expected_unit:
        return None
    return _number(measurement.get("value"))


def _temperature(value: Any) -> float | None:
    measurement = _object(value)
    if measurement.get("unit") != "CELSIUS":
        return None
    return _number(measurement.get("degrees"))


def normalize_current_conditions(
    payload: Mapping[str, Any], latitude: float, longitude: float
) -> dict[str, Any]:
    condition = _object(_object(payload.get("weatherCondition")).get("description"))
    precipitation = _object(payload.get("precipitation"))
    probability = _object(precipitation.get("probability"))
    wind = _object(payload.get("wind"))
    time_zone = _object(payload.get("timeZone"))
    observed_at = payload.get("currentTime")

    return {
        "latitude": latitude,
        "longitude": longitude,
        "temperature_c": _temperature(payload.get("temperature")),
        "feels_like_c": _temperature(payload.get("feelsLikeTemperature")),
        "humidity_percent": _percentage(payload.get("relativeHumidity")),
        "condition": (
            condition.get("text")
            if isinstance(condition.get("text"), str)
            else None
        ),
        "precipitation_probability_percent": _percentage(
            probability.get("percent")
        ),
        "precipitation_mm": _metric_quantity(
            precipitation.get("qpf"), "MILLIMETERS"
        ),
        "wind_speed_kmh": _metric_value(
            _object(wind.get("speed")), "KILOMETERS_PER_HOUR"
        ),
        "observed_at": observed_at if isinstance(observed_at, str) else None,
        "time_zone_id": (
            time_zone.get("id") if isinstance(time_zone.get("id"), str) else None
        ),
        "source": "Google Weather API",
    }
