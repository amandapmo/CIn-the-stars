export type WeatherLocation = {
  label: string;
  latitude: number;
  longitude: number;
  origin: "city" | "gps" | "demo";
};

export type WeatherDay = {
  date: string;
  code: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbability: number | null;
  precipitationMm: number | null;
};

export type WeatherForecast = {
  location: WeatherLocation;
  timezone: string;
  retrievedAt: string;
  days: WeatherDay[];
};

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
