import api from '../config/axios.config';

/**
 * GET /api/dashboards
 * Requires: Bearer token — role xác định từ JWT
 * Returns: { role, statistics, recentAssignments|recentSubmissions|recentUsers, notifications, unreadCount }
 */
export const getDashboard = async () => {
  const { data } = await api.get('/dashboards');
  return data;
};