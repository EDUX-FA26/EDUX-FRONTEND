import api from "../config/axios.config";

export const getSystemReports = async (options = {}) => {
  const response = await api.get("/reports/system", {
    schoolScoped: true,
    ...options,
  });
  return response.data;
};

export const getAiUsageStats = async (options = {}) => {
  const response = await api.get("/reports/ai-usage", {
    schoolScoped: true,
    ...options,
  });
  return response.data;
};

export const getAuditLogs = async (options = {}) => {
  const response = await api.get("/reports/audit-logs", {
    schoolScoped: true,
    ...options,
  });
  return response.data;
};

export const exportLearningActivity = async (options = {}) => {
  const response = await api.get("/reports/learning-activity/export", {
    schoolScoped: true,
    ...options,
  });
  return response.data;
};

export const exportAiTransparency = async (options = {}) => {
  const response = await api.get("/reports/ai-transparency/export", {
    schoolScoped: true,
    ...options,
  });
  return response.data;
};
