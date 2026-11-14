import api from "../config/axios.config";

/**
 * GET /api/dashboards
 *
 * Dashboard theo trường đang chọn.
 * Role được xác định từ School Membership.
 */
export const getDashboard = async () => {
  const { data } = await api.get("/dashboards", {
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
export const getDashboardNotifications = async () => {
  const { data } = await api.get(
    "/dashboards/notifications",
    {
      schoolScoped: true,
    }
  );

  return data;
};