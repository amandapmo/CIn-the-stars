import asyncio
import os
import re
import unicodedata
from calendar import monthrange
from time import monotonic
from typing import Annotated
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, HTTPException, Query


router = APIRouter()
FAO_BASE_URL = "https://api-cropcalendar.apps.fao.org/api/v1"
SOURCE_URL = "https://cropcalendar.apps.fao.org/"
REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = (
    "CIn-the-Stars/1.0 "
    "(https://github.com/amandapmo/CIn-the-stars)"
)
CROP_IDS = {
    "Corn": {"0338"},
    "Cassava": {"0076"},
    "Cowpea": {"0117"},
    "Soybean": {"0327", "0326"},
    "Wheat": {"0372", "0373"},
    "Quinoa": {"0292"},
    "Potato": {"0283"},
}
BRAZIL_REGIONS = {
    "001": (
        "AC AP AM PA RO RR TO Acre Amapá Amazonas Pará Rondônia "
        "Roraima Tocantins"
    ),
    "002": (
        "AL BA CE MA PB PE PI RN SE Alagoas Bahia Ceará Maranhão Paraíba "
        "Pernambuco Piauí Rio Grande do Norte Sergipe"
    ),
    "003": "DF GO MT MS Distrito Federal Goiás Mato Grosso Mato Grosso do Sul",
    "004": "ES MG RJ SP Espírito Santo Minas Gerais Rio de Janeiro São Paulo",
    "005": "PR RS SC Paraná Rio Grande do Sul Santa Catarina",
}
FAO_CACHE: dict[str, tuple[float, list]] = {}
GEOCODE_CACHE: dict[tuple[str, float, float], tuple[float, str, str]] = {}
GEOCODE_LOCK = asyncio.Lock()
last_geocode_request = 0.0


def normalized(value: str) -> str:
    return " ".join(
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore").decode().casefold().split()
    )


async def fao_data(client: httpx.AsyncClient, path: str) -> list:
    cached = FAO_CACHE.get(path)
    if cached and cached[0] > monotonic():
        return cached[1]
    response = await client.get(
        f"{FAO_BASE_URL}/{path}", params={"language": "en"},
    )
    if response.status_code == 404:
        return []
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list) or len(data) > 20000:
        raise ValueError("Invalid crop calendar response")
    if len(FAO_CACHE) >= 64:
        FAO_CACHE.pop(next(iter(FAO_CACHE)))
    FAO_CACHE[path] = (monotonic() + 3600, data)
    return data


async def resolve_region(
    client: httpx.AsyncClient, latitude: float, longitude: float,
) -> tuple[str, str]:
    global last_geocode_request
    reverse_url = os.getenv("NOMINATIM_REVERSE_URL", REVERSE_URL)
    endpoint = urlsplit(reverse_url)
    if endpoint.scheme != "https" or not endpoint.netloc:
        raise ValueError("Reverse-geocoding endpoint must use HTTPS")
    point = (round(latitude, 2), round(longitude, 2))
    cache_key = (reverse_url, *point)
    async with GEOCODE_LOCK:
        cached = GEOCODE_CACHE.get(cache_key)
        if cached and cached[0] > monotonic():
            return cached[1], cached[2]
        delay = 1.05 - (monotonic() - last_geocode_request)
        if delay > 0:
            await asyncio.sleep(delay)
        last_geocode_request = monotonic()
        response = await client.get(
            reverse_url,
            params={
                "lat": str(point[0]), "lon": str(point[1]),
                "format": "jsonv2", "zoom": 5,
                "addressdetails": 1, "accept-language": "en",
            },
        )
        response.raise_for_status()
        address = response.json().get("address", {})
        country = str(address.get("country_code", "")).upper()
        region = str(address.get("state", address.get("region", "")))
        if not re.fullmatch(r"[A-Z]{2}", country):
            raise ValueError("Country could not be resolved")
        if len(GEOCODE_CACHE) >= 256:
            GEOCODE_CACHE.pop(next(iter(GEOCODE_CACHE)))
        GEOCODE_CACHE[cache_key] = (monotonic() + 3600, country, region)
        asyncio.get_running_loop().call_later(
            3600, GEOCODE_CACHE.pop, cache_key, None,
        )
        return country, region


