import api from '../config/axios.config';

export const getSemesters = async (params = {}) => {
  const response = await api.get('/semesters', { params });
  return response.data;
};

export const createSemester = async (payload) => {
  const response = await api.post('/semesters', payload);
  return response.data;
};

export const updateSemester = async (id, payload) => {
  const response = await api.patch(`/semesters/${id}`, payload);
  return response.data;
};

export const activateSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/activate`);
  return response.data;
};

export const closeSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/close`);
  return response.data;
};

export const lockSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/lock`);
  return response.data;
};
