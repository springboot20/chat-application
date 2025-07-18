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

const selectChatState = (state: RootState) => state.chat;
const selectChats = createSelector(
  [
    selectChatState,
    (_: RootState, queryData: { data: ChatListItemInterface[] | undefined }) => queryData.data,
  ],
  (chatState, queryData) => {
    // Return a new array only if necessary to ensure stability
    return chatState.chats?.length > 0 ? [...chatState.chats] : queryData || [];
  }
);

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading: isLoadingChats, refetch: refetchChats } = useGetUserChatsQuery();

  const chatsFromState = useAppSelector((state) => selectChats(state, { data: data?.data }));
  const chats = useMemo(() => {
    return chatsFromState?.length > 0 ? [...chatsFromState] : data?.data || [];
  }, [chatsFromState, data?.data]);

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
    },
    [dispatch]
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
  };
};
