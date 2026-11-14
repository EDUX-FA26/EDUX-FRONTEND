import api from '../config/axios.config';

export async function askAiChat(message, options = {}) {
  const response = await api.post('/ai-chat', { message }, {
    schoolScoped: true,
    ...options,
  });
  return response.data?.data || response.data;
}
