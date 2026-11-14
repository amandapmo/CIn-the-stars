import {
  RecommendationInput,
  RecommendationResult,
  RecommendationError,
} from "../types/recommendation";

// Substituir pela URL real quando o backend estiver disponível.
// No iPhone, localhost não aponta para o computador.
const API_BASE_URL = "https://YOUR-API-URL";

export async function getRecommendation(
  input: RecommendationInput,
): Promise<RecommendationResult> {
  const response = await fetch(`${API_BASE_URL}/api/recommendation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: RecommendationError = await response.json();

    throw new Error(error.details || error.error || "Request failed");
  }

  return (await response.json()) as RecommendationResult;
}
