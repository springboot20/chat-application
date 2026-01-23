// features/chats/chat.reducer.ts

import { ChatListItemInterface } from './../../types/chat';
import { ChatMessageInterface } from '../../types/chat';
import { LocalStorage, removeCircularReferences } from './../../utils/index';
import { createSlice, PayloadAction, current } from '@reduxjs/toolkit'; // ✅ Import current
import { ChatApiSlice } from './chat.slice';
import { User } from '../../types/auth';

interface InitialState {
  chats: ChatListItemInterface[];
  chatMessages: Record<string, ChatMessageInterface[]>;
  unreadMessages: ChatMessageInterface[];
  currentChat: ChatListItemInterface | null;
  users: User[];
}

const initialState: InitialState = {
  chats: LocalStorage.get('chats') as ChatListItemInterface[],
  currentChat: (LocalStorage.get('current-chat') as ChatListItemInterface) || null,
  users: (LocalStorage.get('users') as User[]) || [],
  chatMessages: LocalStorage.get('chatmessages') || {},
  unreadMessages: LocalStorage.get('unreadMessages') as ChatMessageInterface[],
};

interface ChatMessageUpdateInterface {
  chatToUpdateId: string;
  message: ChatMessageInterface;
}

const ChatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    newChat: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;
      state.chats = [chat, ...state.chats];
      LocalStorage.set('chats', removeCircularReferences(state.chats));
    },

    onChatLeave: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;

      if (chat?._id === state.currentChat?._id) {
        state.currentChat = null;
        LocalStorage.remove('current-chat');
      }

      state.chats = state.chats?.filter((ch) => ch?._id !== chat?._id);
      LocalStorage.set('chats', removeCircularReferences(state.chats));
    },

    // ✅ NEW: Specifically for replacing Temp IDs with Server IDs after upload
    replaceOptimisticMessage: (
      state,
      action: PayloadAction<{ chatId: string; tempId: string; realMessage: ChatMessageInterface }>,
    ) => {
      const { chatId, tempId, realMessage } = action.payload;

      if (!state.chatMessages[chatId]) return;

      const messageIndex = state.chatMessages[chatId].findIndex((msg) => msg._id === tempId);

      if (messageIndex !== -1) {
        // Replace the whole object to ensure 'status' and 'attachments' update
        state.chatMessages[chatId][messageIndex] = {
          ...realMessage,
          status: 'sent' as const, // Force status update
        };
      }

      // Also update the lastMessage in the sidebar if it matches the tempId
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage?._id === tempId) {
        state.chats[chatIndex].lastMessage = realMessage;
      }

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
      LocalStorage.set('chats', removeCircularReferences(state.chats));
    },

    // ✅ ENHANCED: onMessageReceived to handle Status Updates and Merging
    onMessageReceived: (state, action: PayloadAction<{ data: ChatMessageInterface }>) => {
      const message = action.payload.data;
      const chatId = message.chat;

      if (!state.chatMessages[chatId]) {
        state.chatMessages[chatId] = [];
      }

      const currentMessages = state.chatMessages[chatId];

      const existingIndex = currentMessages.findIndex((msg) => {
        if (msg._id === message._id) return true;

        const isTemp = msg._id.toString().startsWith('temp-') || msg.status === 'queued';
        const sameContent = msg.content === message.content;
        const sameSender = msg.sender._id === message.sender._id;

        return isTemp && sameSender && sameContent;
      });

      if (existingIndex !== -1) {
        state.chatMessages[chatId][existingIndex] = {
          ...currentMessages[existingIndex],
          ...message,
          // Ensure we don't accidentally revert 'sent' to 'sending'
          status: message.status || 'sent',
        };
      } else {
        state.chatMessages[chatId].push(message);
      }

      // Sort messages by creation time
      state.chatMessages[chatId].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },

    updateMessageReactions: (
      state,
      action: PayloadAction<{ messageId: string; reactions: any[]; chatId: string }>,
    ) => {
      const { messageId, reactions, chatId } = action.payload;

      if (!state.chatMessages[chatId]) return;

      // ✅ Update message in chatMessages
      const messageIndex = state.chatMessages[chatId].findIndex((msg) => msg._id === messageId);

      if (messageIndex !== -1) {
        state.chatMessages[chatId][messageIndex] = {
          ...state.chatMessages[chatId][messageIndex],
          reactions: reactions,
        };
      }

      // ✅ Update lastMessage in chats array - Use current() to avoid proxy issues
      const chatIndex = state.chats.findIndex((chat) => chat.lastMessage?._id === messageId);

      if (chatIndex !== -1) {
        const currentChat = current(state.chats[chatIndex]); // ✅ Get plain copy

        if (currentChat.lastMessage) {
          state.chats[chatIndex] = {
            ...currentChat,
            lastMessage: {
              ...currentChat.lastMessage,
              reactions: reactions,
            },
          };
        }
      }

      // ✅ Update current chat if needed - Use current() here too
      if (state.currentChat?.lastMessage?._id === messageId) {
        const currentChatCopy = current(state.currentChat); // ✅ Get plain copy

        state.currentChat = {
          ...currentChatCopy,
          lastMessage: {
            ...currentChatCopy.lastMessage!,
            reactions: reactions,
          },
        };
      }

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },

    setCurrentChat: (state, action) => {
      state.currentChat = action.payload.chat;
      LocalStorage.set('current-chat', action.payload.chat);
    },

    setUnreadMessages: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;
      state.unreadMessages = state.unreadMessages?.filter((msg) => msg?.chat !== chatId);
    },

    updateChatLastMessage: (state, action: PayloadAction<ChatMessageUpdateInterface>) => {
      const { chatToUpdateId, message } = action.payload;
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatToUpdateId);

      if (chatIndex !== -1) {
        const updatedChat = {
          ...state.chats[chatIndex],
          lastMessage: message,
          updatedAt: message?.updatedAt || new Date().toISOString(),
        };

        state.chats[chatIndex] = updatedChat;

        if (state.currentChat && state.currentChat._id === chatToUpdateId) {
          state.currentChat = updatedChat;
          LocalStorage.set('current-chat', updatedChat);
        }

        LocalStorage.set('chats', removeCircularReferences(state.chats));
      }
    },

    updateGroupName: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;
      const chatIndex = state.chats.findIndex((localChat) => localChat._id === chat._id);

      if (chatIndex !== -1) {
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          name: chat.name,
        };

        if (state.currentChat?._id === chat._id) {
          state.currentChat = {
            ...state.currentChat,
            name: chat.name,
          };
          LocalStorage.set('current-chat', state.currentChat);
        }
      }

      LocalStorage.set('chats', removeCircularReferences(state.chats));
    },

    onChatDelete: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;
      state.chats = state.chats.filter((chat) => chat._id !== chatId);
      state.unreadMessages = state.unreadMessages.filter((msg) => msg.chat !== chatId);

      if (state.currentChat?._id === chatId) {
        state.currentChat = null;
        LocalStorage.remove('current-chat');
      }

      LocalStorage.set('chats', removeCircularReferences(state.chats));
      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
      LocalStorage.set('unreadMessages', removeCircularReferences(state.unreadMessages));
    },

    onChatMessageDelete: (
      state,
      action: PayloadAction<{ messageId: string; message: ChatMessageInterface }>,
    ) => {
      const { messageId, message } = action.payload;
      const chatId = message.chat;

      if (!chatId || !state.chatMessages[chatId]) return;

      const messageIndex = state.chatMessages[chatId].findIndex((msg) => msg._id === messageId);

      if (messageIndex !== -1) {
        state.chatMessages[chatId][messageIndex] = {
          ...state.chatMessages[chatId][messageIndex],
          isDeleted: true,
          content: '',
          attachments: [],
        };
      }

      const chatIndex = state.chats.findIndex((chat) => chat.lastMessage?._id === messageId);

      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage) {
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          lastMessage: {
            ...state.chats[chatIndex].lastMessage!,
            isDeleted: true,
            content: '',
            attachments: [],
          },
        };
      }

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },

    // ✅ FIXED: updateMessageDelivery
    updateMessageDelivery: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string; deliveredTo: string[] }>,
    ) => {
      const { chatId, messageId, deliveredTo } = action.payload;

      if (!state.chatMessages[chatId]) return;

      // ✅ Use current() to avoid proxy issues
      const currentMessages = current(state.chatMessages[chatId]);
      const messageIndex = currentMessages.findIndex((msg) => msg._id === messageId);

      if (messageIndex !== -1) {
        const existingDeliveredTo = currentMessages[messageIndex].deliveredTo || [];

        state.chatMessages[chatId][messageIndex] = {
          ...currentMessages[messageIndex],
          deliveredTo: [...existingDeliveredTo, ...deliveredTo],
          status: 'delivered' as const,
        };
      }

      // Update lastMessage if needed
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage?._id === messageId) {
        const lastMessage = state.chats[chatIndex].lastMessage!;
        const existingDeliveredTo = lastMessage.deliveredTo || [];

        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          lastMessage: {
            ...lastMessage,
            deliveredTo: [...existingDeliveredTo, ...deliveredTo],
            status: 'delivered' as const,
          },
        };
      }
    },

    // ✅ FIXED: markMessagesAsSeen
    markMessagesAsSeen: (
      state,
      action: PayloadAction<{ chatId: string; messageIds: string[]; seenBy: string }>,
    ) => {
      const { chatId, messageIds, seenBy } = action.payload;

      if (!state.chatMessages[chatId]) return;

      // ✅ Use current() to get plain copy
      const currentMessages = current(state.chatMessages[chatId]);

      state.chatMessages[chatId] = currentMessages.map((msg) => {
        if (!messageIds.includes(msg._id)) return msg;
        if (msg.sender._id === seenBy) return msg;

        const seenByArray = msg.seenBy || [];

        return {
          ...msg,
          seenBy: seenByArray.includes(seenBy) ? seenByArray : [...seenByArray, seenBy],
          status: 'seen' as const,
        };
      });

      // Update lastMessage if it's in the seen list
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage) {
        const lastMessage = state.chats[chatIndex].lastMessage!;

        if (messageIds.includes(lastMessage._id) && lastMessage.sender._id !== seenBy) {
          const seenByArray = lastMessage.seenBy || [];

          state.chats[chatIndex] = {
            ...state.chats[chatIndex],
            lastMessage: {
              ...lastMessage,
              seenBy: seenByArray.includes(seenBy) ? seenByArray : [...seenByArray, seenBy],
              status: 'seen' as const,
            },
          };
        }
      }

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },
  },

  extraReducers: (builder) => {
    builder.addMatcher(ChatApiSlice.endpoints.getUserChats.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      state.chats = data;
      LocalStorage.set('chats', data);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getChatMessages.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      const { chatId, messages } = data;
      state.chatMessages[chatId] = messages;

      LocalStorage.set('chatmessages', state.chatMessages);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getAvailableUsers.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      state.users = data;
      LocalStorage.set('users', data);
    });

    builder.addMatcher(ChatApiSlice.endpoints.createUserChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      const existingChatIndex = state.chats.findIndex((chat) => chat._id === data._id);

      if (existingChatIndex !== -1) {
        state.chats[existingChatIndex] = data;
      } else {
        state.chats = [data, ...state.chats];
      }

      LocalStorage.set('chats', state.chats);
    });

    builder.addMatcher(ChatApiSlice.endpoints.createGroupChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      const existingChatIndex = state.chats.findIndex((chat) => chat._id === data._id);

      if (existingChatIndex !== -1) {
        state.chats[existingChatIndex] = data;
      } else {
        state.chats = [data, ...state.chats];
      }

      LocalStorage.set('chats', state.chats);
    });
  },
});

export const chatReducer = ChatSlice.reducer;
export const {
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
} = ChatSlice.actions;
