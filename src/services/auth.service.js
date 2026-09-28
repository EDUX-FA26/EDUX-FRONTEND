import api from '../config/axios.config';

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (identifier, password) => {
  const { data } = await api.post('/auth/login', { identifier, password });
  return data; // { success, data: { user, accessToken, refreshToken } }
};

/**
 * POST /api/auth/logout
 * Requires: Bearer token (injected automatically)
 */
export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

/**
 * POST /api/auth/refresh-token
 * Body: { refreshToken }
 */
export const refreshToken = async (token) => {
  const { data } = await api.post('/auth/refresh-token', { refreshToken: token });
  return data;
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export const resetPassword = async (token, new_password) => {
  const { data } = await api.post('/auth/reset-password', { token, new_password });
  return data;
};

/**
 * PATCH /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
export const changePassword = async (old_password, new_password) => {
  const { data } = await api.patch('/auth/change-password', { old_password, new_password });
  return data;
};