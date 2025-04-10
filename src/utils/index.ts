import { ApiRequestHandlerProps } from "../types/api";
import { toast } from "react-toastify";
import { ChatListItemInterface } from "../types/chat";
import { User } from "../types/auth";

export const classNames = (...className: string[]) => {
  return className.filter(Boolean).join(" ");
};

export const requestHandler = async ({
  api,
  setLoading,
  onSuccess,
  onError,
}: ApiRequestHandlerProps) => {
  setLoading && setLoading(true);

  try {
    const response = await api();
    const { data } = response;

    if (data?.success && response.status.toString().startsWith("2")) {
      onSuccess(data, data.message, toast.success);
    }
  } catch (error: any) {
    if ([401, 403].includes(error?.response?.data.statusCode)) {
      LocalStorage.clear();
      if (isBrowser) window.location.href = "./";
    }
    onError(
      error?.response?.data?.message ?? "something went wrong",
      toast.error
    );
  } finally {
    setLoading && setLoading(false);
  }
};

export const isBrowser = typeof window !== "undefined";

export class LocalStorage {
  static get(key: string) {
    if (!isBrowser) return;
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  static set(key: string, value: any) {
    if (!isBrowser) return;

    localStorage.setItem(key, JSON.stringify(value));
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

export const getMessageObjectMetaData = (
  chat: ChatListItemInterface,
  user: User
) => {
  const lastMessage = chat.lastMessage?.content
    ? chat.lastMessage?.content
    : chat.lastMessage
    ? `${chat.lastMessage?.attachments.length} attachment ${
        chat.lastMessage.attachments.length > 1 ? "s" : ""
      }`
    : "No message yet";

  if (chat.isGroupChat) {
    return {
      title: chat.name,
      lastMessage: chat.lastMessage
        ? `${chat.lastMessage?.sender?.username} : ${lastMessage}`
        : lastMessage,
      description: `${chat.participants.length} members in the group`,
    };
  } else {
    const participant = chat.participants?.find((p) => p?._id !== user._id);

    return {
      lastMessage,
      title: participant?.username,
      description: participant?.email,
      // avatar: participant?.avatar.url || undefined,
    };
  }
};
