import { ApiRequestHandlerProps } from '../types/api';
import { toast } from 'react-toastify';
import { Attachment, ChatListItemInterface } from '../types/chat';
import { User } from '../types/auth';
import moment from 'moment';

export function getInitials({ username }: { username?: string }) {
  console.log(username);
  const parts = username?.split(/[^A-Za-z0-9]+/).filter(Boolean);

  console.log(parts);
  return parts ? (parts[0]?.[0] || '') + (parts[1]?.[0] || '') : 'UN';
}

export const classNames = (...className: (string | boolean | undefined)[]) => {
  return className.filter(Boolean).join(' ');
};

export function getExtColor(ext: string): string {
  if (ext === 'PDF') return '#e53e3e';
  if (['DOC', 'DOCX'].includes(ext)) return '#3182ce';
  if (['XLS', 'XLSX'].includes(ext)) return '#38a169';
  if (['PPT', 'PPTX'].includes(ext)) return '#dd6b20';
  if (['ZIP', 'RAR', '7Z'].includes(ext)) return '#805ad5';
  if (['MP4', 'MOV', 'AVI', 'MKV'].includes(ext)) return '#d53f8c';
  return '#4299e1';
}

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const timeAgo = (timestamp: string | Date) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const formatMessageTime = (timestamp: string | Date): string => {
  const messageDate = moment(timestamp);
  // WhatsApp always shows time on message bubbles (e.g., "3:25 PM")
  return messageDate.format('h:mm A');
};

/**
 * WhatsApp-style time formatting for the chat list sidebar.
 * - Today: "3:25 PM"
 * - Yesterday: "Yesterday"
 * - This week: "Monday", "Tuesday", etc.
 * - Older: "1/15/2025"
 */
export const formatChatListTime = (timestamp: string | Date): string => {
  const messageDate = moment(timestamp);
  const now = moment();
  const yesterday = moment().subtract(1, 'day');

  if (messageDate.isSame(now, 'day')) {
    return messageDate.format('h:mm A');
  }
  if (messageDate.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  if (messageDate.isSame(now, 'week')) {
    return messageDate.format('dddd');
  }
  return messageDate.format('M/D/YYYY');
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

    if (data?.success && response.status.toString().startsWith('2')) {
      onSuccess(data, data.message, toast.success);
    }
  } catch (error: any) {
    if ([401, 403].includes(error?.response?.data.statusCode)) {
      LocalStorage.clear();
      if (isBrowser) window.location.href = './';
    }
    onError(error?.response?.data?.message ?? 'something went wrong', toast.error);
  } finally {
    setLoading && setLoading(false);
  }
};

export const isBrowser = typeof window !== 'undefined';

export class AudioManager {
  private audio: HTMLAudioElement;
  private isReady: boolean = false;

  constructor(audioSrc: string) {
    this.audio = new Audio(audioSrc);
    this.audio.preload = 'auto';
    this.setupAudio();
  }

