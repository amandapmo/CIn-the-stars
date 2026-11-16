import os
from pathlib import Path
from typing import Annotated, AsyncIterator

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.agent_chat import router as chat_router
from services.crop_calendar import router as crop_calendar_router
from services.recommendation import router as recommendation_router
from services.google_weather import (
    WeatherProviderError,
    normalize_current_conditions,
    request_current_conditions,
)

load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="CIn the Stars API")
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=None if cors_origins else (
        r"https?://(?:localhost|127\.0\.0\.1|\[::1\]|"
        r"10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|"
        r"172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d{1,5})?"
    ),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(chat_router)
app.include_router(crop_calendar_router)
app.include_router(recommendation_router)


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
