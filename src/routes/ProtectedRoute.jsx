import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHomeRouteByRole } from '../config/roles.config';

/**
 * ProtectedRoute — chỉ cho phép truy cập nếu đã đăng nhập.
 * Nếu allowedRoles được cung cấp, sẽ kiểm tra role của user.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={null} />;
  }

  if (allowedRoles && user) {
    const userRole = String(user.role || '').toLowerCase();
    const hasRole = allowedRoles.some((r) => String(r || '').toLowerCase() === userRole);
    if (!hasRole) {
      const home = getHomeRouteByRole(user.role);
      return <Navigate to={home} replace state={null} />;
    }
  }

  return children;
}
