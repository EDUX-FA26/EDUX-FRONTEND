import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import StudentDashboard from '../pages/student/DashboardPage';
import LecturerDashboard from '../pages/lecturer/DashboardPage';
import AdminDashboard from '../pages/admin/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

import { ROLE_HOME, ROLES } from '../config/constants';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Lecturer */}
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={[ROLES.LECTURER]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<LecturerDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}