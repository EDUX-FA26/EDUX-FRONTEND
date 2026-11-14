import api from '../config/axios.config';

/**
 * GET /api/dashboards
 * Requires: Bearer token + School Context
 * Returns: { role, statistics, recentAssignments|recentSubmissions|recentUsers }
 */
export const getDashboard = async (options = {}) => {
  const { data } = await api.get('/dashboards', {
    schoolScoped: true,
    ...options,
  });
  return data;
};

/**
 * GET /api/dashboards/notifications
 * Returns: { notifications, unreadCount }
 */
export const getDashboardNotifications = async (options = {}) => {
  const { data } = await api.get('/dashboards/notifications', {
    schoolScoped: true,
    ...options,
  });
  return data;
};