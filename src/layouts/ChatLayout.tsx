import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useSocketContext } from '../hooks/useSocket';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks';
import { RootState } from '../app/store';
import { Navigation } from '../components/navigation/navigation';
import { MobileBottomNav } from '../components/navigation/MobileNavigation';
import { CreateOrViewStatusWindowPanel } from '../components/status/CreateOrViewStatusWindowPanel';
import {
  JOIN_CHAT_EVENT,
  LEAVE_CHAT_EVENT,
  MESSAGE_RECEIVED_EVENT,
  NEW_CHAT_EVENT,
  CHAT_MESSAGE_DELETE_EVENT,
  REACTION_RECEIVED_EVENT,
  NEW_GROUP_NAME,
  UPDATE_CHAT_LAST_MESSAGE_EVENT,
  MESSAGE_DELIVERED_EVENT,
  MESSAGE_SEEN_EVENT,
  USER_ONLINE_EVENT,
  USER_OFFLINE_EVENT,
  POLL_VOTE_UPDATED,
  STOP_TYPING_EVENT,
  TYPING_EVENT,
} from '../enums/index';
import {
  markMessagesAsSeen,
  setCurrentChat,
  updateMessageDelivery,
  updatePollVote,
} from '../features/chats/chat.reducer';
import { useLogoutMutation } from '../features/auth/auth.slice';
import { ApiService } from '../app/services/api.service';
import { toast } from 'react-toastify';
import { classNames } from '../utils';
import { ChatListItemInterface } from '../types/chat';
import { useTyping } from '../hooks/useTyping';
import { useMessage } from '../hooks/useMessage';
import { useNetwork } from '../hooks/useNetwork';

