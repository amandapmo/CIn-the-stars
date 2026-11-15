import { CurrentWeather } from "../types/weather";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const CACHE_DURATION_MS = 60_000;

const weatherCache = new Map<
  string,
  { expiresAt: number; weather: CurrentWeather }
>();

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<CurrentWeather> {
  if (!API_BASE_URL) {
    throw new Error("Weather API base URL is not configured.");
  }

  const cacheKey = `${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.weather;
  }

  const url = new URL("/api/weather/current", `${API_BASE_URL}/`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error("Weather service request failed.");
  }

  const weather = (await response.json()) as CurrentWeather;
  weatherCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_DURATION_MS,
    weather,
  });
  return weather;
}