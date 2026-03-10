import { DBStorageKeys, IndexDBStorageService } from '.';
import { Attachment } from '../types/chat';

export interface SerializedFile {
  name: string;
  type: string;
  size: number;
  base64: string;
}

interface QueuedMessage {
  id: string;
  chatId: string;
  content: string;
  attachments?: Attachment[];
  mentions?: any[];
  polling?: Record<string, any>;
  contentType?: string;
  timestamp: number;
  replyId?: string;
}

interface QueuedMessageInput {
  chatId: string;
  content: string;
  attachments?: File[];
  mentions?: any[];
  polling?: Record<string, any>;
  contentType?: string;
  replyId?: string;
}

export function resolveFileType(file: File): Attachment['fileType'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'voice';
  return 'document';
}

export const fileToBase64 = (file: File): Promise<Attachment> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve({
        url: '', // no server URL yet
        localPath: reader.result as string, // base64 data URL
        isLocal: true,
        fileType: resolveFileType(file),
        fileName: file.name,
        fileSize: file.size,
      });

    reader.onerror = () => reject(new Error(`Failed to read: ${file.name}`));
    reader.readAsDataURL(file);
  });

export const base64ToFile = ({ localPath, fileName, fileType }: Attachment): File => {
  const [, data] = localPath?.split(',') || [];
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], String(fileName), { type: fileType });
};

const STORE = DBStorageKeys.Queued;

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private idb = new IndexDBStorageService();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.idb
      .initializeDB()
      .then(() => this.loadFromDB())
      .catch((err) => console.error('MessageQueue init failed:', err));
  }

  private async ensureReady() {
    await this.ready;
  }

  private async loadFromDB() {
    try {
      this.queue = await this.idb.getAll<QueuedMessage>(STORE);
      console.log(`📦 Loaded ${this.queue.length} queued messages from IndexedDB`);
    } catch (err) {
      console.error('Failed to load queued messages:', err);
      this.queue = [];
    }
  }

  async add(message: QueuedMessageInput): Promise<string> {
    await this.ensureReady();

    const serializedFiles: Attachment[] = [];
    if (message.attachments?.length) {
      for (const file of message.attachments) {
        try {
          serializedFiles.push(await fileToBase64(file));
        } catch (err) {
          console.error(`Skipping ${file.name}:`, err);
        }
      }
    }

    const queued: QueuedMessage = {
      id: `queued_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      chatId: message.chatId,
      content: message.content,
      mentions: message.mentions,
      polling: message.polling,
      contentType: message.contentType,
      replyId: message.replyId,
      attachments: serializedFiles,
    };

    // Save individual item — respects keyPath: 'id'
    await this.idb.set<QueuedMessage>(STORE, queued);
    this.queue.push(queued);

    console.log(`📥 Message queued (offline): ${queued.id}`);
    return queued.id;
  }

  async getAll(): Promise<QueuedMessage[]> {
    await this.ensureReady();
    return [...this.queue];
  }

  async getAllForChat(chatId: string): Promise<QueuedMessage[]> {
    await this.ensureReady();
    return this.queue.filter((m) => m.chatId === chatId);
  }

  async getAllForChatWithFiles(chatId: string) {
    await this.ensureReady();
    return this.queue
      .filter((m) => m.chatId === chatId)
      .map((m) => ({
        ...m,
        attachments: (m.attachments ?? []).map(base64ToFile),
      }));
  }

  async getAllWithFiles() {
    await this.ensureReady();
    return this.queue.map((m) => ({
      ...m,
      attachments: (m.attachments ?? []).map(base64ToFile),
    }));
  }

  async remove(id: string): Promise<void> {
    await this.ensureReady();
    await this.idb.remove(STORE, id);
    this.queue = this.queue.filter((m) => m.id !== id);
    console.log(`✅ Message removed from queue: ${id}`);
  }

  async clear(): Promise<void> {
    await this.ensureReady();
    await this.idb.clear(STORE);
    this.queue = [];
    console.log('🗑️ Message queue cleared');
  }

  async clearForChat(chatId: string): Promise<void> {
    await this.ensureReady();
    const toRemove = this.queue.filter((m) => m.chatId === chatId);

    await Promise.all(toRemove.map((m) => this.idb.remove(STORE, m.id)));

    this.queue = this.queue.filter((m) => m.chatId !== chatId);

    console.log(`🗑️ Queue cleared for chat: ${chatId}`);
  }

  get length() {
    return this.queue.length;
  }
}

export const messageQueue = new MessageQueue();
