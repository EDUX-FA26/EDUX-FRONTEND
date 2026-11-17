import api from "../config/axios.config";

// ============================================
// MANAGERS
// ============================================

export async function getManagers(params = {}) {
  const response = await api.get("/platform/managers", { params });
  return response.data;
}

export async function createManager(payload) {
  const response = await api.post("/platform/managers", payload);
  return response.data;
}

export async function updateManager(userId, payload) {
  const response = await api.patch(`/platform/managers/${userId}`, payload);
  return response.data;
}

export async function setManagerStatus(userId, isActive) {
  const response = await api.patch(`/platform/managers/${userId}/status`, { is_active: isActive });
  return response.data;
}

export async function deleteManager(userId) {
  const response = await api.delete(`/platform/managers/${userId}`);
  return response.data;
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export async function getPlans(includeInactive = true) {
  const response = await api.get("/platform/plans", { params: { include_inactive: includeInactive } });
  return response.data;
}

export async function createPlan(payload) {
  const response = await api.post("/platform/plans", payload);
  return response.data;
}

export async function updatePlan(planId, payload) {
  const response = await api.patch(`/platform/plans/${planId}`, payload);
  return response.data;
}

export async function deletePlan(planId) {
  const response = await api.delete(`/platform/plans/${planId}`);
  return response.data;
}

// ============================================
// REVENUE & TRANSACTIONS
// ============================================

export async function getRevenue() {
  const response = await api.get("/platform/revenue");
  return response.data;
}

export async function getTransactions(params = {}) {
  const response = await api.get("/platform/transactions", { params });
  return response.data;
}

// ============================================
// REFUNDS
// ============================================

export async function getRefunds(params = {}) {
  const response = await api.get("/platform/refunds", { params });
  return response.data;
}

export async function approveRefund(id) {
  const response = await api.post(`/platform/refunds/${id}/approve`);
  return response.data;
}

export async function rejectRefund(id, reason) {
  const response = await api.post(`/platform/refunds/${id}/reject`, { reason });
  return response.data;
}

export async function executeRefund(id, payload = {}) {
  const response = await api.post(`/platform/refunds/${id}/execute`, payload);
  return response.data;
}

// ============================================
// AUDIT LOGS
// ============================================

export async function getAuditLogs(params = {}) {
  const response = await api.get("/platform/audit-logs", { params });
  return response.data;
}

// ============================================
// SCHOOL TENANTS MANAGEMENT
// ============================================

export async function getSchools(params = {}) {
  const response = await api.get("/platform/schools", { params });
  return response.data;
}

export async function createSchool(payload = {}) {
  const response = await api.post("/platform/schools", payload);
  return response.data;
}

export async function inviteSchoolAdmin(schoolId, email) {
  const response = await api.post(`/platform/schools/${schoolId}/invitations`, { email });
  return response.data;
}

export async function lockSchool(schoolId, reason) {
  const response = await api.post(`/platform/schools/${schoolId}/lock`, { reason });
  return response.data;
}

export async function unlockSchool(schoolId) {
  const response = await api.post(`/platform/schools/${schoolId}/unlock`);
  return response.data;
}

export async function suspendSchool(schoolId, reason) {
  const response = await api.post(`/platform/schools/${schoolId}/suspend`, { reason });
  return response.data;
}

export async function unsuspendSchool(schoolId) {
  const response = await api.post(`/platform/schools/${schoolId}/restore`);
  return response.data;
}

export async function deleteSchool(schoolId) {
  const response = await api.post(`/platform/schools/${schoolId}/delete`);
  return response.data;
}

// ============================================
// CONTRACTS & SUBSCRIPTIONS
// ============================================

export async function getSubscriptions(params = {}) {
  const response = await api.get("/platform/subscriptions", { params });
  return response.data;
}

export async function remindSubscriptionRenewal(subscriptionId) {
  const response = await api.post(`/platform/subscriptions/${subscriptionId}/remind`);
  return response.data;
}

// ============================================
// NOTIFICATIONS & BROADCASTS
// ============================================

export async function broadcastNotification(payload) {
  const response = await api.post("/platform/notifications/broadcast", payload);
  return response.data;
}
