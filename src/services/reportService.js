import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/reports`,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSystemReports = async () => {
  const response = await axiosInstance.get("/system");
  return response.data;
};

export const getAiUsageStats = async () => {
  const response = await axiosInstance.get("/ai-usage");
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await axiosInstance.get("/audit-logs");
  return response.data;
};

export const exportLearningActivity = async () => {
  const response = await axiosInstance.get("/learning-activity/export");
  return response.data;
};

export const exportAiTransparency = async () => {
  const response = await axiosInstance.get("/ai-transparency/export");
  return response.data;
};
