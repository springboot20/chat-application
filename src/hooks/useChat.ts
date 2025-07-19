import { ChatListItemInterface, ChatMessageInterface } from "../types/chat";
import { useAppDispatch, useAppSelector } from "../redux/redux.hooks";
import { RootState } from "../app/store.ts";
import { useGetUserChatsQuery } from "../features/chats/chat.slice";
import {
  newChat,
  onChatLeave,
  updateChatLastMessage,
  updateGroupName,
} from "../features/chats/chat.reducer";
import { toast } from "react-toastify";
import { createSelector } from "@reduxjs/toolkit";
import { useCallback, useMemo } from "react";

const selectChats = createSelector([(state: RootState) => state.chat], (chatState) => ({
  chats: chatState.chats,
  currentChat: chatState.currentChat,
  chatMessages: chatState.chatMessages,
  unreadMessages: chatState.unreadMessages,
}));

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading: isLoadingChats, refetch: refetchChats } = useGetUserChatsQuery();

  const chatsFromState = useAppSelector(selectChats);

  const chats = useMemo(() => {
    if (chatsFromState.chats.length > 0) {
      return [...chatsFromState.chats];
    }

    return data?.data ? [...data.data] : [];
  }, [chatsFromState.chats, data?.data]);

  console.log(chats);

  const _updateChatLastMessage = useCallback(
    (chatToUpdateId: string, message: ChatMessageInterface) => {
      dispatch(updateChatLastMessage({ chatToUpdateId, message }));
    },
    [dispatch]
  );

  const onNewChat = useCallback(
    (chat: ChatListItemInterface) => {
      console.log(chat);

      dispatch(newChat({ chat }));
    },
    [dispatch]
  );

  const onGroupChatRename = useCallback(
    (data: ChatListItemInterface) => {
      console.log(data);

      dispatch(updateGroupName({ chat: data }));
      refetchChats();
    },
    [dispatch, refetchChats]
  );

  const _onChatLeave = useCallback(
    (chat: ChatListItemInterface) => {
      console.log(chat);

      dispatch(onChatLeave({ chat }));

      toast("A chat you were participating in has been deleted", {
        type: "info",
      });
    },
    [dispatch]
  );

  return {
    isLoadingChats,
    chats,
    onNewChat,
    _onChatLeave,
    _updateChatLastMessage,
    refetchChats,
    onGroupChatRename,
    currentChat: chatsFromState.currentChat,
    chatMessages: chatsFromState.chatMessages,
    unreadMessages: chatsFromState.unreadMessages,
  };
};
