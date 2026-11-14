import api from '../config/axios.config';

export const searchContent = async (params, options = {}) => {
  const response = await api.get('/search', {
    params,
    schoolScoped: true,
    ...options,
  });
  return response.data;
};
