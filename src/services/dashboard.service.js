import api from "../config/axios.config";

/**
 * GET /api/dashboards
 *
 * Dashboard theo trường đang chọn.
 * Role được xác định từ School Membership.
 */
export const getDashboard = async (config = {}) => {
  const { data } = await api.get('/dashboards', {
    ...config,
    schoolScoped: true,
  });

  return data;
};


/**
 * GET /api/dashboards/notifications
 *
 * Lấy 5 thông báo mới nhất và unreadCount.
 * Bao gồm thông báo trường hiện tại và platform.
 */
export const getDashboardNotifications = async (config = {}) => {
  const { data } = await api.get('/dashboards/notifications', {
    ...config,
    schoolScoped: true,
  });

  return data;
};