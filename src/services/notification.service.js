import api from '../config/axios.config';

export const getNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', {
    params,
    schoolScoped: true,
  });
  return data;
};

export const getUnreadNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications/unread', {
    params,
    schoolScoped: true,
  });
  return data;
};

export const markAsRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`, {}, {
    schoolScoped: true,
  });
  return data;
};

export const markAllAsRead = async () => {
  const { data } = await api.put('/notifications/read-all', {}, {
    schoolScoped: true,
  });
  return data;
};

export const getDashboardNotifications = async () => {
  const { data } = await api.get('/dashboards/notifications', {
    schoolScoped: true,
  });
  return data;
};