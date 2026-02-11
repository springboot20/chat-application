import React, { createContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../redux/redux.hooks';
import { CONNECTED_EVENT, DISCONNECT_EVENT, SOCKET_ERROR_EVENT } from '../enums';

export const SocketContext = createContext({
  socket: null as Socket | null,
  connected: false,
});

const createSocket = (accessToken: string) => {
  const env = import.meta.env;
  const url =
    env.MODE === 'production' ? env.VITE_CHAT_APP_SOCKET_URL : env.VITE_CHAT_APP_SOCKET_LOCAL_URL;

  return io(url, {
    auth: {
      tokens: { accessToken },
    },
    transports: ['websocket'], // 🔑 VERY IMPORTANT
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const { isAuthenticated, tokens } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // 🔒 Only create socket when authenticated
    if (!isAuthenticated || !tokens?.accessToken) return;

    // ✅ Prevent duplicate socket creation
    if (socketRef.current) return;

    console.log('🚀 Creating socket connection');

    const socket = createSocket(tokens.accessToken);
    socketRef.current = socket;

    socket.on(CONNECTED_EVENT, () => {
      console.log('🟢 Socket connected');
      setConnected(true);
    });

    socket.on(DISCONNECT_EVENT, (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on(SOCKET_ERROR_EVENT, (error) => {
      console.error('❌ Socket error:', error);
    });

    return () => {
      // ❌ DO NOT DISCONNECT HERE
    };
  }, [isAuthenticated, tokens?.accessToken]);

  // 🔐 Explicit logout cleanup
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      console.log('🧹 Disconnecting socket on logout');
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
      }}>
      {children}
    </SocketContext.Provider>
  );
};
