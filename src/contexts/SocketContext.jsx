import React, { createContext, useContext, useEffect } from 'react';
import { initSocket, disconnectSocket, getSocket } from '../config/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth(); // Giả định AuthContext có cung cấp token hoặc user

  useEffect(() => {
    if (user && token) {
      const socket = initSocket(token);
      
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      return () => {
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket: getSocket() }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);