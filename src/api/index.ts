import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import { toast } from "react-toastify";

console.log(import.meta.env.CHAT_APP_BACKEND_URL)

export const chatAppApiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.CHAT_APP_BACKEND_URL,
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

  return chatAppApiClient({ ...options });
};

export const register = (data: {
  username: string;
  password: string;
  email: string;
}) => chatAppApiClient.post("/auth/users/register", data);

export const login = (data: { email: string; password: string }) =>
  chatAppApiClient.post("/auth/users/login", data);

export const logOut = () => chatAppApiClient.post("/auth/users/logout");

// chats
export const getAllChats = () => chatAppApiClient.get("/chat-app/chats/");

export const createChat = (receiverId: string) =>
  chatAppApiClient.post(`/chat-app/chats/create-chat/${receiverId}`);

export const createGroupChat = (data: {
  name: string;
  participants: string[];
}) => chatAppApiClient.post("/chat-app/group-chat", data);

export const getGroupChat = (chatId: string) =>
  chatAppApiClient.get(`/chat-app/group-chat/${chatId}`);

export const updateGroupChatDetails = (
  data: { name: string },
  chatId: string
) => chatAppApiClient.patch(`/chat-app/chats/group/${chatId}`, data);

export const deleteGroupChatDetails = (chatId: string) =>
  chatAppApiClient.delete(`/chat-app/chats/group/${chatId}`);

export const addParticipantToGroupChat = (
  chatId: string,
  participantId: string
) => chatAppApiClient.post(`/chat-app/chats/group/${chatId}/${participantId}`);

export const removeParticipantFromGroupChat = (
  chatId: string,
  participantId: string
) => chatAppApiClient.post(`/chat-app/chats/group/${chatId}/${participantId}`);

export const leaveChatGroup = (chatId: string) =>
  chatAppApiClient.delete(`/chat-app/chats/leave/group-chat/${chatId}`);

export const deleteOneOneChatMessage = (chatId: string) =>
  chatAppApiClient.delete(`/chat-app/chats/delete-one-on-one/${chatId}`);

export const getMessages = (chatId: string) =>
  chatAppApiClient.get(`/chat-app/chats/${chatId}`);

export const createMessage = (
  chatId: string,
  data: { content: string; attachments: File[] | undefined }
) => {
  const formData = new FormData();
  if (data.content) {
    formData.append("content", data.content);
  }
  
  data.attachments?.map((file) => {
    formData.append("attachment", file);
  });

  return chatAppApiClient.post(`/chat-app/chats/${chatId}`);
};
