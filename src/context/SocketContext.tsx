import React, { createContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "../redux/redux.hooks";
import {
  CONNECTED_EVENT,
  DISCONNECT_EVENT,
  SOCKET_ERROR_EVENT,
  USER_WENT_ONLINE_EVENT,
} from "../enums";

export const SocketContext = createContext({
  socket: null as Socket | null,
  connected: false,
});

const createSocket = (accessToken: string) => {
  const env = import.meta.env;
  const url =
    env.MODE === "production"
      ? env.VITE_CHAT_APP_SOCKET_URL
      : env.VITE_CHAT_APP_SOCKET_LOCAL_URL;

  return io(url, {
    auth: {
      tokens: { accessToken },
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const { isAuthenticated, tokens } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) return;
    if (socketRef.current) return;

    console.log("🚀 Creating socket connection");

    const socket = createSocket(tokens.accessToken);
    socketRef.current = socket;

    // Use a ref to store our heartbeat interval so we can clear it reliably
    let heartbeatInterval: ReturnType<typeof setInterval>;

    socket.on(CONNECTED_EVENT, () => {
      console.log("🟢 Socket connected");
      setConnected(true);

      // 1️⃣ Instantly notify the backend to register the user as online in Redis
      socket.emit(USER_WENT_ONLINE_EVENT);

      // 2️⃣ Start a silent 15-second heartbeat loop to push out the Redis TTL window
      clearInterval(heartbeatInterval); // Clean up any stale loops
      heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit("HEARTBEAT");
        }
      }, 15000); // 15 seconds is perfect for a 30-second server TTL
    });

    socket.on(DISCONNECT_EVENT, (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      setConnected(false);
      clearInterval(heartbeatInterval); // Stop pinging when disconnected
    });

    socket.on(SOCKET_ERROR_EVENT, (error) => {
      console.error("❌ Socket error:", error);
    });

    return () => {
      console.log("🧹 Cleaning up socket connection on unmount");
      clearInterval(heartbeatInterval);
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, tokens?.accessToken]);

  // Explicit logout cleanup
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      console.log("🧹 Disconnecting socket on logout");
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
