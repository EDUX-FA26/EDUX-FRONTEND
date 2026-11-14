
import api from '../config/axios.config.js';

// Shared Axios instance:
// - baseURL: /api
// - Automatically attaches JWT
// - Adds X-School-Id when schoolScoped: true
// - Handles global authentication errors

const ADMIN = "/admin";

// =============================================
// 007D-3A: SCHOOL MEMBERS
// =============================================

export const getUsers = async () => {
  const response = await api.get(
    `${ADMIN}/users`,
    { schoolScoped: true }
  );

  return response.data;
};

export const toggleUserStatus = async (
  userId,
  isSuspend
) => {
  const endpoint = isSuspend
    ? `${ADMIN}/users/${userId}/suspend`
    : `${ADMIN}/users/${userId}/activate`;

  const response = await api.patch(
    endpoint,
    {},
    { schoolScoped: true }
  );

  return response.data;
};

export const suspendUser = async (userId) => {
  const response = await api.patch(
    `${ADMIN}/users/${userId}/suspend`,
    {},
    { schoolScoped: true }
  );

  return response.data;
};

export const activateUser = async (userId) => {
  const response = await api.patch(
    `${ADMIN}/users/${userId}/activate`,
    {},
    { schoolScoped: true }
  );

  return response.data;
};

// =============================================
// USER MANAGEMENT
// TODO: Migration 007D-3B
// =============================================
export const createUser = async (userData) => {
  const response = await api.post(
    "/admin/users",
    userData,
    { schoolScoped: true }
  );

  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.patch(
    `/admin/users/${id}`,
    userData,
    { schoolScoped: true }
  );

  return response.data;
};

// =============================================
// SYSTEM LOGS
// TODO: Verify backend route
// =============================================

export const getSystemLogs = async () => {
  const response = await api.get(
    `${ADMIN}/system-logs`
  );

  return response.data;
};

// =============================================
// NOTIFICATIONS
// TODO: Migration 007D-3D
// =============================================

export const broadcastNotification = async (
  notifData
) => {
  const response = await api.post(
    `${ADMIN}/notifications/broadcast`,
    notifData,
    { schoolScoped: true }
  );

  return response.data;
};

export const getSystemNotifications = async () => {
  const response = await api.get(
    `${ADMIN}/notifications`,
    { schoolScoped: true }
  );

  return response.data;
};

// =============================================
// EXCEL IMPORT
// TODO: Migration 007D-3D
// =============================================

export const importExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `${ADMIN}/users/import`,
    formData,
    { schoolScoped: true }
  );

  return response.data;
};

export const importAutoAssignClasses = async (
  file
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `${ADMIN}/classes/auto-assign`,
    formData,
    { schoolScoped: true }
  );

  return response.data;
};

export const importUsers = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `${ADMIN}/users/import-list`,
    formData,
    { schoolScoped: true }
  );

  return response.data;
};

// =============================================
// DEPARTMENTS
// TODO: Migration 007D-3C
// =============================================


export const getDepartments = async () => {
  const response = await api.get(
    "/admin/departments",
    { schoolScoped: true }
  );

  return response.data;
};

export const createDepartment = async (payload) => {
  const response = await api.post(
    "/admin/departments",
    payload,
    { schoolScoped: true }
  );

  return response.data;
};

export const updateDepartment = async (
  id,
  payload
) => {
  const response = await api.patch(
    `/admin/departments/${id}`,
    payload,
    { schoolScoped: true }
  );

  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(
    `/admin/departments/${id}`,
    { schoolScoped: true }
  );

  return response.data;
};


// =============================================
// CLASSES
// TODO: Migration 007D-3C
// =============================================




export const createAdminClass = async (payload) => {
  const response = await api.post(
    "/admin/classes",
    payload,
    { schoolScoped: true }
  );

  return response.data;
};



export const getAdminLecturers = async () => {
  const response = await api.get(
    "/admin/lecturers",
    { schoolScoped: true }
  );

  return response.data;
};

export const getAllClasses = async () => {
  const response = await api.get(
    "/admin/classes",
    { schoolScoped: true }
  );

  return response.data;
};

export const getClassStudents = async (id) => {
  const response = await api.get(
    `/admin/classes/${id}/students`,
    { schoolScoped: true }
  );

  return response.data;
};


export const getClassSlots = async (id) => {
  const response = await api.get(
    `/admin/classes/${id}/slots`,
    { schoolScoped: true }
  );

  return response.data;
};



export const addClassStudent = async (
  classId,
  payload
) => {
  const response = await api.post(
    `/admin/classes/${classId}/students`,
    payload,
    { schoolScoped: true }
  );

  return response.data;
};


export const removeClassStudent = async (
  classId,
  studentId
) => {
  const response = await api.delete(
    `${ADMIN}/classes/${classId}/students/${studentId}`,
    { schoolScoped: true }
  );

  return response.data;
};

export const removeMemberFromClass =
  removeClassStudent;



export const updateClass = async (id, data) => {
  const response = await api.patch(
    `/admin/classes/${id}`,
    data,
    { schoolScoped: true }
  );

  return response.data;
};

export const deleteClass = async (id) => {
  const response = await api.delete(
    `/admin/classes/${id}`,
    { schoolScoped: true }
  );

  return response.data;
};
