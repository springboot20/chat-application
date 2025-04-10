import React, { createContext, useContext, useEffect, useState } from "react";
import { SocketContextType } from "../types/context";
import socketio from "socket.io-client";
import { LocalStorage } from "../utils";
import { CONNECTED_EVENT, DISCONNECT_EVENT } from "../enums";

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onConnect: () => {},
  onDisconnect: () => {},
});

const getSocket = () => {
  const token = LocalStorage.get("token");

  const env = import.meta.env;
  const url =
    env.MODE === "production" ? env.VITE_CHAT_APP_SOCKET_URL : env.VITE_CHAT_APP_SOCKET_LOCAL_URL;
 
  return socketio(url, {
    auth: { token },
    // withCredentials: true,
  });
};

export const useSocketContext = () => useContext(SocketContext);

export const SocketContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [socket, setSocket] = useState<ReturnType<typeof socketio> | null>(null);

  const [connected, setConnected] = useState(false);

  const onConnect = () => {
    setConnected(true);
  };

  const onDisconnect = () => {
    setConnected(false);
  };

  useEffect(() => {
    socket?.on(CONNECTED_EVENT, onConnect);
    socket?.on(DISCONNECT_EVENT, onDisconnect);

    setSocket(getSocket());

    return () => {
      socket?.off(CONNECTED_EVENT, onConnect);
      socket?.off(DISCONNECT_EVENT, onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, onConnect, onDisconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
