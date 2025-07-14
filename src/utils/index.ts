import { ApiRequestHandlerProps } from "../types/api";
import { toast } from "react-toastify";
import { ChatListItemInterface } from "../types/chat";
import { User } from "../types/auth";

export const classNames = (...className: (string | boolean | undefined)[]) => {
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
    onError(error?.response?.data?.message ?? "something went wrong", toast.error);
  } finally {
    setLoading && setLoading(false);
  }
};

export const isBrowser = typeof window !== "undefined";

export class AudioManager {
  private audio: HTMLAudioElement;
  private isReady: boolean = false;

  constructor(audioSrc: string) {
    this.audio = new Audio(audioSrc);
    this.audio.preload = "auto";
    this.setupAudio();
  }

  private setupAudio() {
    this.audio.volume = 0.5;
    this.audio.addEventListener("canplaythrough", () => {
      this.isReady = true;
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Audio loading error: ", e);
    });
  }

  async initializeAudio(): Promise<void> {
    if (!this.isReady) return;

    try {
      this.audio.volume = 0.5;
      await this.audio.play();
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.volume = 0.5;
      this.isReady = Boolean(1);
    } catch (error: any) {
      console.warn("Audio initialization failed:", error);
    }
  }

  async playSound(): Promise<void> {
    if (!this.isReady) {
      console.warn("Audio not ready. User interaction required first.");
      return;
    }

    try {
      // Reset audio to beginning
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
}

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

export const getMessageObjectMetaData = (chat: ChatListItemInterface, user: User) => {

  if (!chat || !chat.lastMessage) {
    const participant = chat.participants?.find((p) => p?._id !== user._id);

    return {
      title: chat?.name,
      lastMessage: "No message yet",
      description: chat?.isGroupChat
        ? `${chat?.participants?.length || 0} members in the group`
        : participant?.email,
    };
  }

  const lastMessage = chat.lastMessage.content || "";

  const attachmentText =
    chat.lastMessage.attachments && chat.lastMessage.attachments.length > 0
      && `${chat.lastMessage.attachments.length} ${
          chat.lastMessage.attachments.length > 1 ? "s" : ""
        }`
      ;

  if (chat.isGroupChat) {
    return {
      title: chat.name,
      lastMessage: chat.lastMessage.sender?.username
        ? `${chat.lastMessage?.sender?.username}: ${lastMessage}${
            attachmentText ? attachmentText : ""
          }`
        : lastMessage,
      description: `${chat.participants?.length} members in the group`,
    };
  } else {
    const participant = chat.participants?.find((p) => p?._id !== user._id);

    return {
      title: participant?.username,
      lastMessage: lastMessage || "No message yet",
      description: participant?.email,
    };
  }
};
