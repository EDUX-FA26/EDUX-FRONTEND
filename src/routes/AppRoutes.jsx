import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './SchoolProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { getHomeRouteByRole } from '../config/roles.config';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import StudentDashboard from '../pages/student/DashboardPage';
import StreakDetailPage from '../pages/student/StreakDetailPage';
import StreakDetailBySubjectPage from '../pages/student/StreakDetailBySubjectPage';
import LecturerDashboard from '../pages/lecturer/DashboardPage';
import LecturerFlashcardsPage from '../pages/lecturer/LecturerFlashcardsPage';
import LecturerFlashclassSelectPage from '../pages/lecturer/LecturerFlashclassSelectPage';
import AdminDashboard from '../pages/admin/DashboardPage';
import SchoolProfilePage from "../pages/admin/SchoolProfilePage";
import SchoolSettingsPage from "../pages/admin/SchoolSettingsPage";
import SchoolSetupPage from "../pages/admin/SchoolSetupPage";
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
import PersonalizedLearningPage from '../pages/student/PersonalizedLearningPage';
import FocusRoomPage from '../pages/student/FocusRoomPage';
import SmartTodoPage from '../pages/student/SmartTodoPage';
import StudentProjectsPage from '../pages/student/StudentProjectsPage';
import ForumPage from '../pages/forum/ForumPageStitch';
import ForumPostPage from '../pages/forum/ForumPostPage';
import ForumCreatePage from '../pages/forum/ForumCreatePage';
import NotificationCenterPage from '../pages/notifications/NotificationCenterPage';
import LecturerProjectsPage from '../pages/lecturer/LecturerProjectsPage';

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
import LecturerGradingPage from '../pages/lecturer/LecturerGradingPage';
import { useSchool } from '../contexts/SchoolContext';

import SchoolSelectionPage
  from '../pages/schools/SchoolSelectionPage';
import PlatformDashboardPage from
  "../pages/platform/PlatformDashboardPage.jsx";
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage.jsx";
import ManagerSchoolsPage from "../pages/manager/ManagerSchoolsPage";
import ManagerSubscriptionsPage from "../pages/manager/ManagerSubscriptionsPage";
import ManagerPaymentsPage from "../pages/manager/ManagerPaymentsPage";
import ManagerNotificationsPage from "../pages/manager/ManagerNotificationsPage";
import PlatformProtectedRoute from "./PlatformProtectedRoute";
import ManagersPage from "../pages/superadmin/ManagersPage";
import SubscriptionPlansPage from "../pages/superadmin/SubscriptionPlansPage";
import PlatformRevenuePage from "../pages/superadmin/PlatformRevenuePage";
import PlatformRefundsPage from "../pages/superadmin/PlatformRefundsPage";
import PlatformLogsPage from "../pages/superadmin/PlatformLogsPage";
import SuperadminNotificationsPage from "../pages/superadmin/SuperadminNotificationsPage";
import EduxLoadingScreen from "../components/common/EduxLoadingScreen";
import SchoolRegistrationPage from "../pages/public/SchoolRegistrationPage";
import SchoolRegistrationPaymentPage from "../pages/public/SchoolRegistrationPaymentPage";
import SchoolRegistrationReturnPage from "../pages/public/SchoolRegistrationReturnPage";
import SchoolEmailVerificationPage from "../pages/public/SchoolEmailVerificationPage";
import SchoolAdminActivationPage from "../pages/public/SchoolAdminActivationPage";
import FirstLoginChangePasswordPage from "../pages/auth/FirstLoginChangePasswordPage";

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  const {
    schoolRole, currentSchool,
    status,
  } = useSchool();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Platform accounts do not need, and must not be forced to select, a
  // school membership before entering their own console.
  if (user?.platform_role === ROLES.SUPERADMIN) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  if (user?.platform_role === ROLES.MANAGER) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  if (
    status === "loading" ||
    status === "idle"
  ) {
    return (
      <EduxLoadingScreen
        title="Đang chuẩn bị EDUX"
        description="Hệ thống đang xác định không gian học tập và chuyển bạn đến trang phù hợp."
      />
    );
  }

  if (status !== "ready") {
    return (
      <Navigate to="/select-school" replace />
    );
  }

  const uiRole =
    schoolRole === "school_admin"
      ? ROLES.ADMIN
      : schoolRole;

  // Existing schools remain usable during the SaaS migration. Initial setup is
  // only mandatory for a tenant that the Manager explicitly created in the
  // pending_setup lifecycle state or a newly registered school that hasn't completed setup yet.
  if (
    uiRole === ROLES.ADMIN &&
    (currentSchool?.schoolStatus === "pending_setup" || !currentSchool?.setupCompleted) &&
    sessionStorage.getItem("edux:setup_skipped") !== "true"
  ) {
    return <Navigate to="/admin/school-setup" replace />;
  }

  const destination = ROLE_HOME[uiRole];

  if (!destination) {
    return (
      <Navigate to="/select-school" replace />
    );
  }

  return (
    <Navigate to={destination} replace />
  );
}


