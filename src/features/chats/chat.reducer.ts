import { ChatListItemInterface } from './../../types/chat';
import { ChatMessageInterface } from '../../types/chat';
import { LocalStorage, removeCircularReferences } from './../../utils/index';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatApiSlice } from './chat.slice';
import { User } from '../../types/auth';

interface InitialState {
  chats: ChatListItemInterface[];
  chatMessages: Record<string, ChatMessageInterface[]>; // key = chat._id
  unreadMessages: ChatMessageInterface[];
  currentChat: ChatListItemInterface | null;
  users: User[];
}

const initialState: InitialState = {
  chats: LocalStorage.get('chats') as ChatListItemInterface[],
  currentChat: (LocalStorage.get('current-chat') as ChatListItemInterface) || null,
  users: (LocalStorage.get('users') as User[]) || [],
  chatMessages: LocalStorage.get('chatmessages') || {}, // empty object per chat
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

      console.log(chat);

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

    onMessageReceived: (state, action: PayloadAction<{ data: ChatMessageInterface }>) => {
      const message = action.payload.data;
      const chatId = message.chat;

      if (!state.chatMessages[chatId]) state.chatMessages[chatId] = [];

      const existingIndex = state.chatMessages[chatId].findIndex((msg) => msg._id === message._id);

      if (existingIndex !== -1) {
        state.chatMessages[chatId][existingIndex] = {
          ...state.chatMessages[chatId][existingIndex],
          ...message,
        };
      } else {
        state.chatMessages[chatId].push(message);
      }

      // Remove duplicates
      const uniqueMessages = state.chatMessages[chatId].reduce((acc, current) => {
        if (!acc.some((msg) => msg._id === current._id)) acc.push(current);
        return acc;
      }, [] as ChatMessageInterface[]);

      state.chatMessages[chatId] = uniqueMessages;

      state.chatMessages[chatId].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },

    // Add this new action
    updateMessageReactions: (
      state,
      action: PayloadAction<{ messageId: string; reactions: any[]; chatId: string }>,
    ) => {
      const { messageId, reactions, chatId } = action.payload;

      console.log({ messageId, reactions, chatId });

      if (!state.chatMessages[chatId]) return;

      const messageIndex = state.chatMessages[chatId].findIndex((msg) => msg._id === messageId);
      if (messageIndex !== -1) {
        state.chatMessages[chatId][messageIndex] = {
          ...state.chatMessages[chatId][messageIndex],
          reactions: reactions.map((r) => ({ ...r })), // Deep copy reactions
        };
      }

      // Update lastMessage in chat array
      const chatIndex = state.chats.findIndex((chat) => chat.lastMessage?._id === messageId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage) {
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          lastMessage: {
            ...state.chats[chatIndex].lastMessage!,
            reactions: reactions.map((r) => ({ ...r })),
          },
        };
      }

      // Update current chat if needed
      if (state.currentChat?.lastMessage?._id === messageId) {
        state.currentChat = {
          ...state.currentChat,
          lastMessage: {
            ...state.currentChat.lastMessage!,
            reactions: reactions.map((r) => ({ ...r })),
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
        // Create completely new objects to ensure reference changes
        const updatedChat = {
          ...state.chats[chatIndex],
          lastMessage: { ...message }, // Create new message object reference
          updatedAt: message?.updatedAt || new Date().toISOString(),
        };

        // Create new array with updated chat
        state.chats = [
          ...state.chats.slice(0, chatIndex),
          updatedChat,
          ...state.chats.slice(chatIndex + 1),
        ];

        // Update current chat if needed
        if (state.currentChat && state.currentChat._id === chatToUpdateId) {
          state.currentChat = { ...updatedChat };
        }

        // Update localStorage
        LocalStorage.set('chats', state.chats);
        if (state.currentChat?._id === chatToUpdateId) {
          LocalStorage.set('current-chat', updatedChat);
        }
      }
    },

    updateGroupName: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;

      // Find the chat in the array
      const chatIndex = state.chats.findIndex((localChat) => localChat._id === chat._id);

      if (chatIndex !== -1) {
        // Only update the name to avoid changing other properties
        state.chats = state.chats.map((localChat, index) =>
          index === chatIndex ? { ...localChat, name: chat.name } : localChat,
        );

        if (state.currentChat?._id === chat._id) {
          state.currentChat = { ...state.currentChat, name: chat.name };
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
        // Instead of removing, just mark it as deleted
        state.chatMessages[chatId][messageIndex] = {
          ...state.chatMessages[chatId][messageIndex],
          isDeleted: true,
          content: '', // optional: clear the text
          attachments: [], // optional: remove attachments
        };
      }

      // Also update lastMessage in chat if needed
      const chatIndex = state.chats.findIndex((chat) => chat.lastMessage?._id === messageId);

      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = {
          ...state.chats[chatIndex].lastMessage!,
          isDeleted: true,
          content: '',
          attachments: [],
        };
      }

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },

    updateMessageDelivery: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string; deliveredTo: string[] }>,
    ) => {
      const { chatId, messageId, deliveredTo } = action.payload;
      console.log({ chatId, messageId });

      if (!state.chatMessages[chatId]) return;

      state.chatMessages[chatId] = state.chatMessages[chatId].map((msg) =>
        messageId === msg._id
          ? {
              ...msg,
              deliveredTo: [...(msg.deliveredTo || []), ...deliveredTo],
              status: 'delivered',
            }
          : msg,
      );

      // Update lastMessage if needed
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1) {
        const lastMessage = state.chats[chatIndex].lastMessage;
        if (lastMessage && messageId === lastMessage._id) {
          state.chats[chatIndex].lastMessage = {
            ...lastMessage,
            deliveredTo: [...(lastMessage.deliveredTo || []), ...deliveredTo],
            status: 'delivered',
          };
        }
      }
    },

    markMessagesAsSeen: (
      state,
      action: PayloadAction<{ chatId: string; messageIds: string[]; seenBy: string }>,
    ) => {
      const { chatId, messageIds, seenBy } = action.payload;
      if (!state.chatMessages[chatId]) return;

      // ✅ Only update messages that are in messageIds array
      state.chatMessages[chatId] = state.chatMessages[chatId].map((msg) => {
        if (!messageIds.includes(msg._id)) return msg; // Skip messages not in the list
        if (msg.sender._id === seenBy) return msg; // Don't mark own messages as seen

        if (!msg.seenBy) msg.seenBy = [];
        if (!msg.seenBy.includes(seenBy)) msg.seenBy.push(seenBy);

        return { ...msg, status: 'seen' };
      });

      // Update lastMessage if it's in the seen list
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage) {
        const lastMessage = state.chats[chatIndex].lastMessage!;

        if (messageIds.includes(lastMessage._id) && lastMessage.sender._id !== seenBy) {
          if (!lastMessage.seenBy) lastMessage.seenBy = [];
          if (!lastMessage.seenBy.includes(seenBy)) lastMessage.seenBy.push(seenBy);
          lastMessage.status = 'seen';
          state.chats[chatIndex].lastMessage = { ...lastMessage };
        }
      }
      console.log(removeCircularReferences(state.chatMessages));

      LocalStorage.set('chatmessages', removeCircularReferences(state.chatMessages));
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(ChatApiSlice.endpoints.getUserChats.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      state.chats = data;

      LocalStorage.set('chats', state.chats);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getChatMessages.matchFulfilled, (state, action) => {
      const { data } = action.payload; // make sure your API returns chatId

      const { chatId, messages } = data;
      state.chatMessages[chatId] = messages; // store messages only for that chat
      LocalStorage.set('chatmessages', state.chatMessages);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getAvailableUsers.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      state.users = data;

      LocalStorage.set('users', state.users);
    });

    builder.addMatcher(ChatApiSlice.endpoints.createUserChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      console.log(removeCircularReferences(data));
      // ✅ Check if chat already exists in state
      const existingChatIndex = state.chats.findIndex((chat) => chat._id === data._id);

      if (existingChatIndex !== -1) {
        // ✅ Chat already exists, update it instead of adding
        state.chats[existingChatIndex] = {
          ...state.chats[existingChatIndex],
          ...data,
        };
        console.log('📝 Updated existing chat:', data._id);
      } else {
        // ✅ New chat, add to the beginning
        state.chats = [data, ...state.chats];
        console.log('✅ Added new chat:', data._id);
      }

      LocalStorage.set('chats', removeCircularReferences(state.chats));
    });

    builder.addMatcher(ChatApiSlice.endpoints.createGroupChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      console.log(data);
      // ✅ Check if group chat already exists
      const existingChatIndex = state.chats.findIndex((chat) => chat._id === data._id);

      if (existingChatIndex !== -1) {
        // ✅ Update existing group chat
        state.chats[existingChatIndex] = {
          ...state.chats[existingChatIndex],
          ...data,
        };
        console.log('📝 Updated existing group chat:', data._id);
      } else {
        // ✅ New group chat, add to the beginning
        state.chats = [data, ...state.chats];
        console.log('✅ Added new group chat:', data._id);
      }

      LocalStorage.set('chats', removeCircularReferences(state.chats));
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
} = ChatSlice.actions;
