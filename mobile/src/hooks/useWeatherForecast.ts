import { useCallback, useEffect, useRef, useState } from "react";
import { getWeatherForecast } from "../services/weatherApi";
import type { WeatherForecast, WeatherLocation } from "../types/weather";

export type WeatherState =
  | { status: "idle" }
  | { status: "loading"; location: WeatherLocation }
  | { status: "success"; forecast: WeatherForecast }
  | { status: "error"; location: WeatherLocation; message: string };

export function useWeatherForecast() {
  const [state, setState] = useState<WeatherState>({ status: "idle" });
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  const load = useCallback((location: WeatherLocation) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setState({ status: "loading", location });
    void getWeatherForecast(location, { signal: controller.signal }).then(
      (forecast) => {
        if (!controller.signal.aborted)
          setState({ status: "success", forecast });
      },
      (error) => {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            location,
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