export const ChatLayout: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const [logout] = useLogoutMutation();
  const { socket } = useSocketContext();
  const { chats, currentChat, onNewChat, _onChatLeave, onGroupChatRename } = useChat();
  const messageHook = useMessage();
  const { isOnline: hasInternet } = useNetwork();

  const [activeTab, setActiveTab] = useState<'chat_messages' | 'status' | 'settings'>(
    'chat_messages',
  );
  const { handleUserOnline, handleUserOffline } = useOnlineUsers();

  const { handleStartTyping, handleStopTyping } = useTyping({
    currentChat: currentChat!,
    user,
  });

  const { onReactionUpdate, onUpdateChatLastMessage, onChatMessageDeleted, onMessageReceive } =
    useMemo(() => messageHook, [messageHook]);

  useEffect(() => {
    if (!socket || !currentChat?._id) return;

    socket.emit(JOIN_CHAT_EVENT, { chatId: currentChat._id });

    return () => {
      socket.emit(LEAVE_CHAT_EVENT, { chatId: currentChat._id });
    };
  }, [socket, currentChat?._id]);

  // Update active tab based on path if needed
  useEffect(() => {
    if (location.pathname.startsWith('/status')) {
      setActiveTab('status');
    } else if (location.pathname.startsWith('/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('chat_messages');
    }
  }, [location.pathname]);

  // Sync URL chatId with Redux currentChat
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find((c: any) => c._id === chatId);

      if (chat && currentChat?._id !== chatId) {
        dispatch(setCurrentChat({ chat }));
      }
    } else if (!chatId && currentChat) {
      // Optional: Clear current chat if we are at /chat
      dispatch(setCurrentChat({ chat: undefined as unknown as ChatListItemInterface }));
    }
  }, [chatId, chats, currentChat, dispatch]);

  const currentChatIdRef = useRef<string | undefined>(currentChat?._id);
  useEffect(() => {
    currentChatIdRef.current = currentChat?._id;
  }, [currentChat?._id]);

  const handlePollVoteUpdated = useCallback(
    (payload: { messageId: string; options: any[] }) => {
      const chatId = currentChatIdRef.current;
      if (!chatId) return;
      dispatch(updatePollVote({ messageId: payload.messageId, chatId, options: payload.options }));
    },
    [dispatch],
  );

  // Global socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on(USER_ONLINE_EVENT, handleUserOnline);
    socket.on(USER_OFFLINE_EVENT, handleUserOffline);
    socket?.on(UPDATE_CHAT_LAST_MESSAGE_EVENT, onUpdateChatLastMessage);
    socket?.on(MESSAGE_RECEIVED_EVENT, onMessageReceive);
    socket.on(POLL_VOTE_UPDATED, handlePollVoteUpdated);
    socket?.on(STOP_TYPING_EVENT, handleStopTyping);
    socket?.on(TYPING_EVENT, handleStartTyping);
    socket?.on(REACTION_RECEIVED_EVENT, onReactionUpdate);
    socket?.on(CHAT_MESSAGE_DELETE_EVENT, onChatMessageDeleted);
    socket?.on(NEW_CHAT_EVENT, onNewChat);
    socket?.on(LEAVE_CHAT_EVENT, _onChatLeave);
    socket?.on(NEW_GROUP_NAME, onGroupChatRename);
    socket?.on(MESSAGE_DELIVERED_EVENT, (payload) => {
      dispatch(updateMessageDelivery(payload));
    });
    socket?.on(MESSAGE_SEEN_EVENT, (payload) => {
      dispatch(markMessagesAsSeen(payload));
    });

    return () => {
      socket.off(USER_ONLINE_EVENT, handleUserOnline);
      socket.off(USER_OFFLINE_EVENT, handleUserOffline);
      socket?.off(TYPING_EVENT, handleStartTyping);
      socket?.off(STOP_TYPING_EVENT, handleStopTyping);
      socket?.off(MESSAGE_RECEIVED_EVENT, onMessageReceive);
      socket.off(POLL_VOTE_UPDATED, handlePollVoteUpdated);
      socket?.off(REACTION_RECEIVED_EVENT, onReactionUpdate);
      socket?.off(NEW_CHAT_EVENT, onNewChat);
      socket?.off(CHAT_MESSAGE_DELETE_EVENT, onChatMessageDeleted);
      socket?.off(LEAVE_CHAT_EVENT, _onChatLeave);
      socket?.off(NEW_GROUP_NAME, onGroupChatRename);
      socket?.off(UPDATE_CHAT_LAST_MESSAGE_EVENT, onUpdateChatLastMessage);
      socket?.off(MESSAGE_DELIVERED_EVENT, (payload) => {
        dispatch(updateMessageDelivery(payload));
      });
      socket?.off(MESSAGE_SEEN_EVENT, (payload) => {
        dispatch(markMessagesAsSeen(payload));
      });
    };
  }, [
    dispatch,
    socket,
    onGroupChatRename,
    onMessageReceive,
    onNewChat,
    _onChatLeave,
    onChatMessageDeleted,
    onReactionUpdate,
    handleStartTyping,
    handleStopTyping,
    onUpdateChatLastMessage,
    handleUserOnline,
    handleUserOffline,
    handlePollVoteUpdated,
  ]);

  const handleLogout = async () => {
    try {
      dispatch(ApiService.util.resetApiState());
      await logout().unwrap();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Local session cleared.');
    } finally {
      navigate('/login');
    }
  };

  useEffect(() => {
    if (!hasInternet) {
      toast.warning('You are offline. Messages will be queued.', {
        toastId: 'offline-warning',
      });
    } else {
      toast.dismiss('offline-warning');
    }
  }, [hasInternet]);

  return (
    <Disclosure as={Fragment}>
      {({ open, close }) => (
        <div className={classNames('w-full flex items-stretch h-screen flex-shrink-0')}>
          <Navigation
            open={open}
            close={close}
            activeTab={activeTab}
            currentChat={currentChat!}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />

          <main className={classNames('flex-grow transition-all')}>
            <div
              className={classNames(
                'relative flex flex-col justify-between h-full bg-white dark:bg-black',
              )}>
              {activeTab === 'status' ? (
                <div className='h-full overflow-hidden'>
                  <CreateOrViewStatusWindowPanel />
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          </main>

          {!currentChat && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
        </div>
      )}
    </Disclosure>
  );
};
