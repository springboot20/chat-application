import { ChatListItemInterface, ChatMessageInterface } from '../types/chat';
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks';
import { RootState } from '../app/store.ts';
import { useGetUserChatsQuery } from '../features/chats/chat.slice';
import {
  newChat,
  onChatLeave,
  updateChatLastMessage,
  updateGroupName,
  setUnreadMessages, // Added this to clear unreads via hook if needed
} from '../features/chats/chat.reducer';
import { toast } from 'react-toastify';
import { createSelector } from '@reduxjs/toolkit';
import { useCallback, useMemo } from 'react';
import { getMessageObjectMetaData } from '../utils/index.ts';

// Refined selector to ensure we don't cause unnecessary re-renders
const selectChatState = (state: RootState) => state.chat;

const selectChatsData = createSelector([selectChatState], (chatState) => ({
  chats: chatState.chats || [],
  currentChat: chatState.currentChat,
  chatMessages: chatState.chatMessages,
  unreadMessages: chatState.unreadMessages || [],
}));

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state: RootState) => state.auth);

  const { isLoading: isLoadingChats, refetch: refetchChats } = useGetUserChatsQuery();

  const {
    chats: chatsFromState,
    currentChat,
    chatMessages,
    unreadMessages,
  } = useAppSelector(selectChatsData);

  // Combine state and API data, prioritizing the Redux state (where socket updates happen)
  const chats = useMemo(() => {
    return chatsFromState.length > 0 ? chatsFromState : [];
  }, [chatsFromState]);

  // WhatsApp-style Meta Computing
  const chatsWithMeta = useMemo(() => {
    return chats.map((chat: ChatListItemInterface) => {
      const meta = getMessageObjectMetaData(chat, currentUser!);

      // Calculate unread count for this specific chat
      const chatUnreadCount = unreadMessages.filter(
        (msg: ChatMessageInterface) => msg.chat === chat._id,
      ).length;

      return {
        ...chat,
        lastMessageText: meta.lastMessage,
        title: meta.title,
        description: meta.description,
        unreadCount: chatUnreadCount, // Injected for easy UI access
        isOnline: false, // You can hook this up to a presence system later
      };
    });
  }, [chats, currentUser, unreadMessages]);

  const clearChatUnreadCount = useCallback(
    (chatId: string) => {
      dispatch(setUnreadMessages({ chatId }));
    },
    [dispatch],
  );

  const _updateChatLastMessage = useCallback(
    (chatToUpdateId: string, message: ChatMessageInterface) => {
      dispatch(updateChatLastMessage({ chatToUpdateId, message }));
    },
    [dispatch],
  );

  const onNewChat = useCallback(
    (chat: ChatListItemInterface) => {
      dispatch(newChat({ chat }));
    },
    [dispatch],
  );

  const onGroupChatRename = useCallback(
    (data: ChatListItemInterface) => {
      dispatch(updateGroupName({ chat: data }));
      refetchChats();
    },
    [dispatch, refetchChats],
  );

  const _onChatLeave = useCallback(
    (chat: ChatListItemInterface) => {
      dispatch(onChatLeave({ chat }));
      toast('A chat you were participating in has been deleted', {
        type: 'info',
      });
    },
    [dispatch],
  );

  return {
    isLoadingChats,
    chats,
    chatsWithMeta, // Use this in your sidebar for the best experience
    currentChat,
    chatMessages,
    unreadMessages,
    clearChatUnreadCount,
    onNewChat,
    _onChatLeave,
    _updateChatLastMessage,
    refetchChats,
    onGroupChatRename,
  };
};
