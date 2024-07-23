import React, { createContext, useContext, useMemo, useState } from "react";
import { AuthContextTypes } from "../types/context.type";
import { UserType } from "../types/user.type";
import { requestHandler } from "../utils";
import { logOut, login, register } from "../api";
import { LocalStorage } from "../utils";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext<AuthContextTypes>({
  isLoading: true,
  user: null,
  token: null,
  registerUser: async () => {},
  loginUser: async () => {},
  logout: async () => {},
});

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const registerUser = async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    await requestHandler({
      api: async () => await register(data),
      setLoading: setIsLoading,
      onSuccess: (res) => {
        const { data } = res;
        setUser(data.user);

        console.log(data);
        navigate("/login");
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const loginUser = async (data: { email: string; password: string }) => {
    await requestHandler({
      api: async () => await login(data),
      setLoading: setIsLoading,
      onSuccess: (res, message, toast) => {
        const { data } = res;

        setUser(data.user);
        setToken(data.tokens.accessToken);

        LocalStorage.set("token", data.tokens.accessToken);
        LocalStorage.set("user", data.user);
        console.log(data.user);

        navigate("/chat");
        toast(message);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const logout = async () => {
    await requestHandler({
      api: async () => await logOut(),
      setLoading: setIsLoading,
      onSuccess: (__, message, toast) => {
        setUser(null);
        setToken(null);
        toast(message);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const values = useMemo(
    () => ({
      token,
      user,
      registerUser,
      loginUser,
      logout,
      isLoading,
    }),
    [token, user, registerUser, loginUser, logout, isLoading]
  );

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
