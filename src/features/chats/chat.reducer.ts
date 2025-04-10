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
  currentChat: ChatListItemInterface;
  users: User[];
}

const initialState: InitialState = {
  chats: LocalStorage.get("chats") as ChatListItemInterface[],
  currentChat: LocalStorage.get("current-chat") as ChatListItemInterface,
  users: [] as User[],
  chatMessages: LocalStorage.get("chatmessages") as ChatMessageInterface[],
  unreadMessages: LocalStorage.get("chatmessages") as ChatMessageInterface[],
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

      state.chats = [chat, ...state.chats];
    },

    newMessage: (state, action) => {
      const { data } = action.payload;

      state.chatMessages = [...state.chatMessages, data];

      state.chats = state.chats.map((chat) => {
        if (chat?._id === data?.chat?._id) {
          return {
            ...chat,
            lastMessage: data,
          };
        }

        return chat;
      });
    },

    setCurrentChat: (state, action: PayloadAction<{ chat: ChatListItemInterface | null }>) => {
      const { chat } = action.payload;
      state.currentChat = chat!;

      LocalStorage.set("current-chat", chat);
    },

    setUnreadMessages: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;

      state.unreadMessages = state.chatMessages.filter((msg) => msg?.chatId !== chatId);
    },

    updateChatLastMessage: (state, action: PayloadAction<ChatMessageUpdateInterface>) => {
      const { chatToUpdateId, message } = action.payload;

      const chatIndex = state.chats.findIndex((chat) => chat?._id === chatToUpdateId);

      if (chatIndex !== -1) {
        // Correctly update the chat by preserving all existing properties
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          lastMessage: message,
          updatedAt: message?.updatedAt,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(ChatApiSlice.endpoints.getUserChats.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      state.chats = data;

      LocalStorage.set("chats", data);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getChatMessages.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      state.chatMessages = data;

      LocalStorage.set("chatmessages", data);
    });

    builder.addMatcher(ChatApiSlice.endpoints.sendMessage.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      state.chatMessages = [...state.chatMessages, data];

      LocalStorage.set("chatmessages", data);
    });

    builder.addMatcher(ChatApiSlice.endpoints.getAvailableUsers.matchFulfilled, (state, action) => {
      const { data } = action.payload;

      state.users = data;

      LocalStorage.set("chatmessages", data);
    });
  },
});

export const chatReducer = ChatSlice.reducer;
export const { updateChatLastMessage, newChat, newMessage, setCurrentChat, setUnreadMessages } =
  ChatSlice.actions;
