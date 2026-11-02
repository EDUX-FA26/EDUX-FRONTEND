import api from '../config/axios.config';

export async function askAiChat(message) {
  const response = await api.post('/ai-chat', { message });
  return response.data?.data || response.data;
}
