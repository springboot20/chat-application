import { useEffect, useState, useCallback, useRef } from "react";
import { useSocketContext } from "./useSocket";
import {
  USER_ONLINE_EVENT,
  USER_OFFLINE_EVENT,
  CHECK_ONLINE_STATUS_EVENT,
  ONLINE_STATUS_RESPONSE_EVENT,
} from "../enums";

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { socket, connected } = useSocketContext();

  // Use a mutable ref to hold the current list of users we care about tracking
  const trackedUserIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleUserOnline = ({
      userId,
    }: {
      userId: string;
      username: string;
    }) => {
      setOnlineUsers((prev) => {
        if (prev.has(userId)) return prev; // Avoid unnecessary re-renders
        return new Set(prev).add(userId);
      });
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        if (!prev.has(userId)) return prev;
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    const handleOnlineStatusResponse = (statuses: Record<string, boolean>) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        let changed = false;

        Object.entries(statuses).forEach(([userId, isOnline]) => {
          if (isOnline && !updated.has(userId)) {
            updated.add(userId);
            changed = true;
          } else if (!isOnline && updated.has(userId)) {
            updated.delete(userId);
            changed = true;
          }
        });

        return changed ? updated : prev; // Safeguard React performance
      });
    };

    socket.on(USER_ONLINE_EVENT, handleUserOnline);
    socket.on(USER_OFFLINE_EVENT, handleUserOffline);
    socket.on(ONLINE_STATUS_RESPONSE_EVENT, handleOnlineStatusResponse);

    // 🔄 AUTOMATED SYNC INTERVAL:
    // Periodically re-verify state for currently tracked users to catch dead connections
    const syncInterval = setInterval(() => {
      if (socket.connected && trackedUserIdsRef.current.length > 0) {
        socket.emit(CHECK_ONLINE_STATUS_EVENT, {
          userIds: trackedUserIdsRef.current,
        });
      }
    }, 45000); // Check every 45 seconds (slightly longer than the 30-second server TTL)

    return () => {
      socket.off(USER_ONLINE_EVENT, handleUserOnline);
      socket.off(USER_OFFLINE_EVENT, handleUserOffline);
      socket.off(ONLINE_STATUS_RESPONSE_EVENT, handleOnlineStatusResponse);
      clearInterval(syncInterval);
    };
  }, [socket, connected]);

  // Check if a specific user is locally stored as online
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.has(userId);
    },
    [onlineUsers],
  );

  // Request online status for specific users and add them to background synchronization tracking
  const checkUsersOnlineStatus = useCallback(
    (userIds: string[]) => {
      if (!socket || !connected) return;

      // Update our sync tracking cache to remember these users
      trackedUserIdsRef.current = Array.from(
        new Set([...trackedUserIdsRef.current, ...userIds]),
      );

      socket.emit(CHECK_ONLINE_STATUS_EVENT, { userIds });
    },
    [socket, connected],
  );

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    checkUsersOnlineStatus,
    handleUserOnline: useCallback(
      (data: { userId: string; username: string }) => {
        setOnlineUsers((prev) =>
          prev.has(data.userId) ? prev : new Set(prev).add(data.userId),
        );
      },
      [],
    ),
    handleUserOffline: useCallback((data: { userId: string }) => {
      setOnlineUsers((prev) => {
        if (!prev.has(data.userId)) return prev;
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    }, []),
  };
};
