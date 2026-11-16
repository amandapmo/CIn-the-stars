import type {
  CurrentWeather,
  WeatherForecast,
  WeatherLocation,
} from "../types/weather";

type RequestOptions = { signal?: AbortSignal; days?: number };
type ErrorCode = "INPUT" | "HTTP" | "NETWORK" | "TIMEOUT" | "RESPONSE";

export class WeatherApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WeatherApiError";
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new WeatherApiError(
    "RESPONSE",
    "O serviço retornou dados incompletos. Tente novamente.",
  );
}

async function requestJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) {
    const error = new Error("Consulta cancelada");
    error.name = "AbortError";
    throw error;
  }
  signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherApiError(
        "HTTP",
        response.status === 429
          ? "O serviço está recebendo muitas consultas. Tente mais tarde."
          : "O serviço de previsão está indisponível. Tente novamente.",
      );
    }
    try {
      return await response.json();
    } catch {
      if (controller.signal.aborted) throw new Error("Consulta cancelada");
      return invalidResponse();
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut)
      throw new WeatherApiError(
        "TIMEOUT",
        "A consulta demorou demais. Tente novamente.",
      );
    if (error instanceof WeatherApiError) throw error;
    throw new WeatherApiError(
      "NETWORK",
      "Não foi possível consultar a previsão. Confira sua conexão.",
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function approximateLocation(
  location: WeatherLocation,
): WeatherLocation {
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.latitude) > 90 ||
    Math.abs(location.longitude) > 180
  ) {
    throw new WeatherApiError("INPUT", "Localização inválida.");
  }
  return {
    label: location.label,
    origin: location.origin,
    latitude: Math.round(location.latitude * 100) / 100,
    longitude: Math.round(location.longitude * 100) / 100,
    ...(typeof location.countryCode === "string" &&
    /^[A-Z]{2}$/.test(location.countryCode)
      ? { countryCode: location.countryCode }
      : {}),
    ...(typeof location.adminRegion === "string" &&
    location.adminRegion.length <= 100
      ? { adminRegion: location.adminRegion }
      : {}),
  };
}

export async function getWeatherForecast(
  location: WeatherLocation,
  { signal, days = 15 }: RequestOptions = {},
): Promise<WeatherForecast> {
  const approximate = approximateLocation(location);
  if (!Number.isInteger(days) || days < 1 || days > 16) {
    throw new WeatherApiError(
      "INPUT",
      "O período deve estar entre 1 e 16 dias.",
    );
  }
  const query = new URLSearchParams({
    latitude: String(approximate.latitude),
    longitude: String(approximate.longitude),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
    timezone: "auto",
    forecast_days: String(days),
    temperature_unit: "celsius",
    precipitation_unit: "mm",
  });
  const data = await requestJson(
    `https://api.open-meteo.com/v1/forecast?${query}`,
    signal,
  );
  if (
    !record(data) ||
    !record(data.daily) ||
    !record(data.daily_units) ||
    typeof data.timezone !== "string" ||
    !data.timezone
  )
    return invalidResponse();
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: data.timezone });
  } catch {
    return invalidResponse();
  }
  const units = data.daily_units;
  if (
    units.temperature_2m_max !== "°C" ||
    units.temperature_2m_min !== "°C" ||
    units.precipitation_probability_max !== "%" ||
    units.precipitation_sum !== "mm"
  )
    return invalidResponse();
  const daily = data.daily;
  if (
    !Array.isArray(daily.time) ||
    !daily.time.length ||
    daily.time.length > days
  )
    return invalidResponse();
  const fields = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "precipitation_sum",
  ];
  const columns = fields.map((field) => {
    const values = daily[field];
    if (
      !Array.isArray(values) ||
      values.length !== (daily.time as unknown[]).length ||
      !values.every(
        (value) =>
          value === null ||
          (typeof value === "number" && Number.isFinite(value)),
      )
    )
      return invalidResponse();
    return values as (number | null)[];
  });
  let previous = "";
  const forecastDays = daily.time.map((date: unknown, index: number) => {
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) ||
      new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date ||
      date <= previous
    )
      return invalidResponse();
    previous = date;
    const [code, max, min, probability, precipitation] = columns.map(
      (column) => column[index],
    );
    if (
      (probability !== null && (probability < 0 || probability > 100)) ||
      (precipitation !== null && precipitation < 0) ||
      (max !== null && min !== null && max < min) ||
      (code !== null && !Number.isInteger(code))
    )
      return invalidResponse();
    return {
      date,
      code,
      temperatureMax: max,
      temperatureMin: min,
      precipitationProbability: probability,
      precipitationMm: precipitation,
    };
  });
  return {
    location: approximate,
    timezone: data.timezone,
    retrievedAt: new Date().toISOString(),
    days: forecastDays,
  };
}

export async function searchWeatherCities(
  query: string,
  signal?: AbortSignal,
): Promise<WeatherLocation[]> {
  const name = query.trim();
  if (name.length < 2 || name.length > 100)
    throw new WeatherApiError("INPUT", "Digite o nome do município.");
  const params = new URLSearchParams({
    name,
    count: "20",
    language: "pt",
    format: "json",
  });
  const data = await requestJson(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    signal,
  );
  if (!record(data)) return invalidResponse();
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) return invalidResponse();
  return data.results.map((city: unknown) => {
    if (
      !record(city) ||
      typeof city.name !== "string" ||
      typeof city.latitude !== "number" ||
      typeof city.longitude !== "number"
    )
      return invalidResponse();
    const country =
      typeof city.country === "string" && city.country.trim()
        ? city.country
        : city.country_code;
    const label = [city.name, city.admin1, country]
      .filter(
        (part): part is string => typeof part === "string" && part.length > 0,
      )
      .filter((part, index, parts) => parts.indexOf(part) === index)
      .join(", ");
    return approximateLocation({
      label,
      latitude: city.latitude,
      longitude: city.longitude,
      origin: "city",
      countryCode:
        typeof city.country_code === "string"
          ? city.country_code.toUpperCase()
          : undefined,
      adminRegion: typeof city.admin1 === "string" ? city.admin1 : undefined,
    });
  });
}

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
