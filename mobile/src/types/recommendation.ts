export type PreviousCrop =
  | "Corn"
  | "Cassava"
  | "Cowpea"
  | "Forage Cactus"
  | "None";

export type RecommendationInput = {
  lat: number;
  lon: number;
  planting_month: number;
  previous_crop: PreviousCrop;
};

export type RecommendationResult = {
  suggested_crop: string;
  frost_risk: "None" | "High";
  justification: string;
};

export type RecommendationError = {
  error: string;
  details: string;
};
