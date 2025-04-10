import { ChatListItemInterface, ChatMessageInterface } from "../types/chat";
import { useAppDispatch } from "../redux/redux.hooks";
import { useGetUserChatsQuery } from "../features/chats/chat.slice";
import { newChat, updateChatLastMessage } from "../features/chats/chat.reducer";

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading: isLoadingChats, refetch } = useGetUserChatsQuery();
  const chats = data?.data;

  const _updateChatLastMessage = (chatToUpdateId: string, message: ChatMessageInterface) => {
    dispatch(updateChatLastMessage({ chatToUpdateId, message }));
  };

  const onNewChat = (chat: ChatListItemInterface) => {
    dispatch(newChat({ chat }));
  };

  return {
    isLoadingChats,
    chats,
    onNewChat,
    _updateChatLastMessage,
    refetch,
  };
};
