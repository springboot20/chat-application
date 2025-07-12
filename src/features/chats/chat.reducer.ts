import { ChatListItemInterface } from "./../../types/chat";
import { ChatMessageInterface } from "../../types/chat";
import { LocalStorage } from "./../../utils/index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatApiSlice } from "./chat.slice";
import { User } from "../../types/auth";

interface InitialState {
  chats: ChatListItemInterface[];
  chatMessages: ChatMessageInterface[];
  unreadMessages: ChatMessageInterface[];
  currentChat: ChatListItemInterface | null;
  users: User[];
}

const initialState: InitialState = {
  chats: LocalStorage.get("chats") as ChatListItemInterface[],
  currentChat: (LocalStorage.get("current-chat") as ChatListItemInterface) || null,
  users: (LocalStorage.get("users") as User[]) || [],
  chatMessages: LocalStorage.get("chatmessages") as ChatMessageInterface[],
  unreadMessages: LocalStorage.get("unreadMessages") as ChatMessageInterface[],
};

interface ChatMessageUpdateInterface {
  chatToUpdateId: string;
  message: ChatMessageInterface;
}

const ChatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    newChat: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;

      console.log(chat);

      state.chats = [chat, ...state.chats];
      LocalStorage.set("chats", state.chats);
    },

    onChatLeave: (state, action: PayloadAction<{ chat: ChatListItemInterface }>) => {
      const { chat } = action.payload;

      if (chat?._id === state.currentChat?._id) {
        state.currentChat = null;

        LocalStorage.remove("current-chat");
      }

      state.chats = state.chats?.filter((ch) => ch?._id !== chat?._id);

      LocalStorage.set("chats", state.chats);
    },

    onMessageReceived: (state, action) => {
      const { data } = action.payload;

      const existingMessageIndex = state.chatMessages.findIndex((msg) => msg._id === data._id);

      if (existingMessageIndex !== -1) {
        // Update only the reactions for existing messages
        state.chatMessages[existingMessageIndex].reactions = data.reactions;
      } else if (data.chat === state.currentChat?._id) {
        // Add new message to chatMessages if it belongs to the current chat
        state.chatMessages.push(data);
      }
    },

    setCurrentChat: (state, action: PayloadAction<{ chat: ChatListItemInterface | null }>) => {
      const { chat } = action.payload;

      state.currentChat = chat;
      state.chatMessages = [];

      LocalStorage.set("current-chat", chat);
      LocalStorage.set("chatmessages", state.chatMessages);
    },

    setUnreadMessages: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;

      state.unreadMessages = state.chatMessages?.filter((msg) => msg?.chat !== chatId);

      LocalStorage.set("unreadMessages", state.unreadMessages);
    },

    updateChatLastMessage: (state, action: PayloadAction<ChatMessageUpdateInterface>) => {
      const { chatToUpdateId, message } = action.payload;

      // Find the chat in the array
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatToUpdateId);

      if (chatIndex !== -1) {
        // Create a new chat object with updated properties
        const updatedChat = {
          ...state.chats[chatIndex],
          lastMessage: message,
          updatedAt: message?.updatedAt || new Date().toISOString(),
        };

        // Update the chat in the state
        state.chats[chatIndex] = updatedChat;

        // If this is the current chat, update that too
        if (state.currentChat && state.currentChat._id === chatToUpdateId) {
          state.currentChat = updatedChat;
        }

        // Update localStorage
        LocalStorage.set("chats", state.chats);
        if (state.currentChat?._id === chatToUpdateId) {
          LocalStorage.set("current-chat", updatedChat);
        }
      }
    },

    onChatDelete: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;

      state.chats = state.chats.filter((chat) => chat?._id !== chatId);
      state.chatMessages = [];

      state.unreadMessages = state.unreadMessages.filter((msg) => msg?.chat !== chatId);

      if (state.currentChat?._id === chatId) {
        state.currentChat = null;
        LocalStorage.remove("current-chat");
      }

      LocalStorage.set("chats", state.chats);
      LocalStorage.set("chatmessages", state.chatMessages);
      LocalStorage.set("unreadMessages", state.unreadMessages);
    },

    onChatMessageDelete: (
      state,
      action: PayloadAction<{
        messageId: string;
        message: ChatMessageInterface;
      }>
    ) => {
      const { messageId, message } = action.payload;

      const messageIndex = state.chatMessages.findIndex((message) => message._id === messageId);

      if (messageIndex !== -1) {
        const updatedMessage = {
          ...state.chatMessages[messageIndex],
          isDeleted: message.isDeleted || true,
          updatedAt: message?.updatedAt || new Date().toISOString(),
        };

        state.chatMessages[messageIndex] = updatedMessage;
      }
      LocalStorage.set("chatmessages", state.chatMessages);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(ChatApiSlice.endpoints.getUserChats.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      state.chats = data;

      LocalStorage.set("chats", state.chats);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getChatMessages.matchFulfilled, (state, action) => {
      const { data } = action.payload;
      console.log(data);
      state.chatMessages = data;

      LocalStorage.set("chatmessages", state.chatMessages);
    });

    builder.addMatcher(ChatApiSlice.endpoints.sendMessage.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      // Add the new message to chatMessages
      state.chatMessages = [...state.chatMessages, data];

      LocalStorage.set("chatmessages", state.chatMessages);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getAvailableUsers.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      state.users = data;

      LocalStorage.set("users", state.users);
    });

    builder.addMatcher(ChatApiSlice.endpoints.createUserChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      console.log(data);

      state.chats = [...state.chats, data];

      LocalStorage.set("chats", state.chats);
    });

    builder.addMatcher(ChatApiSlice.endpoints.createGroupChat.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      console.log(data);

      state.chats = [...state.chats, data];

      LocalStorage.set("chats", state.chats);
    });

    builder.addMatcher(
      ChatApiSlice.endpoints.updateGroupChatDetails.matchFulfilled,
      (state, action) => {
        const { data } = action.payload;

        console.log(data);

        state.chats = [...state.chats, data];

        LocalStorage.set("chats", state.chats);
      }
    );
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
} = ChatSlice.actions;
