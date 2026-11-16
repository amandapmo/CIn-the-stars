import { useRef, useState } from "react";
import {
  getCropRecommendation,
  RecommendationRequest,
  RecommendationResponse,
} from "../api/recommendation";

export const useRecommendation = () => {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchRecommendation = async (params: RecommendationRequest) => {
    const currentRequest = ++requestId.current;
    setData(null);
    setLoading(true);
    setError(null);
    try {
      const response = await getCropRecommendation(params);
      if (requestId.current === currentRequest) setData(response);
    } catch (err: unknown) {
      if (requestId.current === currentRequest)
        setError(
          err instanceof Error ? err.message : "Erro ao buscar recomendação",
        );
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchRecommendation,
  };
};
