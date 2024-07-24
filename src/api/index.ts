import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import { LocalStorage } from "../utils";
import { toast } from "react-toastify";

export const chatAppApiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:4040/api/v1",
  timeout: 12000,
});

interface ChatAppServiceProps extends AxiosRequestConfig {
  showSuccessNotification?: boolean;
}

export const chatAppService = async ({
  showSuccessNotification = true,
  ...options
}: ChatAppServiceProps) => {
  chatAppApiClient.interceptors.response.use(
    (config: AxiosResponse) => {
      const token = LocalStorage.get("token");
      config.headers.Authorization = `Bearer ${token}`;

      if (config.status.toString().startsWith("2")) {
        showSuccessNotification ? toast.success(config.data.message) : "";
      }

      return config;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        const errorMsg = (error.response?.data as { error?: string })?.error;
        const errorWithMsg = (error.response?.data as { message?: string })
          ?.message;

        if (errorMsg) {
          toast.error(errorMsg);
        } else if (errorWithMsg) {
          toast.error(errorWithMsg);
        }
      } else {
        toast.error(error.message);
      }

      return Promise.reject(error);
    }
  );

  return chatAppApiClient({...options})
};

export const register = (data: {
  username: string;
  password: string;
  email: string;
}) => chatAppApiClient.post("/auth/users/register", data);

export const login = (data: { email: string; password: string }) =>
  chatAppApiClient.post("/auth/users/login", data);

export const logOut = () => chatAppApiClient.post("/auth/users/logout");
