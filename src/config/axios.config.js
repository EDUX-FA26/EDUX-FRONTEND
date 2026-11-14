
import axios from "axios";

import {
  getActiveSchoolId,
} from "./../services/tenantSession";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "accessToken"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // ONLY migrated Multi-Tenant APIs
    // should use schoolScoped: true.
    if (config.schoolScoped === true) {
      const schoolId = getActiveSchoolId();

      if (!schoolId) {
        const error = new Error(
          "School context is not ready"
        );

        error.code = "SCHOOL_CONTEXT_REQUIRED";

        return Promise.reject(error);
      }

      config.headers["X-School-Id"] =
        schoolId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      // 💡 Thêm điều kiện: CHỈ redirect nếu KHÔNG PHẢI đang ở trang login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_visited_url');
        localStorage.removeItem('redirect_after_login');
        localStorage.removeItem('redirectUrl');
        localStorage.removeItem('lastPath');
        localStorage.removeItem('student_last_subject_id');
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
