import { ChatListItemInterface, ChatMessageInterface } from "../types/chat";
import { useAppDispatch } from "../redux/redux.hooks";
import { useGetUserChatsQuery } from "../features/chats/chat.slice";
import { newChat, onChatLeave, updateChatLastMessage } from "../features/chats/chat.reducer";
import { toast } from "react-toastify";

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

  const _onChatLeave = (chat: ChatListItemInterface) => {
    console.log(chat);

    dispatch(onChatLeave({ chat }));

    toast("A chat you were participating in has been deleted", {
      type: "info"
    });
  };

  return {
    isLoadingChats,
    chats,
    onNewChat,
    _onChatLeave,
    _updateChatLastMessage,
    refetch,
  };
};
