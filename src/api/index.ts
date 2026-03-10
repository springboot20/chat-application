import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { LocalStorage } from '../utils';

export const chatAppApiClient: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === 'production'
      ? import.meta.env.VITE_CHAT_APP_BACKEND_URL
      : import.meta.env.VITE_CHAT_APP_BACKEND_LOCAL_URL,
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
      return config;
    },
    async (error) => {
      const originalRequest = error?.config;

      if (error.response && error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;

        const token = LocalStorage.get('tokens')?.refreshToken;

        if (token) {
          try {
            // Request new access token
            const res = await chatAppService({
              url: '/chat-app/auth/users/refresh',
              data: {
                inComingRefreshToken: token,
              },
            });

            // Save new tokens
            LocalStorage.set('tokens', res.data.tokens);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

            return chatAppApiClient(originalRequest);
          } catch (refreshError) {
            // Refresh token invalid, force logout or redirect to login
            localStorage.clear();
            window.location.href = '/login';
          }
        }
      }

      return Promise.reject(error);
    },
  );

  return chatAppApiClient({ ...options });
};

export const buildFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (key === 'attachments' && Array.isArray(data[key])) {
      // Handle attachments array by appending each file individually
      for (let i = 0; i < data[key].length; i++) {
        formData.append('attachments', data[key][i]);
      }
    } else if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
      // Handle other objects by stringifying them
      formData.append(key, JSON.stringify(data[key]));
    } else if (key === 'mentions' && Array.isArray(data[key])) {
      // Handle mentions array by appending each mentioned user individually
      for (let i = 0; i < data[key].length; i++) {
        formData.append('mentions', data[key][i]);
      }
    } else {
      // Handle primitive values and File objects
      formData.append(key, data[key]);
    }
  });

  return formData;
};

interface SendPayload {
  chatId: string;
  data: { [key: string]: any };
  messageId?: string; // only for replies
  onProgress?: (pct: number) => void;
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
  const url = messageId
    ? `/chat-app/messages/${chatId}/${messageId}/reply`
    : `/chat-app/messages/${chatId}`;

  const method = messageId ? 'patch' : 'post';
  const token = LocalStorage.get('tokens')?.accessToken;

  const api = await chatAppService({
    method,
    url,
    data: buildFormData(data),
    headers: {
      // Let axios set Content-Type with boundary automatically
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true, // if you use cookies instead of Bearer
    onUploadProgress: (progressEvent) => {
      const total = progressEvent.total ?? 0;
      if (total > 0) {
        const pct = Math.round((progressEvent.loaded / total) * 100);
        onProgress?.(pct);
      }
    },
  });

  return {
    response: api.data,
  };
};
