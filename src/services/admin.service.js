import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/admin`,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsers = async () => {
  const response = await axiosInstance.get('/users');
  return response.data;
};

export const getSystemLogs = async () => {
  const response = await axiosInstance.get('/system-logs');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axiosInstance.post('/users', userData);
  return response.data;
};

export const toggleUserStatus = async (userId, isSuspend) => {
  const endpoint = isSuspend ? `/users/${userId}/suspend` : `/users/${userId}/activate`;
  const response = await axiosInstance.patch(endpoint);
  return response.data;
};

export const broadcastNotification = async (notifData) => {
  const response = await axiosInstance.post('/notifications/broadcast', notifData);
  return response.data;
};

export const getSystemNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};

export const importExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/users/import', formData);
  return response.data;
};

export const getAllClasses = async () => {
  const response = await axiosInstance.get('/classes');
  return response.data;
};

export const getClassStudents = async (id) => {
  const response = await axiosInstance.get(`/classes/${id}/students`);
  return response.data;
};

export const updateClass = async (id, data) => {
  const response = await axiosInstance.patch(`/classes/${id}`, data);
  return response.data;
};

export const deleteClass = async (id) => {
  const response = await axiosInstance.delete(`/classes/${id}`);
  return response.data;
};
