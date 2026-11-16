import { useEffect, useState } from "react";
import apiClient from "../api/client";
import type { CropCalendar, PlantingWindow } from "../types/cropCalendar";
import type { WeatherLocation } from "../types/weather";

export function useCropCalendar(
  crop: string,
  location: WeatherLocation | null,
) {
  const [result, setResult] = useState<{
    key: string;
    calendar: CropCalendar | null;
    error: string | null;
  } | null>(null);
  const [selected, setSelected] = useState<{ key: string; id: string } | null>(
    null,
  );
  const [retry, setRetry] = useState(0);
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const country = location?.countryCode;
  const region = location?.adminRegion;
  const blocked =
    location?.origin === "gps" &&
    !/^https:\/\//i.test(apiClient.defaults.baseURL ?? "");
  const enabled =
    !blocked &&
    latitude !== undefined &&
    longitude !== undefined &&
    crop !== "None";
  const key = JSON.stringify([
    crop,
    latitude,
    longitude,
    country,
    region,
    retry,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void apiClient
      .get<CropCalendar>("/api/crop-calendar", {
        params: {
          crop,
          country,
          region,
          ...(!country ? { lat: latitude, lon: longitude } : {}),
        },
        signal: controller.signal,
        timeout: 40000,
      })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        if (
          typeof data.available !== "boolean" ||
          !Array.isArray(data.windows) ||
          typeof data.source_url !== "string" ||
          !data.windows.every(
            (window: PlantingWindow) =>
              typeof window.id === "string" &&
              Number.isInteger(window.start_month) &&
              window.start_month >= 1 &&
              window.start_month <= 12 &&
              Number.isInteger(window.end_month) &&
              window.end_month >= 1 &&
              window.end_month <= 12 &&
              Number.isInteger(window.start_day) &&
              window.start_day >= 1 &&
              window.start_day <= 31 &&
              Number.isInteger(window.end_day) &&
              window.end_day >= 1 &&
              window.end_day <= 31 &&
              typeof window.region === "string" &&
              typeof window.notes === "string" &&
              typeof window.all_year === "boolean",
          )
        )
          throw new Error("Invalid calendar");
        setResult({ key, calendar: data, error: null });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            key,
            calendar: null,
            error:
              "Não foi possível consultar o calendário. Confira a conexão e o backend.",
          });
      });
    return () => controller.abort();
  }, [crop, latitude, longitude, country, region, enabled, key]);

  const calendar = enabled && result?.key === key ? result.calendar : null;
  const automatic =
    calendar?.windows.length === 1 &&
    calendar.reason !== "region_selection_required"
      ? calendar.windows[0]
      : null;
  const window =
    selected?.key === key
      ? (calendar?.windows.find((window) => window.id === selected.id) ?? null)
      : automatic;

  return {
    calendar,
    window,
    selectWindow: (id: string) => setSelected({ key, id }),
    loading: enabled && result?.key !== key,
    error: blocked
      ? "Para usar a posição do aparelho no calendário, configure a API com HTTPS ou escolha um município."
      : enabled && result?.key === key
        ? result.error
        : null,
    retry: () => setRetry((value) => value + 1),
  };
}
