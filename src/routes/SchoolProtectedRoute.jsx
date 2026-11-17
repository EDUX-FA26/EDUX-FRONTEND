
import React from "react";
import { Navigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useSchool } from "../contexts/SchoolContext";
import { School2, LoaderCircle } from "lucide-react";
import {
  ROLES,
  ROLE_HOME,
} from "../config/constants";
import EduxLoadingScreen from "../components/common/EduxLoadingScreen";

export default function SchoolProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const {
    schoolRole,
    status,
  } = useSchool();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.must_change_password) {
    return <Navigate to="/first-login/change-password" replace />;
  }

  if (
    status === "loading" ||
    status === "idle"
  ) {
    return (
      <EduxLoadingScreen
        title="Đang xác minh trường học"
        description="Hệ thống đang kiểm tra quyền truy cập và chuẩn bị không gian học tập của bạn."
      />
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
