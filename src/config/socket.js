import { io } from "socket.io-client";

let socket = null;

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    try {
      const url = new URL(import.meta.env.VITE_API_URL);
      return url.origin;
    } catch {
      return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");
    }
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
    return window.location.origin;
  }
  return "";
};

export const initSocket = (token, schoolId = null) => {
  if (!token) {
    throw new Error("SOCKET_TOKEN_REQUIRED");
  }

  const normalizedSchoolId = schoolId || null;

  // Giữ kết nối hiện tại nếu cùng token và school.
  if (
    socket &&
    socket.auth?.token === token &&
    (socket.auth?.schoolId || null) === normalizedSchoolId
  ) {
    return socket;
  }

  // Ngắt kết nối cũ khi đổi tài khoản hoặc trường.
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const socketTargetUrl = getSocketUrl();

  // Tránh kết nối websocket tới domain Vercel tĩnh nếu chưa cấu hình backend URL
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes("vercel.app") &&
    (!socketTargetUrl || socketTargetUrl.includes("vercel.app"))
  ) {
    console.warn(
      "[SOCKET] Vercel frontend host detected without VITE_SOCKET_URL or VITE_API_URL backend host. Skipping socket initialization."
    );
    return null;
  }

  socket = io(
    socketTargetUrl,
    {
      auth: {
        token,
        schoolId: normalizedSchoolId,
      },

      autoConnect: true,

      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 10000,
    }
  );

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