  private setupAudio() {
    this.audio.volume = 0.5;
    this.audio.addEventListener('canplaythrough', () => {
      this.isReady = true;
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio loading error: ', e);
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
      console.warn('Audio initialization failed:', error);
    }
  }

  async playSound(): Promise<void> {
    if (!this.isReady) {
      console.warn('Audio not ready. User interaction required first.');
      return;
    }

    try {
      // Reset audio to beginning
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
}

export const DBStorageKeys = {
  Queued: 'queued_messages',
  Chats: 'chats',
  ChatMessages: 'chatmessages',
  UnreadMessages: 'unreadMessages',
  Users: 'users',
};

export class IndexDBStorageService {
  private DBName: string = 'Q-message';
  public DB: IDBDatabase | undefined;
  private readonly DB_VERSION = 1;

  async initializeDB(): Promise<boolean> {
    if (this.DB) return true;
    return new Promise((resolve) => {
      const request = indexedDB.open(this.DBName, this.DB_VERSION);

      request.addEventListener('upgradeneeded', () => {
        this.DB = request?.result;

        Object.values(DBStorageKeys).forEach((key) => {
          if (!this.DB?.objectStoreNames.contains(key)) {
            this.DB?.createObjectStore(key, { keyPath: 'id' });
          }
        });
      });

      request.addEventListener('success', () => {
        this.DB = request?.result;
        resolve(true);
      });

      request.addEventListener('error', () => {
        resolve(false);
      });
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.DB) {
      const success = await this.initializeDB();
      if (!success) throw new Error('Failed to initialize IndexedDB');
    }
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.ensureDB();
    if (!this.DB) throw new Error('IndexedDB not initialized');
    return this.DB.transaction(storeName, mode).objectStore(storeName);
  }

  async set<T>(storeName: string, data: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    // Ensure data is serializable and free of circular references/proxies
    const sanitizedData = removeCircularReferences(data);

    console.log({ sanitizedData });

    return new Promise((resolve, reject) => {
      const request = store.put(sanitizedData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexDBStorage = new IndexDBStorageService();

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

export class DownloadTracker {
  private static KEY = 'downloaded_files';

  static isDownloaded(fileUrl: string): boolean {
    if (!isBrowser) return false;
    const downloaded = LocalStorage.get(this.KEY) || {};
    return !!downloaded[fileUrl];
  }

  static markAsDownloaded(fileUrl: string): void {
    if (!isBrowser) return;
    const downloaded = LocalStorage.get(this.KEY) || {};
    downloaded[fileUrl] = true;
    LocalStorage.set(this.KEY, downloaded);
  }
}

export const getMessageObjectMetaData = (chat: ChatListItemInterface, user: User) => {
  if (!chat || !chat.lastMessage) {
    const participant = chat.participants?.find((p) => p?._id !== user?._id);

    return {
      title: chat?.name,
      lastMessage: 'No message yet',
      description: chat?.isGroupChat
        ? `${chat?.participants?.length || 0} members in the group`
        : participant?.email,
      status: null,
      isSender: false,
      attachmentType: undefined,
    };
  }

  const { lastMessage } = chat;
  const isSelf = lastMessage.sender?._id === user?._id;
  const messageContent = lastMessage.content ? truncate(lastMessage.content, 30) : '';

  let attachmentText = '';
  let attachmentFileType: string | undefined = undefined;

  if (lastMessage.attachments && lastMessage.attachments.length > 0) {
    attachmentFileType = (lastMessage.attachments[0] as Attachment).fileType || 'file';

    if (lastMessage.attachments.length === 1 && !messageContent) {
      const type = attachmentFileType;
      attachmentText = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Attachment';
    } else {
      attachmentText = `${lastMessage.attachments.length} Attachment${
        lastMessage.attachments.length > 1 ? 's' : ''
      }`;
    }
  }

  let displayMessage = messageContent;

  // If there's no message content but there is an attachment, show the attachment text
  if (!displayMessage && attachmentText) {
    displayMessage = attachmentText;
  }

  if (lastMessage.contentType === 'polling' && lastMessage.polling) {
    displayMessage = `Poll: ${lastMessage.polling.questionTitle}`;
    attachmentFileType = 'poll';
  }

  if (chat.isGroupChat) {
    return {
      title: chat.name,
      lastMessage: isSelf
        ? `You: ${displayMessage}`
        : `${lastMessage.sender?.username}: ${displayMessage}`,
      description: `${chat.participants?.length} members in the group`,
      status: lastMessage.status,
      isSender: isSelf,
      attachmentType: attachmentFileType,
    };
  } else {
    const participant = chat.participants?.find((p) => p?._id !== user?._id);

    return {
      title: participant?.username,
      // lastMessage: isSelf ? `You: ${displayMessage}` : displayMessage,
      lastMessage: displayMessage,
      description: participant?.email,
      status: lastMessage.status,
      isSender: isSelf,
      attachmentType: attachmentFileType,
    };
  }
};

export const getDynamicUserColor = (userId: string, isDarkMode: boolean = false) => {
  if (!userId) return isDarkMode ? '#e5e7eb' : '#374151'; // Default gray

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  // Ensure good visibility:
  // Light mode: Saturation 65-85%, Lightness 35-45% (Darker text)
  // Dark mode: Saturation 65-85%, Lightness 65-75% (Lighter text)
  const saturation = 70 + (hash % 20);
  const lightness = isDarkMode ? 70 + (hash % 10) : 40 + (hash % 10);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const truncate = (text: string, length: number) => {
  if (text.length > length) {
    return `${text.slice(0, length)}...`;
  }

  return text;
};

export function removeCircularReferences(obj: any) {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    }),
  );
}
