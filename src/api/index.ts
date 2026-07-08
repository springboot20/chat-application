import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import store from "../app/store";
import { refreshAccessTokenIfNeeded } from "./refreshAccessToken";

export const chatAppApiClient: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? import.meta.env.VITE_CHAT_APP_BACKEND_URL
      : import.meta.env.VITE_CHAT_APP_BACKEND_LOCAL_URL,
  withCredentials: true,
});

/**
 * Attach the latest access token from Redux.
 * Refreshing is handled exclusively by RTK Query.
 */
chatAppApiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.tokens?.accessToken;

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

interface ChatAppServiceProps extends AxiosRequestConfig {
  showSuccessNotification?: boolean;
}

export const chatAppService = async ({ ...options }: ChatAppServiceProps) => {
  return chatAppApiClient({
    ...options,
  });
};

export const buildFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (key === "attachments" && Array.isArray(data[key])) {
      for (let i = 0; i < data[key].length; i++) {
        formData.append("attachments", data[key][i]);
      }
    } else if (
      typeof data[key] === "object" &&
      data[key] !== null &&
      !(data[key] instanceof File)
    ) {
      formData.append(key, JSON.stringify(data[key]));
    } else {
      formData.append(key, data[key]);
    }
  });

  return formData;
};

interface SendPayload {
  chatId: string;
  data: Record<string, any>;
  messageId?: string;
  onProgress?: (percentage: number) => void;
}

interface RequestReturnResult {
  response: any;
}

export const sendRequest = async ({
  chatId,
  data,
  messageId,
  onProgress,
}: SendPayload): Promise<RequestReturnResult> => {
  await refreshAccessTokenIfNeeded({
    dispatch: store.dispatch,
    getState: store.getState,
  });

  const url = messageId
    ? `/chat-app/messages/${chatId}/${messageId}/reply`
    : `/chat-app/messages/${chatId}`;

  const method = messageId ? "patch" : "post";

  const response = await chatAppService({
    url,
    method,
    data: buildFormData(data),
    onUploadProgress: (progressEvent) => {
      const total = progressEvent.total ?? 0;

      if (!total) return;

      const percentage = Math.round((progressEvent.loaded / total) * 100);

      onProgress?.(percentage);
    },
  });

  return {
    response: response.data,
  };
};
