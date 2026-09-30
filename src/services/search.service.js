import api from '../config/axios.config';

export const searchContent = async (params) => {
  const response = await api.get('/search', { params });
  return response.data;
};
