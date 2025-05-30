import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { AuthContextTypes } from "../types/context";
import { UserType } from "../types/user";
import { requestHandler } from "../utils";
import { chatAppApiClient, logOut, login, register } from "../api";
import { LocalStorage } from "../utils";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext<AuthContextTypes>({
  isLoading: true,
  user: null,
  token: null,
  isAuthenticated: false,
  registerUser: async () => {},
  loginUser: async () => {},
  logout: async () => {},
});

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(LocalStorage.get("token"));
  const [user, setUser] = useState<UserType | null>(LocalStorage.get("user"));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState(
    LocalStorage.get("authenticated") ?? false
  );
  const navigate = useNavigate();

  const registerUser = async (data: { username: string; email: string; password: string }) => {
    await requestHandler({
      api: async () => await register(data),
      setLoading: setIsLoading,
      onSuccess: (res) => {
        const { data } = res;
        setUser(data.user);

        LocalStorage.set("user", data.user);
        navigate("/login");
        return res;
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
      onSuccess: async (res, message, toast) => {
        const { data } = res;

        setUser(data.user);
        setToken(data.tokens.accessToken);

        LocalStorage.set("token", data.tokens.accessToken);
        LocalStorage.set("user", data.user);
        LocalStorage.set("authenticated", true);

        console.log(data.user);

        setIsAuthenticated(true);

        await Promise.resolve(setTimeout(() => navigate("/chat"), 1200));
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

        setIsAuthenticated(false);

        LocalStorage.remove("token");
        LocalStorage.set("authenticated", false);

        toast(message);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const setAuthorizationHeader = () => {
    if (token) {
      chatAppApiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete chatAppApiClient.defaults.headers.common["Authorization"];
      LocalStorage.remove("token");
    }
  };

  setAuthorizationHeader();

  const values = useMemo(
    () => ({
      token,
      user,
      registerUser,
      loginUser,
      logout,
      isLoading,
      isAuthenticated,
    }),
    [token, user, isLoading]
  );

  useEffect(() => {
    // Example: Load user from local storage or API
    const storedUser = LocalStorage.get("user") as UserType;
    const storedToken = LocalStorage.get("token") as string;
    const isAuthenticated = LocalStorage.get("authenticated") as boolean;

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      setIsAuthenticated(isAuthenticated);
    }
    setIsLoading(false);
  }, []);

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
