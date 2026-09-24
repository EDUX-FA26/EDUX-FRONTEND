import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const authService = {
  /**
   * Đăng nhập hệ thống (cho cả User & Admin)
   * @param {Object} credentials - { identifier, password }
   */
  async login({ identifier, password }) {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      identifier,
      password,
    });
    
    if (res.data && res.data.success) {
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      return { accessToken, refreshToken, user };
    }
    
    throw new Error(res.data?.message || "Đăng nhập thất bại");
  },

  /**
   * Đăng xuất tài khoản
   */
  async logout() {
    const token = localStorage.getItem("accessToken");
    try {
      if (token) {
        await axios.post(
          `${BASE_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.warn("Lỗi gọi API logout:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },

  /**
   * Lấy thông tin user hiện tại lưu trong LocalStorage
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Lấy Access Token hiện tại
   */
  getAccessToken() {
    return localStorage.getItem("accessToken") || null;
  }
};