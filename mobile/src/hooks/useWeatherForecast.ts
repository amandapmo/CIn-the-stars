import { useCallback, useEffect, useRef, useState } from "react";
import {
  approximateLocation,
  getWeatherForecast,
} from "../services/weatherApi";
import type { WeatherForecast, WeatherLocation } from "../types/weather";

export type WeatherState =
  | { status: "idle" }
  | { status: "loading"; location: WeatherLocation }
  | { status: "success"; forecast: WeatherForecast }
  | { status: "error"; location: WeatherLocation | null; message: string };

export function useWeatherForecast() {
  const [state, setState] = useState<WeatherState>({ status: "idle" });
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  const load = useCallback((location: WeatherLocation) => {
    active.current?.abort();
    let safeLocation: WeatherLocation;
    try {
      safeLocation = approximateLocation(location);
    } catch {
      setState({
        status: "error",
        location: null,
        message: "Localização inválida. Escolha um município.",
      });
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setState({ status: "loading", location: safeLocation });
    void getWeatherForecast(safeLocation, { signal: controller.signal }).then(
      (forecast) => {
        if (!controller.signal.aborted)
          setState({ status: "success", forecast });
      },
      (error) => {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            location: safeLocation,
            message:
              error instanceof Error
                ? error.message
                : "Não foi possível consultar a previsão.",
          });
        }
      },
    );
  }, []);

  return { state, load };
}
