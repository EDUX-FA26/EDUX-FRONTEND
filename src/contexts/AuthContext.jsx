
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import {
  login as loginApi,
  googleLogin as googleLoginApi,
  logout as logoutApi,
} from "../services/auth.service";

import {
  clearActiveSchoolId,
} from "../services/tenantSession";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("accessToken")
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = Boolean(user && accessToken);

  const saveSession = useCallback((session) => {
    if (!session?.accessToken || !session?.user) {
      throw new Error("Invalid login response");
    }

    clearActiveSchoolId();

    localStorage.setItem(
      "accessToken",
      session.accessToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(session.user)
    );

    setAccessToken(session.accessToken);
    setUser(session.user);

    return {
      success: true,

      // RootRedirect will resolve school role.
      redirectTo: "/",
    };
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      setLoading(true);
      setError(null);

      try {
        const res = await loginApi(
          identifier,
          password
        );

        return saveSession(res.data);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Đăng nhập thất bại. Vui lòng thử lại.";

        setError(msg);

        return {
          success: false,
          error: msg,
        };
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const googleLogin = useCallback(
    async (credential) => {
      setLoading(true);
      setError(null);

      try {
        const res = await googleLoginApi(
          credential
        );

        return saveSession(res.data);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Đăng nhập Google thất bại.";

        setError(msg);

        return {
          success: false,
          error: msg,
        };
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Clear local session even if API fails.
    } finally {
      const userId =
        user?.id ??
        user?.userId ??
        user?.user_id;

      if (userId) {
        sessionStorage.removeItem(
          `edux:selected-school:${userId}`
        );
      }

      clearActiveSchoolId();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      setAccessToken(null);
      setUser(null);
      setError(null);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        loading,
        error,
        login,
        googleLogin,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
