import { useEffect, useState, useCallback } from 'react';
import { useSocketContext } from './useSocket';
import {
  USER_ONLINE_EVENT,
  USER_OFFLINE_EVENT,
  CHECK_ONLINE_STATUS_EVENT,
  ONLINE_STATUS_RESPONSE_EVENT,
} from '../enums';

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    // Listen for users coming online
    const handleUserOnline = ({ userId }: { userId: string; username: string }) => {
      console.log(`🟢 User came online: ${userId}`);
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    // Listen for users going offline
    const handleUserOffline = ({ userId }: { userId: string }) => {
      console.log(`🔴 User went offline: ${userId}`);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    // Listen for online status response
    const handleOnlineStatusResponse = (statuses: Record<string, boolean>) => {
      console.log('📊 Online status response:', statuses);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        Object.entries(statuses).forEach(([userId, isOnline]) => {
          if (isOnline) {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
        });
        return updated;
      });
    };

    socket.on(USER_ONLINE_EVENT, handleUserOnline);
    socket.on(USER_OFFLINE_EVENT, handleUserOffline);
    socket.on(ONLINE_STATUS_RESPONSE_EVENT, handleOnlineStatusResponse);

    return () => {
      socket.off(USER_ONLINE_EVENT, handleUserOnline);
      socket.off(USER_OFFLINE_EVENT, handleUserOffline);
      socket.off(ONLINE_STATUS_RESPONSE_EVENT, handleOnlineStatusResponse);
    };
  }, [socket]);

  // Check if a specific user is online
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  // Request online status for specific users
  const checkUsersOnlineStatus = useCallback(
    (userIds: string[]) => {
      if (!socket) return;
      socket.emit(CHECK_ONLINE_STATUS_EVENT, { userIds });
    },
    [socket]
  );

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    checkUsersOnlineStatus,
    handleUserOnline: useCallback((data: { userId: string; username: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    }, []),
    handleUserOffline: useCallback((data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    }, []),
  };
};
