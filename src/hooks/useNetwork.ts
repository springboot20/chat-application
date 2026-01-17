// hooks/useNetwork.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocketContext } from './useSocket';
import { USER_WENT_ONLINE_EVENT, USER_WENT_OFFLINE_EVENT } from '../enums';

export const useNetwork = () => {
  const { socket, connected } = useSocketContext();
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  const setOnline = useCallback(() => {
    setIsOnline(true);

    // ✅ Notify backend that user is online
    if (socket?.connected && connected) {
      socket.emit(USER_WENT_ONLINE_EVENT);
      console.log('🟢 Notified backend: User is ONLINE');
    }
  }, [socket, connected]);

  const setOffline = useCallback(() => {
    setIsOnline(false);

    // ✅ Notify backend that user is offline
    if (socket?.connected && connected) {
      socket.emit(USER_WENT_OFFLINE_EVENT);
      console.log('🔴 Notified backend: User is OFFLINE');
    }
  }, [socket, connected]);

  useEffect(() => {
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    // Notify backend of current status when socket connects
    if (socket?.connected && connected && navigator.onLine) {
      socket.emit(USER_WENT_ONLINE_EVENT);
    }

    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, [setOffline, setOnline, socket, connected]);

  return useMemo(
    () => ({
      isOnline,
    }),
    [isOnline]
  );
};
