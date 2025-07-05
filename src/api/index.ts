import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import { toast } from "react-toastify";

export const chatAppApiClient: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? import.meta.env.VITE_CHAT_APP_BACKEND_URL
      : import.meta.env.VITE_CHAT_APP_BACKEND_LOCAL_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
      if (config.status.toString().startsWith("2")) {
        showSuccessNotification ? toast.success(config.data.message) : "";
      }

      return config;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        const errorMsg = (error.response?.data as { error?: string })?.error;
        const errorWithMsg = (error.response?.data as { message?: string })?.message;

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

  return chatAppApiClient({ ...options });
};

export const register = (data: { username: string; password: string; email: string }) =>
  chatAppApiClient.post("/auth/users/register", data);

export const login = (data: { email: string; password: string }) =>
  chatAppApiClient.post("/auth/users/login", data);

export const logOut = () => chatAppApiClient.post("/auth/users/logout");

// chats
export const getUserChats = () => chatAppApiClient.get("/chat-app/chats/");

export const createUserChat = (receiverId: string) =>
  chatAppApiClient.post(`/chat-app/chats/create-chat/${receiverId}`);

export const getAvailableUsers = () => chatAppApiClient.get("/chat-app/chats/available-users");

export const createGroupChat = (data: { name: string; participants: string[] }) =>
  chatAppApiClient.post("/chat-app/chats/group-chat", data);

export const getGroupChat = (chatId: string) =>
  chatAppApiClient.get(`/chat-app/chats/group-chat/${chatId}`);

export const updateGroupChatDetails = (data: { name: string }, chatId: string) =>
  chatAppApiClient.patch(`/chat-app/chats/group-chat/${chatId}`, data);

export const deleteGroupChatDetails = (chatId: string) =>
  chatAppApiClient.delete(`/chat-app/chats/group-chat/${chatId}`);

export const addParticipantToGroupChat = (chatId: string, participantId: string) =>
  chatAppApiClient.post(`/chat-app/chats/group-chat/${chatId}/${participantId}`);

export const removeParticipantFromGroupChat = (chatId: string, participantId: string) =>
  chatAppApiClient.post(`/chat-app/chats/group-chat/${chatId}/${participantId}`);

export const leaveChatGroup = (chatId: string) =>
  chatAppApiClient.delete(`/chat-app/chats/leave/group-chat/${chatId}`);

export const deleteOneOneChatMessage = (chatId: string) =>
  chatAppApiClient.delete(`/chat-app/chats/delete-one-on-one/${chatId}`);

export const getChatMessages = (chatId: string) =>
  chatAppApiClient.get(`/chat-app/messages/${chatId}`);

export const reactToChatMessages = (chatId: string) =>
  chatAppApiClient.patch(`/chat-app/messages/${chatId}`);

export const sendMessage = (
  chatId: string,
  data: { content: string; attachments: File[] | undefined }
) => {
  const formData = new FormData();
  if (data.content) {
    formData.append("content", data.content);
  }

  data.attachments?.map((file) => {
    formData.append("attachments", file);
  });

  return chatAppApiClient.post(`/chat-app/messages/${chatId}`, data);
};
