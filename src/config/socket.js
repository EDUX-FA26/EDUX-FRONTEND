import { io } from "socket.io-client";

let socket = null;

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

  socket = io(
    import.meta.env.VITE_SOCKET_URL ||
      window.location.origin,
    {
      auth: {
        token,
        schoolId: normalizedSchoolId,
      },

      autoConnect: true,

      transports: ["websocket"],
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