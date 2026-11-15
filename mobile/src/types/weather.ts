export type CurrentWeather = {
  latitude: number;
  longitude: number;
  temperature_c: number | null;
  feels_like_c: number | null;
  humidity_percent: number | null;
  condition: string | null;
  precipitation_probability_percent: number | null;
  precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  observed_at: string | null;
  time_zone_id: string | null;
  source: "Google Weather API";
};