export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/superadmin/dashboard"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}><PlatformRevenuePage /></PlatformProtectedRoute>}
      />
      <Route
        path="/superadmin/managers"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}><ManagersPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/superadmin/plans"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}><SubscriptionPlansPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/superadmin/revenue"
        element={<Navigate to="/superadmin/dashboard" replace />}
      />
      <Route
        path="/superadmin/refunds"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}><PlatformRefundsPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/superadmin/notifications"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}><SuperadminNotificationsPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/superadmin/logs"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}><PlatformLogsPage /></PlatformProtectedRoute>}
      />
      <Route path="/platform" element={<Navigate to="/superadmin/dashboard" replace />} />
      <Route
        path="/manager/dashboard"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.SUPERADMIN]}><ManagerDashboardPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/manager/schools"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.SUPERADMIN]}><ManagerSchoolsPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/manager/subscriptions"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.SUPERADMIN]}><ManagerSubscriptionsPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/manager/payments"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.SUPERADMIN]}><ManagerPaymentsPage /></PlatformProtectedRoute>}
      />
      <Route
        path="/manager/notifications"
        element={<PlatformProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.SUPERADMIN]}><ManagerNotificationsPage /></PlatformProtectedRoute>}
      />
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-school" element={<SchoolRegistrationPage />} />
      <Route path="/register-school/payment/:registrationId" element={<SchoolRegistrationPaymentPage />} />
      <Route path="/register-school/payment-return" element={<SchoolRegistrationReturnPage />} />
      <Route path="/payment/result" element={<SchoolRegistrationReturnPage />} />
      <Route path="/verify-school-email" element={<SchoolEmailVerificationPage />} />
      <Route path="/activate-school-admin" element={<SchoolAdminActivationPage />} />
      <Route path="/first-login/change-password" element={<FirstLoginChangePasswordPage />} />
      <Route path="/change-password-first-login" element={<FirstLoginChangePasswordPage />} />
      <Route
        path="/admin/school-setup"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <SchoolSetupPage />
          </ProtectedRoute>
        }
      />

      {/* Multi-Tenant School Selection */}
      <Route
        path="/select-school"
        element={<SchoolSelectionPage />}
      />

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
        <Route path="study-plan" element={<PersonalizedLearningPage />} />
        <Route path="focus" element={<FocusRoomPage />} />
        <Route path="todos" element={<Navigate to="/student/focus" replace />} />
        <Route path="streak" element={<StreakDetailPage />} />
        <Route path="streak/:subjectId" element={<StreakDetailBySubjectPage />} />
        <Route path="flashcards" element={<StudentFlashcardSelectPage />} />
        <Route path="flashcards/subject/:subjectId" element={<FlashcardsPage />} />
        <Route path="flashcards/:deckId/study" element={<FlashcardStudyPage />} />
        <Route path="flashcards/:deckId/test" element={<FlashcardTestPage />} />
        <Route path="flashcards/tests/:testId" element={<FlashcardTestPage />} />
        <Route path="flashcards/tests/:testId/result" element={<FlashcardTestResultPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="forum/new" element={<ForumCreatePage />} />
        <Route path="forum/:postId" element={<ForumPostPage />} />
        <Route path="notifications" element={<NotificationCenterPage />} />
        <Route path="classes" element={<StudentClassesPage />} />
        <Route path="classes/:classId" element={<StudentClassDetailPage />} />
        <Route path="classes/:classId/materials" element={<ClassMaterialsPage />} />
        <Route path="classes/:classId/projects" element={<StudentProjectsPage />} />
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
        <Route
          path="/lecturer/classes/:classId/projects"
          element={<LecturerProjectsPage />}
        />
        <Route path="dashboard" element={<LecturerDashboard />} />
        {/* Bước 1: chọn môn học */}
        <Route path="flashcards" element={<LecturerFlashclassSelectPage />} />
        {/* Bước 2: quản lý flashcard theo môn */}
        <Route path="flashcards/subject/:subjectId" element={<LecturerFlashcardsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="forum/new" element={<ForumCreatePage />} />
        <Route path="forum/:postId" element={<ForumPostPage />} />
        <Route path="notifications" element={<NotificationCenterPage />} />
        <Route path="classes" element={<LecturerClassesPage />} />
        <Route path="classes/:classId" element={<LecturerClassDetailPage />} />
        <Route path="classes/:classId/materials" element={<ClassMaterialsPage />} />
        <Route path="assignments/:id" element={<LecturerAssignmentDetailPage />} />
        <Route path="assignments/:assignmentId/submissions/:submissionId/grade" element={<LecturerGradingPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Full-screen Lecturer Grading Studio */}
      <Route
        path="/lecturer/assignments/:assignmentId/submissions/:submissionId/grade"
        element={
          <ProtectedRoute allowedRoles={[ROLES.LECTURER]}>
            <LecturerGradingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/grading/:submissionId"
        element={
          <ProtectedRoute allowedRoles={[ROLES.LECTURER]}>
            <LecturerGradingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/grading"
        element={
          <ProtectedRoute allowedRoles={[ROLES.LECTURER]}>
            <LecturerGradingPage />
          </ProtectedRoute>
        }
      />

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
        <Route path="school-setup" element={<SchoolSetupPage />} />
        <Route path="profile" element={<SchoolProfilePage />} />
        <Route path="school-profile" element={<SchoolProfilePage />} />
        <Route path="school-settings" element={<SchoolProfilePage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
