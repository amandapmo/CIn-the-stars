import os
from pathlib import Path
from typing import Annotated, AsyncIterator

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel

from services.google_weather import (
    WeatherProviderError,
    normalize_current_conditions,
    request_current_conditions,
)

load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="CIn the Stars API")


class CurrentWeatherResponse(BaseModel):
    latitude: float
    longitude: float
    temperature_c: float | None
    feels_like_c: float | None
    humidity_percent: int | None
    condition: str | None
    precipitation_probability_percent: int | None
    precipitation_mm: float | None
    wind_speed_kmh: float | None
    observed_at: str | None
    time_zone_id: str | None
    source: str = "Google Weather API"


async def get_google_client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(timeout=httpx.Timeout(8.0)) as client:
        yield client


@app.get("/api/weather/current", response_model=CurrentWeatherResponse)
async def current_weather(
    lat: Annotated[float, Query(ge=-90, le=90)],
    lon: Annotated[float, Query(ge=-180, le=180)],
    client: Annotated[httpx.AsyncClient, Depends(get_google_client)],
) -> CurrentWeatherResponse:
    api_key = os.getenv("GOOGLE_WEATHER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503, detail="Weather service is not configured."
        )

    try:
        upstream = await request_current_conditions(client, api_key, lat, lon)
    except WeatherProviderError as error:
        raise HTTPException(
            status_code=error.status_code, detail=error.public_message
        ) from None

    return normalize_current_conditions(upstream, lat, lon)