def matching_zones(country: str, region: str, zones: list) -> set[str]:
    target = normalized(region)
    if not target:
        return set()
    matches = set()
    for zone in zones:
        if not isinstance(zone, dict):
            continue
        zone_id = str(zone.get("zone_id", ""))
        names = [str(zone.get("name", ""))]
        if country == "BR":
            names.append(BRAZIL_REGIONS.get(zone_id, ""))
        names.append(str(zone.get("administratrative_units", "")))
        if any(
            target == normalized(name)
            or f" {target} " in f" {normalized(name)} "
            for name in names if name
        ):
            matches.add(zone_id)
    return matches


def parse_date(value: object) -> tuple[int, int] | None:
    if not isinstance(value, dict):
        return None
    try:
        month, day = int(value["month"]), int(value["day"])
    except (KeyError, TypeError, ValueError):
        return None
    if 1 <= month <= 12 and 1 <= day <= monthrange(2000, month)[1]:
        return month, day
    return None


def calendar_windows(
    country: str, crop: str, records: list, zone_ids: set[str],
) -> tuple[list, set[str]]:
    windows = []
    dates = set()
    for record in records:
        if not isinstance(record, dict):
            continue
        if record.get("id_country") not in {None, country}:
            continue
        record_crop = record.get("crop", {})
        zone = record.get("aez", {})
        if not isinstance(record_crop, dict) or not isinstance(zone, dict):
            continue
        crop_id = str(record_crop.get("id", ""))
        zone_id = str(zone.get("id", ""))
        if crop_id not in CROP_IDS[crop]:
            continue
        if zone_ids and zone_id not in zone_ids:
            continue
        sessions = record.get("sessions", [])
        if not isinstance(sessions, list):
            continue
        for index, session in enumerate(sessions):
            if not isinstance(session, dict):
                continue
            source_all_year = str(session.get("all_year", "")).lower() == "yes"
            start = parse_date(session.get("early_sowing"))
            end = parse_date(session.get("later_sowing"))
            if source_all_year and start is None and end is None:
                start, end = (1, 1), (12, 31)
            if not start or not end:
                continue
            all_year = source_all_year and start == (1, 1) and end == (12, 31)
            notes = str(session.get("comments", ""))
            if source_all_year and not all_year:
                notes += (
                    " The source also marks all_year=yes; its explicit "
                    "sowing dates are shown here."
                )
            windows.append({
                "id": f"{country}:{crop_id}:{zone_id}:{index}",
                "region": str(zone.get("name", "")),
                "season": str(session.get("additional_information", "")),
                "start_month": start[0], "end_month": end[0],
                "start_day": start[1], "end_day": end[1],
                "all_year": all_year,
                "notes": notes,
            })
            if record.get("lastUpdated"):
                dates.add(str(record["lastUpdated"]))
    return windows, dates


@router.get("/api/crop-calendar")
async def crop_calendar(
    crop: Annotated[str, Query(max_length=40)],
    country: Annotated[str, Query(pattern=r"^[a-zA-Z]{2}$")] | None = None,
    region: Annotated[str, Query(max_length=150)] = "",
    lat: Annotated[float, Query(ge=-90, le=90)] | None = None,
    lon: Annotated[float, Query(ge=-180, le=180)] | None = None,
) -> dict:
    country = country.upper() if country else ""
    result = {
        "available": False, "country": country, "region": region,
        "crop": crop, "source": "FAO Crop Calendar",
        "source_url": SOURCE_URL, "windows": [],
    }
    if crop not in CROP_IDS:
        return dict(result, reason="unsupported_crop")
    if not country and (lat is None or lon is None):
        return dict(result, reason="location_required")
    try:
        async with httpx.AsyncClient(
            timeout=12, headers={"User-Agent": USER_AGENT},
        ) as client:
            if not country:
                country, region = await resolve_region(client, lat, lon)
                result.update(country=country, region=region)
            records = await fao_data(
                client, f"countries/{country}/cropCalendar",
            )
            if not records:
                return dict(result, reason="no_calendar")
            zones = await fao_data(client, f"countries/{country}/aez")
            zone_ids = matching_zones(country, region, zones)
            windows, dates = calendar_windows(country, crop, records, zone_ids)
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        raise HTTPException(
            503, "O calendário agrícola está temporariamente indisponível.",
        ) from None
    if not windows:
        return dict(result, reason="no_calendar")
    result.update(available=True, windows=windows)
    if dates:
        result["last_updated"] = "; ".join(sorted(dates))
    if len(zone_ids) != 1:
        result["reason"] = "region_selection_required"
    return result
