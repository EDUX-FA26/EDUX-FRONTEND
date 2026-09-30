import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import StudentDashboard from '../pages/student/DashboardPage';
import StreakDetailPage from '../pages/student/StreakDetailPage';
import StreakDetailBySubjectPage from '../pages/student/StreakDetailBySubjectPage';
import LecturerDashboard from '../pages/lecturer/DashboardPage';
import LecturerFlashcardsPage from '../pages/lecturer/LecturerFlashcardsPage';
import LecturerFlashclassSelectPage from '../pages/lecturer/LecturerFlashclassSelectPage';
import AdminDashboard from '../pages/admin/DashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import ClassManagementPage from '../pages/admin/ClassManagementPage';
import SystemLogsPage from '../pages/admin/SystemLogsPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import SemesterManagementPage from '../pages/admin/SemesterManagementPage';
import SubjectManagementPage from '../pages/admin/SubjectManagementPage';
import SearchPage from '../pages/search/SearchPage';
import NotFoundPage from '../pages/NotFoundPage';
import FlashcardsPage from '../pages/student/FlashcardsPage';
import FlashcardStudyPage from '../pages/student/FlashcardStudyPage';
import StudentFlashcardSelectPage from '../pages/student/StudentFlashcardSelectPage';
import FlashcardTestPage from '../pages/student/FlashcardTestPage';
import FlashcardTestResultPage from '../pages/student/FlashcardTestResultPage';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

import { ROLE_HOME, ROLES } from '../config/constants';
import ClassMaterialsPage from '../pages/class/ClassMaterialsPage';
import StudentClassesPage from '../pages/student/StudentClassesPage';
import LecturerClassesPage from '../pages/lecturer/LecturerClassesPage';
import StudentClassDetailPage from '../pages/student/StudentClassDetailPage';
import LecturerClassDetailPage from '../pages/lecturer/LecturerClassDetailPage';
import StudentAssignmentDetailPage from '../pages/student/StudentAssignmentDetailPage';
import LecturerAssignmentDetailPage from '../pages/lecturer/LecturerAssignmentDetailPage';

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
        <Route path="streak" element={<StreakDetailPage />} />
        <Route path="streak/:subjectId" element={<StreakDetailBySubjectPage />} />
        <Route path="flashcards" element={<StudentFlashcardSelectPage />} />
        <Route path="flashcards/subject/:subjectId" element={<FlashcardsPage />} />
        <Route path="flashcards/:deckId/study" element={<FlashcardStudyPage />} />
        <Route path="flashcards/:deckId/test" element={<FlashcardTestPage />} />
        <Route path="flashcards/tests/:testId" element={<FlashcardTestPage />} />
        <Route path="flashcards/tests/:testId/result" element={<FlashcardTestResultPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="classes" element={<StudentClassesPage />} />
        <Route path="classes/:classId" element={<StudentClassDetailPage />} />
        <Route path="classes/:classId/materials" element={<ClassMaterialsPage />} />
        <Route path="assignments/:id" element={<StudentAssignmentDetailPage />} />
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
        {/* Bước 1: chọn môn học */}
        <Route path="flashcards" element={<LecturerFlashclassSelectPage />} />
        {/* Bước 2: quản lý flashcard theo môn */}
        <Route path="flashcards/subject/:subjectId" element={<LecturerFlashcardsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="classes" element={<LecturerClassesPage />} />
        <Route path="classes/:classId" element={<LecturerClassDetailPage />} />
        <Route path="classes/:classId/materials" element={<ClassMaterialsPage />} />
        <Route path="assignments/:id" element={<LecturerAssignmentDetailPage />} />
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
        <Route path="users" element={<UserManagementPage />} />
        <Route path="classes" element={<ClassManagementPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="semesters" element={<SemesterManagementPage />} />
        <Route path="subjects" element={<SubjectManagementPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="logs" element={<SystemLogsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
