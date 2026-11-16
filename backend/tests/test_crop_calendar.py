import asyncio
from copy import deepcopy
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services import crop_calendar


@pytest.fixture
def geocode_cache(monkeypatch: pytest.MonkeyPatch):
    cache = {}
    monkeypatch.setattr(crop_calendar, "GEOCODE_CACHE", cache)
    monkeypatch.setattr(crop_calendar, "GEOCODE_LOCK", asyncio.Lock())
    monkeypatch.setattr(crop_calendar, "last_geocode_request", 0.0)
    return cache


@pytest.fixture
def calendar_client(monkeypatch: pytest.MonkeyPatch):
    records = [{
        "id_country": "PE",
        "lastUpdated": "19/03/2025",
        "crop": {"id": "0338", "name": "Corn"},
        "aez": {"id": "001", "name": "Coast"},
        "sessions": [{
            "all_year": "no",
            "early_sowing": {"month": "1", "day": "1"},
            "later_sowing": {"month": "2", "day": "28"},
            "comments": "Synthetic fixture using the source schema.",
        }],
    }]
    zones = [{
        "zone_id": "001", "name": "Coast",
        "administratrative_units": "Lima",
    }]

    async def fao_data(_client, path):
        assert path.startswith("countries/PE/")
        return zones if path.endswith("/aez") else records

    reverse = AsyncMock(side_effect=AssertionError("Unexpected geocoding"))
    monkeypatch.setattr(crop_calendar, "fao_data", fao_data)
    monkeypatch.setattr(crop_calendar, "resolve_region", reverse)
    app = FastAPI()
    app.include_router(crop_calendar.router)
    with TestClient(app) as client:
        yield client, records, reverse


def test_global_country_calendar_uses_generic_corn_and_city_metadata(
    calendar_client,
):
    client, records, reverse = calendar_client
    sweet_corn = deepcopy(records[0])
    sweet_corn["crop"]["id"] = "0113"
    another_country = deepcopy(records[0])
    another_country["id_country"] = "BR"
    records.extend([sweet_corn, another_country])
    response = client.get("/api/crop-calendar", params={
        "crop": "Corn", "country": "pe", "region": "Lima",
    })
    assert response.status_code == 200
    result = response.json()
    assert result["available"] and result["country"] == "PE"
    assert len(result["windows"]) == 1
    assert result["windows"][0]["id"].startswith("PE:0338:")
    assert result["last_updated"] == "19/03/2025"
    assert "reason" not in result
    reverse.assert_not_awaited()


def test_unmatched_region_requires_selection_even_with_one_window(
    calendar_client,
):
    client, _, _ = calendar_client
    result = client.get("/api/crop-calendar", params={
        "crop": "Corn", "country": "PE", "region": "Unknown region",
    }).json()
    assert result["available"] and len(result["windows"]) == 1
    assert result["reason"] == "region_selection_required"
    assert result["region"] == "Unknown region"


def test_missing_location_or_calendar_never_fabricates_windows(
    calendar_client,
):
    client, _, reverse = calendar_client
    for params, reason in [
        ({"crop": "Corn"}, "location_required"),
        ({"crop": "Forage Cactus"}, "unsupported_crop"),
        ({"crop": "Potato", "country": "PE"}, "no_calendar"),
    ]:
        response = client.get("/api/crop-calendar", params=params)
        assert response.status_code == 200
        result = response.json()
        assert not result["available"] and result["windows"] == []
        assert result["reason"] == reason
    reverse.assert_not_awaited()


def test_explicit_sowing_dates_override_conflicting_all_year_flag(
    calendar_client,
):
    client, records, _ = calendar_client
    records[0]["sessions"][0]["all_year"] = "yes"
    result = client.get("/api/crop-calendar", params={
        "crop": "Corn", "country": "PE", "region": "Lima",
    }).json()
    window = result["windows"][0]
    assert (window["start_month"], window["end_month"]) == (1, 2)
    assert not window["all_year"]
    assert "all_year=yes" in window["notes"]


