import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import { SocketContextType } from "../types/context";
import socketio from "socket.io-client";
import { Token } from "../types/auth";
import { CONNECTED_EVENT, DISCONNECT_EVENT, SOCKET_ERROR_EVENT } from "../enums";
import { useAppSelector } from "../redux/redux.hooks";

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onConnect: () => {},
  onDisconnect: () => {},
});

const getSocket = (tokens: Token | null) => {
  const env = import.meta.env;
  const url =
    env.MODE === "production" ? env.VITE_CHAT_APP_SOCKET_URL : env.VITE_CHAT_APP_SOCKET_LOCAL_URL;

  return socketio(url, {
    auth: { tokens },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    transports: ["websocket"],
  });
};

export const SocketContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [socket, setSocket] = useState<ReturnType<typeof socketio> | null>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<ReturnType<typeof socketio> | null>(null);
  const { tokens } = useAppSelector((state) => state.auth);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [connected, setConnected] = useState(false);

  const onConnect = useCallback(() => {
    setConnected(true);
    setReconnecting(false);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  console.log(reconnecting, "reconnecting");

  const onDisconnect = useCallback(() => {
    setConnected(false);
    setReconnecting(true);
  }, []);

  const onSocketError = useCallback((error: any) => {
    setConnected(false);
    console.error("Socket error:", error);

    // Handle specific authentication errors
    if (
      error.message?.includes("Authentication failed") ||
      error.message?.includes("Unauthorized")
    ) {
      console.warn("🚫 Authentication failed, cleaning up socket");
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        socketRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket?.on(CONNECTED_EVENT, onConnect);
    socket?.on(DISCONNECT_EVENT, onDisconnect);
    socket?.on(SOCKET_ERROR_EVENT, onSocketError);

    socketRef.current = socket;

    return () => {
      socket?.off(CONNECTED_EVENT, onConnect);
      socket?.off(SOCKET_ERROR_EVENT, onSocketError);
      socket?.off(DISCONNECT_EVENT, onDisconnect);
    };
  }, [setSocket, socket, onConnect, onDisconnect, onSocketError]);

  useEffect(() => {
    // Clean up existing socket
    if (socketRef.current) {
      console.log("🧹 Cleaning up existing socket");
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setReconnecting(false);
    }

    // Only create socket if authenticated with valid tokens
    if (isAuthenticated && tokens?.accessToken) {
      console.log("🚀 Initializing new socket connection");
      const newSocket = getSocket(tokens);

      if (newSocket) {
        setSocket(newSocket);

        // Connect after a small delay to ensure proper setup
        setTimeout(() => {
          if (newSocket && !newSocket.connected) {
            newSocket.connect();
          }
        }, 100);
      }
    } else {
      console.log("❌ No valid authentication, skipping socket initialization");
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, tokens]);

  return (
    <SocketContext.Provider value={{ socket, connected, onConnect, onDisconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
