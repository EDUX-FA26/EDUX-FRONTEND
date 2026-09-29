import api from '../config/axios.config';

export const getSubjects = async (params = {}) => {
  const response = await api.get('/subjects', { params });
  return response.data;
};

export const createSubject = async (payload) => {
  const response = await api.post('/subjects', payload);
  return response.data;
};

export const updateSubject = async (id, payload) => {
  const response = await api.patch(`/subjects/${id}`, payload);
  return response.data;
};

export const deleteSubject = async (id) => {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
};
