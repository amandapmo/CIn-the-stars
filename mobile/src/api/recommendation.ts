import { isAxiosError } from "axios";
import apiClient from "./client";

export interface RecommendationRequest {
  lat: number;
  lon: number;
  planting_month: number;
  previous_crop:
    | "Corn"
    | "Cassava"
    | "Cowpea"
    | "Forage Cactus"
    | "Soybean"
    | "Wheat"
    | "Quinoa"
    | "Potato"
    | "None";
}

export interface RecommendationResponse {
  recommendation_status: string;
  ml_top5?: (string | { crop: string; rank: number; reason?: string })[];
  message?: string;
  error?: string;
  details?: string;
}

export const getCropRecommendation = async (
  data: RecommendationRequest,
): Promise<RecommendationResponse> => {
  let result: RecommendationResponse;
  try {
    const response = await apiClient.post<RecommendationResponse>(
      "/api/recommendation",
      data,
    );
    result = response.data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 422) {
        throw new Error(
          "Confira a cultura e a localização antes de tentar novamente.",
        );
      }
      throw new Error(
        "A análise agrícola está indisponível. Tente novamente mais tarde.",
      );
    }
    throw new Error(
      "Falha na comunicação com o servidor. O backend FastAPI está rodando?",
    );
  }
  if (
    !result ||
    typeof result.recommendation_status !== "string" ||
    !["success", "warning"].includes(result.recommendation_status) ||
    result.error
  ) {
    throw new Error(
      "A análise agrícola retornou uma resposta inválida. Tente novamente.",
    );
  }
  return result;
};
