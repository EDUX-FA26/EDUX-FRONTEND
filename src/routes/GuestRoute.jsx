import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHomeRouteByRole } from '../config/roles.config';

/**
 * GuestRoute — dành cho các trang public như /login.
 * Nếu người dùng đã đăng nhập, tự động đá về Dashboard theo Role (không mang theo history cũ).
 */
export default function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const targetHome = getHomeRouteByRole(user.role);
    return <Navigate to={targetHome} replace state={null} />;
  }

  return children;
}

