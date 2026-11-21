
import { io } from "socket.io-client";

let socket = null;

// ==========================================
// SOCKET URL
// ==========================================
export const getSocketUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_SOCKET_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);

      const isFrontendHost =
        typeof window !== "undefined" &&
        url.hostname === window.location.hostname &&
        import.meta.env.PROD;

      const isVercelHost =
        url.hostname.endsWith(".vercel.app");

      const isLocalHost =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1";

      if (
        import.meta.env.PROD &&
        (isFrontendHost || isVercelHost || isLocalHost)
      ) {
        console.error(
          "[SOCKET] Invalid production backend URL:",
          url.origin
        );
        return null;
      }

      if (
        import.meta.env.PROD &&
        url.protocol !== "https:"
      ) {
        console.error(
          "[SOCKET] HTTPS required in production"
        );
        return null;
      }

      return url.origin;
    } catch (error) {
      console.error(
        "[SOCKET] Invalid backend URL:",
        configuredUrl,
        error
      );
      return null;
    }
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  console.error(
    "[SOCKET] Missing backend URL in production"
  );

  return null;
};

// ==========================================
// INITIALIZE SOCKET
// ==========================================
export const initSocket = (token, schoolId = null) => {
  if (!token) {
    throw new Error("SOCKET_TOKEN_REQUIRED");
  }

  const normalizedSchoolId = schoolId || null;

  // Reuse existing connection
  if (
    socket &&
    socket.auth?.token === token &&
    (socket.auth?.schoolId || null) ===
      normalizedSchoolId
  ) {
    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  // Disconnect previous account/school
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const socketTargetUrl = getSocketUrl();

  if (!socketTargetUrl) {
    console.warn(
      "[SOCKET] Initialization skipped: invalid URL"
    );
    return null;
  }

  console.log(
    "[SOCKET] Connecting to:",
    socketTargetUrl
  );

  socket = io(socketTargetUrl, {
    auth: {
      token,
      schoolId: normalizedSchoolId,
    },

    autoConnect: true,

    // HTTP handshake first, then upgrade to WebSocket
    transports: ["polling", "websocket"],

    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  return socket;
};

export const getSocket = () => socket;

// ==========================================
// DISCONNECT SOCKET
// ==========================================
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
