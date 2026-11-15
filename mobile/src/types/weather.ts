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
