import { useState } from 'react';
import { getCropRecommendation, RecommendationRequest, RecommendationResponse } from '../api/recommendation';

export const useRecommendation = () => {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = async (params: RecommendationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCropRecommendation(params);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar recomendação');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchRecommendation,
  };
};