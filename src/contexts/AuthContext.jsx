import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login as loginApi,
  googleLogin as googleLoginApi,
  logout as logoutApi,
} from '../services/auth.service';
import { ROLE_HOME } from '../config/constants';
import { getHomeRouteByRole } from '../config/roles.config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!user && !!localStorage.getItem('accessToken');

  const saveSession = useCallback((session) => {
    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('access_token', session.accessToken);
    localStorage.setItem('user', JSON.stringify(session.user));
    localStorage.removeItem('last_visited_url');
    localStorage.removeItem('redirect_after_login');
    localStorage.removeItem('redirectUrl');
    localStorage.removeItem('lastPath');
    localStorage.removeItem('student_last_subject_id');
    sessionStorage.removeItem('lastPath');
    sessionStorage.clear();
    setUser(session.user);
    const targetHome = getHomeRouteByRole(session.user);

    return { success: true, user: session.user, redirectTo: targetHome };
  }, []);

  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginApi(identifier, password);
      return saveSession(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const googleLogin = useCallback(async (credential) => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleLoginApi(credential);
      return saveSession(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout API errors — still clear local state
    } finally {
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
      setUser(null);
      try {
        navigate('/login', { replace: true, state: null });
      } catch {}
    }
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, error, login, googleLogin, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
