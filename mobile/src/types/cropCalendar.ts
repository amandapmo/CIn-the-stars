export type PlantingWindow = {
  id: string;
  region: string;
  season: string;
  start_month: number;
  end_month: number;
  start_day: number;
  end_day: number;
  all_year: boolean;
  notes: string;
};

export type CropCalendar = {
  available: boolean;
  country: string;
  region: string;
  crop: string;
  source: string;
  source_url: string;
  last_updated?: string;
  reason?: string;
  windows: PlantingWindow[];
};
