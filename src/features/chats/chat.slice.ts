import { ApiService } from "../../app/services/api.service";
import { ChatListItemInterface, ChatMessageInterface } from "../../types/chat";

interface Response {
  data: any;
  statusCode: number;
  message: string;
  success: boolean;
}

interface SendMessageInterface {
  chatId: string;
  data: { content: string; attachments: File[] | undefined };
}

interface GroupChatInterface {
  name: string;
  participants: string[];
}

export const ChatApiSlice = ApiService.injectEndpoints({
  endpoints: (builder) => ({
    getUserChats: builder.query<Response, void>({
      query: () => ({
        url: "/chat-app/chats/",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              // eslint-disable-next-line no-unsafe-optional-chaining
              ...result?.data.map((chat: ChatListItemInterface) => ({
                type: "Chat" as const,
                id: chat._id,
              })),
              { type: "Chat", id: "CHAT" },
            ]
          : [{ type: "Chat", id: "CHAT" }],
    }),

    createUserChat: builder.mutation<Response, string>({
      query: (receiverId) => ({
        url: `/chat-app/chats/create-chat/${receiverId}`,
        method: "POST",
        body: {},
      }),
    }),

    getAvailableUsers: builder.query<Response, void>({
      query: () => ({
        url: "/chat-app/chats/available-users",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              // eslint-disable-next-line no-unsafe-optional-chaining
              ...result?.data.map((chat: ChatListItemInterface) => ({
                type: "User" as const,
                id: chat._id,
              })),
              { type: "User", id: "USER" },
            ]
          : [{ type: "User", id: "USER" }],
    }),

    createGroupChat: builder.mutation<Response, GroupChatInterface>({
      query: ({ name, participants }) => {
        return {
          url: "/chat-app/chats/group-chat",
          body: { name, participants },
          method: "POST",
        };
      },
    }),

    getGroupChat: builder.query<Response, string>({
      query: (chatId) => `/chat-app/chats/group-chat/${chatId}`,
      providesTags: (_, __, chatId) => [{ type: "Chat", chatId }],
    }),

    updateGroupChatDetails: builder.mutation<Response, { name: string; chatId: string }>({
      query: ({ chatId, name }) => ({
        url: `/chat-app/chats/group-chat/${chatId}`,
        method: "PATCH",
        body: { name },
      }),
    }),

    deleteGroupChatDetails: builder.mutation<Response, string>({
      query: (chatId) => ({
        url: `/chat-app/chats/group-chat/${chatId}`,
        method: "DELETE",
      }),
    }),

    addParticipantToGroupChat: builder.mutation<
      Response,
      { chatId: string; participantId: string }
    >({
      query: ({ chatId, participantId }) => ({
        url: `/chat-app/chats/group-chat/${chatId}/${participantId}`,
        method: "POST",
      }),
    }),

    removeParticipantFromGroupChat: builder.mutation<
      Response,
      { chatId: string; participantId: string }
    >({
      query: ({ chatId, participantId }) => ({
        url: `/chat-app/chats/group-chat/${chatId}/${participantId}`,
        method: "DELETE",
      }),
    }),

    leaveChatGroup: builder.mutation<Response, string>({
      query: (chatId) => ({
        url: `/chat-app/chats/leave/group-chat/${chatId}`,
        method: "DELETE",
      }),
    }),

    deleteOneOneChatMessage: builder.mutation<Response, string>({
      query: (chatId) => ({
        url: `/chat-app/chats/delete-one-on-one/${chatId}`,
        method: "DELETE",
      }),
    }),

    getChatMessages: builder.query<Response, string>({
      query: (chatId) => ({
        url: `/chat-app/messages/${chatId}`,
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              // eslint-disable-next-line no-unsafe-optional-chaining
              ...result?.data.map((message: ChatMessageInterface) => ({
                type: "Message" as const,
                id: message._id,
              })),
              { type: "Message", id: "MESSAGE" },
            ]
          : [{ type: "Message", id: "MESSAGE" }],
    }),

    sendMessage: builder.mutation<Response, SendMessageInterface>({
      query: ({ chatId, data }) => {
        const formData = new FormData();
        if (data.content) {
          formData.append("content", data.content);
        }

        data.attachments?.map((file) => {
          formData.append("attachments", file);
        });

        return {
          url: `/chat-app/messages/${chatId}`,
          body: formData,
          method: "POST",
        };
      },
    }),
  }),
});

export const {
  useGetUserChatsQuery,
  useCreateUserChatMutation,
  useGetAvailableUsersQuery,
  useCreateGroupChatMutation,
  useGetGroupChatQuery,
  useUpdateGroupChatDetailsMutation,
  useDeleteGroupChatDetailsMutation,
  useAddParticipantToGroupChatMutation,
  useRemoveParticipantFromGroupChatMutation,
  useLeaveChatGroupMutation,
  useDeleteOneOneChatMessageMutation,
  useGetChatMessagesQuery,
  useSendMessageMutation,
} = ChatApiSlice;