def test_cross_year_full_year_and_invalid_source_dates(calendar_client):
    client, records, _ = calendar_client
    records[0]["sessions"] = [
        {
            "early_sowing": {"month": 11, "day": 15},
            "later_sowing": {"month": 2, "day": 28},
        },
        {
            "all_year": "yes",
            "early_sowing": {"month": 1, "day": 1},
            "later_sowing": {"month": 12, "day": 31},
        },
        {
            "early_sowing": {"month": 13, "day": 1},
            "later_sowing": {"month": 2, "day": 30},
        },
    ]
    windows = client.get("/api/crop-calendar", params={
        "crop": "Corn", "country": "PE", "region": "Lima",
    }).json()["windows"]
    assert len(windows) == 2
    assert (windows[0]["start_month"], windows[0]["end_month"]) == (11, 2)
    assert windows[1]["all_year"]
    assert (windows[1]["start_month"], windows[1]["end_month"]) == (1, 12)


def test_provider_failure_and_invalid_requests_are_safe(
    calendar_client, monkeypatch: pytest.MonkeyPatch,
):
    client, _, reverse = calendar_client
    provider = AsyncMock(side_effect=httpx.ConnectError("Internal detail"))
    monkeypatch.setattr(crop_calendar, "fao_data", provider)
    failure = client.get("/api/crop-calendar", params={
        "crop": "Corn", "country": "PE",
    })
    assert failure.status_code == 503
    assert "Internal detail" not in failure.text
    for params in [
        {"crop": "Corn", "country": "../"},
        {"crop": "Corn", "lat": 100, "lon": 0},
    ]:
        response = client.get("/api/crop-calendar", params=params)
        assert response.status_code == 422
    assert provider.await_count == 1
    reverse.assert_not_awaited()


def test_reverse_url_defined_after_import_and_provider_scoped_cache(
    monkeypatch: pytest.MonkeyPatch, geocode_cache,
):
    requests = []

    def respond(request: httpx.Request):
        requests.append(request)
        assert request.url.params["lat"] == "-8.05"
        assert request.url.params["lon"] == "-34.88"
        country = "br" if request.url.host == "first.example.test" else "us"
        state = "Pernambuco" if country == "br" else "California"
        return httpx.Response(200, json={
            "address": {"country_code": country, "state": state},
        })

    async def verify():
        transport = httpx.MockTransport(respond)
        async with httpx.AsyncClient(transport=transport) as client:
            monkeypatch.setenv(
                "NOMINATIM_REVERSE_URL", "https://first.example.test/reverse",
            )
            first = await crop_calendar.resolve_region(
                client, -8.0476, -34.8771,
            )
            cached = await crop_calendar.resolve_region(
                client, -8.0476, -34.8771,
            )
            assert first == cached == ("BR", "Pernambuco")
            assert len(requests) == 1
            monkeypatch.setenv(
                "NOMINATIM_REVERSE_URL", "https://second.example.test/reverse",
            )
            changed = await crop_calendar.resolve_region(
                client, -8.0476, -34.8771,
            )
            assert changed == ("US", "California")
            assert [request.url.host for request in requests] == [
                "first.example.test", "second.example.test",
            ]
            assert len(geocode_cache) == 2

    asyncio.run(verify())


def test_reverse_url_uses_default_when_environment_is_unset(
    monkeypatch: pytest.MonkeyPatch, geocode_cache,
):
    monkeypatch.delenv("NOMINATIM_REVERSE_URL", raising=False)

    def respond(request: httpx.Request):
        assert str(request.url).startswith(crop_calendar.REVERSE_URL + "?")
        return httpx.Response(200, json={
            "address": {"country_code": "pe", "state": "Lima"},
        })

    async def verify():
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(respond),
        ) as client:
            result = await crop_calendar.resolve_region(client, -12.04, -77.03)
            assert result == ("PE", "Lima")
            assert len(geocode_cache) == 1

    asyncio.run(verify())


def test_reverse_url_rejects_http_without_network_or_cache(
    monkeypatch: pytest.MonkeyPatch, geocode_cache,
):
    monkeypatch.setenv(
        "NOMINATIM_REVERSE_URL", "http://insecure.example.test/reverse",
    )

    def unexpected_request(_request: httpx.Request):
        raise AssertionError("The insecure provider must not be called")

    async def verify():
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(unexpected_request),
        ) as client:
            with pytest.raises(ValueError, match="HTTPS"):
                await crop_calendar.resolve_region(client, -8.05, -34.88)
            assert not geocode_cache

    asyncio.run(verify())
