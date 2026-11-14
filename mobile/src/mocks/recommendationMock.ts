import {
  RecommendationInput,
  RecommendationResult,
} from "../types/recommendation";

export type Scenario = {
  id: "A" | "B";
  label: string;
  input: RecommendationInput;
  result: RecommendationResult;
};

export const scenarios: Record<"A" | "B", Scenario> = {
  A: {
    id: "A",
    label: "Scenario A",
    input: {
      lat: -9.3828,
      lon: -40.5028,
      planting_month: 1,
      previous_crop: "Corn",
    },
    result: {
      suggested_crop: "Cassava",
      frost_risk: "None",
      justification:
        "Demonstration: Cassava is shown as a possible crop following Corn. Actual suitability must be validated against local conditions and NASA data.",
    },
  },
  B: {
    id: "B",
    label: "Scenario B",
    input: {
      lat: -9.3828,
      lon: -40.5028,
      planting_month: 1,
      previous_crop: "Cowpea",
    },
    result: {
      suggested_crop: "NONE (Climatic Fallow)",
      frost_risk: "High",
      justification:
        "Demonstration: High climate risk triggers a climatic fallow recommendation instead of suggesting a crop.",
    },
  },
};
