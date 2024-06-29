import React, { createContext, useContext, useEffect, useState } from 'react';
import { SocketContextType } from '../types/context.type';
import socketio from 'socket.io-client';
import { LocalStorage } from '../utils';

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

const getSocket = () => {
  const token = LocalStorage.get('token');

  return socketio(import.meta.env.CHAT_APP_SOCKET_URL, {
    auth: { token },
    timeout: 3000,
    withCredentials: true,
  });
};

export const useSocketContext = () => useContext(SocketContext);

export const SocketContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [socket, setSocket] = useState<ReturnType<typeof socketio> | null>(null);

  useEffect(() => {
    setSocket(getSocket());
  }, []);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
