import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Axios instance dùng chung — gắn Bearer Token từ localStorage
const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/admin`,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Admin User APIs (/api/admin/users) ───────────────────────────────────

/**
 * Lấy danh sách tất cả users
 */
export const getAdminUsers = async () => {
  const res = await axiosInstance.get("/users");
  return res.data;
};

/**
 * UC 86 — Tạo user mới
 * @param {Object} userData - { email, username, password, role, full_name, student_code, department_id }
 */
export const createAdminUser = async (userData) => {
  const res = await axiosInstance.post("/users", userData);
  return res.data;
};

/**
 * UC 87 — Cập nhật thông tin user
 * @param {string} id - UUID của user
 * @param {Object} userData - { email?, role?, full_name?, student_code?, department_id? }
 */
export const updateAdminUser = async (id, userData) => {
  const res = await axiosInstance.patch(`/users/${id}`, userData);
  return res.data;
};

/**
 * UC 88 — Tạm khóa tài khoản người dùng
 * @param {string} id - UUID của user
 */
export const suspendAdminUser = async (id) => {
  const res = await axiosInstance.patch(`/users/${id}/suspend`);
  return res.data;
};

/**
 * UC 89 — Kích hoạt lại tài khoản người dùng
 * @param {string} id - UUID của user
 */
export const activateAdminUser = async (id) => {
  const res = await axiosInstance.patch(`/users/${id}/activate`);
  return res.data;
};
