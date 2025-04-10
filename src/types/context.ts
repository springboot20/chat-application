import { UserType } from "./user";
import socketio from "socket.io-client";

export interface AuthContextTypes {
  isLoading: boolean;
  user: UserType | null;
  token: string | null;
  isAuthenticated: boolean;
  registerUser: (data: { username: string; email: string; password: string }) => Promise<void>;
  loginUser: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export interface SocketContextType {
  socket: ReturnType<typeof socketio> | null;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}
