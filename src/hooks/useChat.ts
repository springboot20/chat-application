import { ChatListItemInterface, ChatMessageInterface } from '../types/chat';
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks';
import { RootState } from '../app/store.ts';
import { useGetUserChatsQuery } from '../features/chats/chat.slice';
import {
  newChat,
  onChatLeave,
  updateChatLastMessage,
  updateGroupName,
} from '../features/chats/chat.reducer';
import { toast } from 'react-toastify';
import { createSelector } from '@reduxjs/toolkit';
import { useCallback, useMemo } from 'react';
import { getMessageObjectMetaData } from '../utils/index.ts';

const selectChats = createSelector([(state: RootState) => state.chat], (chatState) => ({
  chats: chatState?.chats?.map((chat) => ({ ...chat })),
  currentChat: chatState.currentChat,
  chatMessages: chatState.chatMessages,
  unreadMessages: chatState.unreadMessages,
}));

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state: RootState) => state.auth);

  const { data, isLoading: isLoadingChats, refetch: refetchChats } = useGetUserChatsQuery();

  const chatsFromState = useAppSelector(selectChats);

  const chats = useMemo(() => {
    if (chatsFromState.chats?.length > 0) {
      return chatsFromState.chats;
    }

    return data?.data;
  }, [chatsFromState.chats, data?.data]);

  const chatsWithMeta = useMemo(() => {
    return chats?.map((chat: ChatListItemInterface) => {
      const meta = getMessageObjectMetaData(chat, currentUser!);
      return {
        ...chat,
        lastMessageText: meta.lastMessage, // explicitly computed
        title: meta.title,
        description: meta.description,
        lastMessageId: chat.lastMessage?._id || 'no-msg', // for memoization
      };
    });
  }, [chats, currentUser]);

  const _updateChatLastMessage = useCallback(
    (chatToUpdateId: string, message: ChatMessageInterface) => {
      dispatch(updateChatLastMessage({ chatToUpdateId, message }));
    },
    [dispatch]
  );

  const onNewChat = useCallback(
    (chat: ChatListItemInterface) => {
      dispatch(newChat({ chat }));
    },
    [dispatch]
  );

  const onGroupChatRename = useCallback(
    (data: ChatListItemInterface) => {
      dispatch(updateGroupName({ chat: data }));
      refetchChats();
    },
    [dispatch, refetchChats]
  );

  const _onChatLeave = useCallback(
    (chat: ChatListItemInterface) => {
      dispatch(onChatLeave({ chat }));

      toast('A chat you were participating in has been deleted', {
        type: 'info',
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
    chatsWithMeta,
  };
};
