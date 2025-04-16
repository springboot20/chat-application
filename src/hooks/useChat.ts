import { ChatListItemInterface, ChatMessageInterface } from "../types/chat";
import { useAppDispatch, useAppSelector } from "../redux/redux.hooks";
import { RootState } from '../app/store.ts';
import { useGetUserChatsQuery } from "../features/chats/chat.slice";
import { newChat, onChatLeave, updateChatLastMessage } from "../features/chats/chat.reducer";
import { toast } from "react-toastify";

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading: isLoadingChats, refetch } = useGetUserChatsQuery();

  const chatsFromState = useAppSelector((state:RootState) => state.chat.chats);
  const chats = chatsFromState.length > 0 ? chatsFromState : data?.data;

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
