// src/config/roles.config.ts

export const ROLE_HOME_ROUTES: Record<string, string> = {
  ADMIN: '/admin/dashboard',         // Path mục "Tổng quan" của Admin trong AppRoutes.jsx
  LECTURER: '/lecturer/dashboard',   // Path mục "Tổng quan" của Lecturer trong AppRoutes.jsx
  STUDENT: '/student/dashboard',     // Path mục "Tổng quan" của Student trong AppRoutes.jsx
  // Dễ dàng mở rộng thêm các role mới trong tương lai:
  // TEACHING_ASSISTANT: '/ta/dashboard',
  // DEPARTMENT_HEAD: '/head/dashboard',
};

/**
 * Helper lấy trang chủ (Trang Tổng hợp đầu tiên) cho bất kỳ role nào.
 * Chấp nhận chuỗi role ('student', 'STUDENT') hoặc object ({ role: 'student' }).
 * Nếu thêm role mới chưa kịp khai báo trong map, tự động fallback theo convention `/${role.toLowerCase()}/dashboard`.
 */
export function getHomeRouteByRole(roleOrUser?: any): string {
  if (!roleOrUser) return '/login';
  const rawRole = typeof roleOrUser === 'string'
    ? roleOrUser
    : (roleOrUser?.role || roleOrUser?.user?.role || '');

  if (!rawRole) return '/login';
  const normalizedRole = String(rawRole).toUpperCase().trim();

  if (ROLE_HOME_ROUTES[normalizedRole]) {
    return ROLE_HOME_ROUTES[normalizedRole];
  }

  // Quy ước tự động cho các role mở rộng sau này
  return `/${normalizedRole.toLowerCase()}/dashboard`;
}

