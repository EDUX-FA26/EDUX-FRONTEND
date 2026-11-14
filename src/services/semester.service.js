import api from '../config/axios.config';

export const getSemesters = async (params = {}) => {
  const response = await api.get('/semesters', {
    params,
    schoolScoped: true,
  });
  return response.data;
};

export const createSemester = async (payload) => {
  const response = await api.post('/semesters', payload, {
    schoolScoped: true,
  });
  return response.data;
};

export const updateSemester = async (id, payload) => {
  const response = await api.patch(`/semesters/${id}`, payload, {
    schoolScoped: true,
  });
  return response.data;
};

export const activateSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/activate`, undefined, {
    schoolScoped: true,
  });
  return response.data;
};

export const closeSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/close`, undefined, {
    schoolScoped: true,
  });
  return response.data;
};

export const reopenSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/reopen`, undefined, {
    schoolScoped: true,
  });
  return response.data;
};

export const lockSemester = async (id) => {
  const response = await api.post(`/semesters/${id}/lock`, undefined, {
    schoolScoped: true,
  });
  return response.data;
};
