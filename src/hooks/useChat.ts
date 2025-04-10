import { ChatListItemInterface, ChatMessageInterface } from "../types/chat";
import { useAppDispatch } from "../redux/redux.hooks";
import { useGetUserChatsQuery } from "../features/chats/chat.slice";
import { newChat,onChatLeave ,updateChatLastMessage } from "../features/chats/chat.reducer";

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading: isLoadingChats, refetch } = useGetUserChatsQuery();
  const chats = data?.data;

  const _updateChatLastMessage = (chatToUpdateId: string, message: ChatMessageInterface) => {
    dispatch(updateChatLastMessage({ chatToUpdateId, message }));
  };

  const onNewChat = (chat: ChatListItemInterface) => {
    console.log(chat);

    dispatch(newChat({ chat }));
  };

  const onChatLeave = (chat: ChatListItemInterface) => {
    console.log(chat);

    dispatch(onChatLeave({ chat }));
  };

  return {
    isLoadingChats,
    chats,
    onNewChat,
    onChatLeave,
    _updateChatLastMessage,
    refetch,
  };
};
