import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  initSocket,
  disconnectSocket,
} from "../config/socket";

import { useAuth } from "./AuthContext";
import { useSchool } from "./SchoolContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const {
    currentSchool,
    status,
  } = useSchool();

  const [socket, setSocket] = useState(null);

  const schoolId = currentSchool?.schoolId || null;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    // =========================================
    // NO AUTHENTICATION
    // =========================================

    if (!isAuthenticated || !user || !token) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    // Đợi SchoolContext xác minh xong.
    if (status === "loading" || status === "idle") {
      disconnectSocket();
      setSocket(null);
      return;
    }

    // =========================================
    // INITIALIZE SOCKET
    // =========================================

    const instance = initSocket(token, schoolId);

    setSocket(instance);

    // =========================================
    // EVENT HANDLERS
    // =========================================

    const handleConnect = () => {
      console.log("[SOCKET] Connected:", {
        socketId: instance.id,
        schoolId,
      });
    };

    const handleConnectError = (error) => {
      console.error(
        "[SOCKET] Connection rejected:",
        error.message
      );
    };

    const handleDisconnect = (reason) => {
      console.log(
        "[SOCKET] Disconnected:",
        reason
      );
    };

    instance.on("connect", handleConnect);

    instance.on(
      "connect_error",
      handleConnectError
    );

    instance.on(
      "disconnect",
      handleDisconnect
    );

    // =========================================
    // CLEANUP
    // =========================================

    return () => {
      instance.off("connect", handleConnect);

      instance.off(
        "connect_error",
        handleConnectError
      );

      instance.off(
        "disconnect",
        handleDisconnect
      );

      disconnectSocket();
    };
  }, [
    user?.id,
    isAuthenticated,
    schoolId,
    status,
  ]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}