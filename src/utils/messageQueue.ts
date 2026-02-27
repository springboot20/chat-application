import { LocalStorage } from '.';

// utils/messageQueue.ts
interface QueuedMessage {
  id: string;
  chatId: string;
  content: string;
  attachments?: File[];
  mentions?: any[];
  polling?: Record<string, any>;
  contentType?: string;
  timestamp: number;
  replyId?: string;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private readonly STORAGE_KEY = 'queued_messages';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = LocalStorage.get(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.queue.length} queued messages from storage`);
      }
    } catch (error) {
      console.error('Failed to load queued messages:', error);
    }
  }

  private saveToStorage() {
    try {
      LocalStorage.set(this.STORAGE_KEY, this.queue);
    } catch (error) {
      console.error('Failed to save queued messages:', error);
    }
  }

  add(message: Omit<QueuedMessage, 'id' | 'timestamp'>) {
    console.log(message);

    const queuedMessage: QueuedMessage = {
      ...message,
      id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.queue.push(queuedMessage);
    this.saveToStorage();
    console.log(`📥 Message queued (offline): ${queuedMessage.id}`);

    return queuedMessage.id;
  }

  getAll(): QueuedMessage[] {
    return [...this.queue];
  }

  getAllForChat(chatId: string): QueuedMessage[] {
    return this.queue.filter((msg) => msg.chatId === chatId);
  }

  remove(id: string) {
    this.queue = this.queue.filter((msg) => msg.id !== id);
    this.saveToStorage();
    console.log(`✅ Message removed from queue: ${id}`);
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
    console.log('🗑️ Message queue cleared');
  }

  clearForChat(chatId: string) {
    this.queue = this.queue.filter((msg) => msg.chatId !== chatId);
    this.saveToStorage();
    console.log(`🗑️ Message queue cleared for chat: ${chatId}`);
  }
}

export const messageQueue = new MessageQueue();
