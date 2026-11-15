import apiClient from './client';

export interface ChatSession {
  thread_id: string;
  session_token: string;
}

export interface ChatResponse extends ChatSession {
  response: string;
  vision: {
    status: string;
    suspected_disease?: string;
    confidence?: number;
    is_definitive_diagnosis: boolean;
  };
  sources: { title: string; url: string }[];
  api_status: string | null;
  retry_after: number;
}

export async function sendChatMessage(
  message: string, crop: string, image: string | null, session: ChatSession | null,
): Promise<ChatResponse> {
  let response;
  try {
    response = await apiClient.post('/api/chat', {
      message, crop,
      ...(image ? { image } : {}),
      ...(session ? { thread_id: session.thread_id } : {}),
    }, {
      headers: session ? { Authorization: `Bearer ${session.session_token}` } : {},
      timeout: 90000, validateStatus: () => true,
    });
  } catch {
    throw new Error('Não foi possível acessar o assistente. Verifique a rede e o servidor.');
  }
  if (!response.data?.thread_id || typeof response.data.response !== 'string') {
    throw new Error(typeof response.data?.detail === 'string'
      ? response.data.detail : 'O assistente está indisponível. Tente novamente depois.');
  }
  return response.data as ChatResponse;
}
