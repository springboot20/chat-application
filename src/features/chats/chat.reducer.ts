import { ChatListItemInterface } from './../../types/chat';
import { ChatMessageInterface } from '../../types/chat';
import { indexDBStorage, DBStorageKeys } from './../../utils/index';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatApiSlice } from './chat.slice';
import { User } from '../../types/auth';

// ─── Helper ───────────────────────────────────────────────────────────────────
// Safe alternative to Immer's current() — works on both drafts and plain objects.
// Use this whenever you need a serializable snapshot to pass to indexDBStorage.
const snap = <T>(value: T): T => JSON.parse(JSON.stringify(value));

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitialState {
  chats: ChatListItemInterface[];
  chatMessages: Record<string, ChatMessageInterface[]>;
  unreadMessages: ChatMessageInterface[];
  currentChat: ChatListItemInterface | null;
  users: User[];
}

const initialState: InitialState = {
  chats: [],
  currentChat: null,
  users: [],
  chatMessages: {},
  unreadMessages: [],
};

interface ChatMessageUpdateInterface {
  chatToUpdateId: string;
  message: ChatMessageInterface;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const ChatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    newChat: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;
      state.chats = [chat, ...state.chats];
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
    },

    onChatLeave: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;
      if (chat?._id === state.currentChat?._id) {
        state.currentChat = null;
      }
      state.chats = state.chats.filter((ch) => ch?._id !== chat?._id);
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
    },

    replaceOptimisticMessage: (
      state,
      action: PayloadAction<{ chatId: string; tempId: string; realMessage: ChatMessageInterface }>,
    ) => {
      const { chatId, tempId, realMessage } = action.payload;
      if (!state.chatMessages[chatId]) return;

      const idx = state.chatMessages[chatId].findIndex((msg) => msg._id === tempId);
      if (idx !== -1) {
        state.chatMessages[chatId][idx] = { ...realMessage, status: 'sent' };
      }

      const chatIdx = state.chats.findIndex((c) => c._id === chatId);
      if (chatIdx !== -1 && state.chats[chatIdx].lastMessage?._id === tempId) {
        state.chats[chatIdx].lastMessage = realMessage;
      }

      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
    },

    updatePollVote: (
      state,
      action: PayloadAction<{ messageId: string; chatId: string; options: any[] }>,
    ) => {
      const { messageId, chatId, options } = action.payload;
      if (!state.chatMessages[chatId]) return;

      const idx = state.chatMessages[chatId].findIndex((m) => m._id === messageId);
      if (idx !== -1) {
        state.chatMessages[chatId][idx].polling.options = options;
      }

      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
    },

    onMessageReceived: (state, action: PayloadAction<{ data: ChatMessageInterface }>) => {
      const message = action.payload.data;
      const chatId = message.chat;

      if (!state.chatMessages[chatId]) {
        state.chatMessages[chatId] = [];
      }

      const isDuplicate = state.chatMessages[chatId].some((msg) => msg._id === message._id);
      if (isDuplicate) return;

      const existingIndex = state.chatMessages[chatId].findIndex((msg) => {
        const isTemp = msg._id.toString().startsWith('temp-') || msg.status === 'queued';
        return isTemp && msg.sender._id === message.sender._id && msg.content === message.content;
      });

      if (existingIndex !== -1) {
        state.chatMessages[chatId][existingIndex] = {
          ...message,
          status: message.status || 'sent',
        };
      } else {
        state.chatMessages[chatId].push(message);

        if (state.currentChat?._id !== chatId) {
          state.unreadMessages = [...(state.unreadMessages || []), message];
        }
      }

      const chatIdx = state.chats.findIndex((c) => c._id === chatId);
      if (chatIdx !== -1) {
        state.chats[chatIdx].lastMessage = message;
        state.chats[chatIdx].updatedAt = message.createdAt;
        const [moved] = state.chats.splice(chatIdx, 1);
        state.chats.unshift(moved);
      }

      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
    },

    updateMessageReactions: (
      state,
      action: PayloadAction<{ messageId: string; reactions: any[]; chatId: string }>,
    ) => {
      const { messageId, reactions, chatId } = action.payload;
      if (!state.chatMessages[chatId]) return;

      const msgIdx = state.chatMessages[chatId].findIndex((msg) => msg._id === messageId);
      if (msgIdx !== -1) {
        state.chatMessages[chatId][msgIdx] = {
          ...state.chatMessages[chatId][msgIdx],
          reactions,
        };
      }

      const chatIdx = state.chats.findIndex((c) => c.lastMessage?._id === messageId);
      if (chatIdx !== -1 && state.chats[chatIdx].lastMessage) {
        state.chats[chatIdx] = {
          ...state.chats[chatIdx],
          lastMessage: { ...state.chats[chatIdx].lastMessage!, reactions },
        };
      }

      if (state.currentChat?.lastMessage?._id === messageId && state.currentChat.lastMessage) {
        state.currentChat = {
          ...state.currentChat,
          lastMessage: { ...state.currentChat.lastMessage, reactions },
        };
      }

      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
    },

    setCurrentChat: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;
      state.currentChat = chat;

      if (state.unreadMessages) {
        state.unreadMessages = state.unreadMessages.filter((msg) => msg.chat !== chat._id);
        // ✅ snap() works on both draft and plain — no more Immer crash
        indexDBStorage.set(DBStorageKeys.UnreadMessages, {
          id: 'all_unread',
          data: snap(state.unreadMessages),
        });
      }
    },

    setUnreadMessages: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;
      state.unreadMessages = state.unreadMessages?.filter((msg) => msg?.chat !== chatId);
    },

    updateChatLastMessage: (state, action: PayloadAction<ChatMessageUpdateInterface>) => {
      const { chatToUpdateId, message } = action.payload;
      const chatIdx = state.chats.findIndex((c) => c._id === chatToUpdateId);

      if (chatIdx !== -1) {
        const updatedChat = {
          ...state.chats[chatIdx],
          lastMessage: message,
          updatedAt: message?.updatedAt || new Date().toISOString(),
        };
        state.chats[chatIdx] = updatedChat;

        if (state.currentChat?._id === chatToUpdateId) {
          state.currentChat = updatedChat;
        }

        indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
      }
    },

    updateGroupName: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;
      const chatIdx = state.chats.findIndex((c) => c._id === chat._id);

      if (chatIdx !== -1) {
        state.chats[chatIdx] = { ...state.chats[chatIdx], name: chat.name };

        if (state.currentChat?._id === chat._id) {
          state.currentChat = { ...state.currentChat, name: chat.name };
        }

        indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
      }
    },

    onChatDelete: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;
      state.chats = state.chats.filter((c) => c._id !== chatId);
      state.unreadMessages = state.unreadMessages.filter((msg) => msg.chat !== chatId);

      if (state.currentChat?._id === chatId) {
        state.currentChat = null;
      }

      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
      indexDBStorage.set(DBStorageKeys.UnreadMessages, {
        id: 'all_unread',
        data: snap(state.unreadMessages),
      });
    },

    onChatMessageDelete: (
      state,
      action: PayloadAction<{ messageId: string; message: ChatMessageInterface }>,
    ) => {
      const { messageId, message } = action.payload;
      const chatId = message.chat;
      if (!chatId || !state.chatMessages[chatId]) return;

      const idx = state.chatMessages[chatId].findIndex((msg) => msg._id === messageId);
      if (idx !== -1) {
        state.chatMessages[chatId][idx] = {
          ...state.chatMessages[chatId][idx],
          isDeleted: true,
          content: '',
          attachments: [],
        };
      }

      const chatIdx = state.chats.findIndex((c) => c.lastMessage?._id === messageId);
      if (chatIdx !== -1 && state.chats[chatIdx].lastMessage) {
        state.chats[chatIdx] = {
          ...state.chats[chatIdx],
          lastMessage: {
            ...state.chats[chatIdx].lastMessage!,
            isDeleted: true,
            content: '',
            attachments: [],
          },
        };
      }

      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
    },

    updateMessageDelivery: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string; deliveredTo: string[] }>,
    ) => {
      const { chatId, messageId, deliveredTo } = action.payload;
      if (!state.chatMessages[chatId]) return;

      const idx = state.chatMessages[chatId].findIndex((msg) => msg._id === messageId);
      if (idx !== -1) {
        const msg = state.chatMessages[chatId][idx];
        state.chatMessages[chatId][idx] = {
          ...msg,
          deliveredTo: [...(msg.deliveredTo || []), ...deliveredTo],
          status: 'delivered',
        };
      }

      const chatIdx = state.chats.findIndex((c) => c._id === chatId);
      if (chatIdx !== -1 && state.chats[chatIdx].lastMessage?._id === messageId) {
        const last = state.chats[chatIdx].lastMessage!;
        state.chats[chatIdx] = {
          ...state.chats[chatIdx],
          lastMessage: {
            ...last,
            deliveredTo: [...(last.deliveredTo || []), ...deliveredTo],
            status: 'delivered',
          },
        };
      }
    },

    markMessagesAsSeen: (
      state,
      action: PayloadAction<{ chatId: string; messageIds: string[]; seenBy: string }>,
    ) => {
      const { chatId, messageIds, seenBy } = action.payload;
      if (!state.chatMessages[chatId]) return;

      state.chatMessages[chatId] = state.chatMessages[chatId].map((msg) => {
        if (!messageIds.includes(msg._id) || msg.sender._id === seenBy) return msg;
        const seenByArr = msg.seenBy || [];
        return {
          ...msg,
          seenBy: seenByArr.includes(seenBy) ? seenByArr : [...seenByArr, seenBy],
          status: 'seen',
        };
      });

      const chatIdx = state.chats.findIndex((c) => c._id === chatId);
      if (chatIdx !== -1 && state.chats[chatIdx].lastMessage) {
        const last = state.chats[chatIdx].lastMessage!;
        if (messageIds.includes(last._id) && last.sender._id !== seenBy) {
          const seenByArr = last.seenBy || [];
          state.chats[chatIdx] = {
            ...state.chats[chatIdx],
            lastMessage: {
              ...last,
              seenBy: seenByArr.includes(seenBy) ? seenByArr : [...seenByArr, seenBy],
              status: 'seen',
            },
          };
        }
      }

      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
    },

    hydrateChatState: (state, action: PayloadAction<Partial<InitialState>>) => {
      return { ...state, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    builder.addMatcher(ChatApiSlice.endpoints.getUserChats.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      state.chats = data;
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(data) });
    });

    builder.addMatcher(ChatApiSlice.endpoints.getChatMessages.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      const { chatId, messages } = data;
      state.chatMessages[chatId] = messages;
      indexDBStorage.set(DBStorageKeys.ChatMessages, {
        id: 'all_messages',
        data: snap(state.chatMessages),
      });
    });

    builder.addMatcher(ChatApiSlice.endpoints.getAvailableUsers.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      state.users = data;
      indexDBStorage.set(DBStorageKeys.Users, { id: 'all_users', data: snap(data) });
    });

    builder.addMatcher(ChatApiSlice.endpoints.createUserChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      const idx = state.chats.findIndex((c) => c._id === data._id);
      if (idx !== -1) {
        state.chats[idx] = data;
      } else {
        state.chats = [data, ...state.chats];
      }
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
    });

    builder.addMatcher(ChatApiSlice.endpoints.createGroupChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      const idx = state.chats.findIndex((c) => c._id === data._id);
      if (idx !== -1) {
        state.chats[idx] = data;
      } else {
        state.chats = [data, ...state.chats];
      }
      indexDBStorage.set(DBStorageKeys.Chats, { id: 'all_chats', data: snap(state.chats) });
    });
  },
});

export const chatReducer = ChatSlice.reducer;
export const {
  hydrateChatState,
  updateChatLastMessage,
  onMessageReceived,
  onChatLeave,
  newChat,
  setCurrentChat,
  setUnreadMessages,
  onChatDelete,
  onChatMessageDelete,
  updateGroupName,
  updateMessageReactions,
  markMessagesAsSeen,
  updateMessageDelivery,
  replaceOptimisticMessage,
  updatePollVote,
} = ChatSlice.actions;
