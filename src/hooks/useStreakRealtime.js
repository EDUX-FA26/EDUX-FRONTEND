import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

export function useStreakRealtime(onStreakUpdated) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleStreakUpdate = (payload) => {
      if (typeof onStreakUpdated === 'function') {
        onStreakUpdated(payload);
      }
    };

    socket.on('learning:streak-updated', handleStreakUpdate);

    return () => {
      socket.off('learning:streak-updated', handleStreakUpdate);
    };
  }, [socket, onStreakUpdated]);
}