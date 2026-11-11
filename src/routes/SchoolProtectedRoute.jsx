
import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useSchool } from "../contexts/SchoolContext";

import {
  ROLES,
  ROLE_HOME,
} from "../config/constants";

export default function SchoolProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { isAuthenticated } = useAuth();

  const {
    schoolRole,
    status,
  } = useSchool();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    status === "loading" ||
    status === "idle"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Đang xác minh trường học...</p>
      </div>
    );
  }

  if (status !== "ready") {
    return (
      <Navigate
        to="/select-school"
        replace
      />
    );
  }

  // Legacy UI uses "admin".
  // New DB membership uses "school_admin".
  const uiRole =
    schoolRole === "school_admin"
      ? ROLES.ADMIN
      : schoolRole;

  if (!allowedRoles.includes(uiRole)) {
    return (
      <Navigate
        to={ROLE_HOME[uiRole] || "/select-school"}
        replace
      />
    );
  }

  return children;
}
