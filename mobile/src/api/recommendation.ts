import apiClient from './client'; 

export interface RecommendationRequest {
  lat: number;
  lon: number;
  planting_month: number;
  previous_crop: 'Corn' | 'Cassava' | 'Cowpea' | 'Forage Cactus' | 'Soybean' | 'Wheat' | 'Quinoa' | 'Potato' | 'None';
}

    export interface RecommendationResponse {
    recommendation_status: string;
  ml_top5?: string[];
  message?: string;
  error?: string;
  details?: string;
}

export const getCropRecommendation = async (data: RecommendationRequest): Promise<RecommendationResponse> => {
  try {
    const response = await apiClient.post<RecommendationResponse>('/api/recommendation', data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data as RecommendationResponse;
    }
    throw new Error('Falha na comunicação com o servidor. O backend FastAPI está rodando?');
  }
};  