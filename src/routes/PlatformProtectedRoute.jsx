import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLE_HOME } from "../config/constants";

export default function PlatformProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.platform_role;
  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || "/"} replace />;
  }

  return children;
}
