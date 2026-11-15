import api from "../config/axios.config";

export async function getManagers() {
  const response = await api.get("/platform/managers");
  return response.data;
}

export async function createManager(payload) {
  const response = await api.post("/platform/managers", payload);
  return response.data;
}

export async function setManagerStatus(userId, isActive) {
  const response = await api.patch(`/platform/managers/${userId}/status`, { is_active: isActive });
  return response.data;
}

export async function getPlans(includeInactive = true) {
  const response = await api.get("/platform/plans", { params: { include_inactive: includeInactive } });
  return response.data;
}

export async function getRevenue() {
  const response = await api.get("/platform/revenue");
  return response.data;
}

export async function getAuditLogs(params = {}) {
  const response = await api.get("/platform/audit-logs", { params });
  return response.data;
}
