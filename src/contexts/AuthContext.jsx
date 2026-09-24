import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khởi tạo Auth State từ localStorage khi tải ứng dụng
    const savedUser = authService.getCurrentUser();
    const savedToken = authService.getAccessToken();
    if (savedUser && savedToken) {
      setUser(savedUser);
      setAccessToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const result = await authService.login({ identifier, password });
      setUser(result.user);
      setAccessToken(result.accessToken);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  const isAdmin = user && user.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        isAdmin,
        isAuthenticated: !!user && !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};

export default AuthContext;