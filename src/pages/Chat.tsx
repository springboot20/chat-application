import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../utils/index.ts';
import { Navigation } from '../components/navigation/navigation.tsx';
import { useNavigate } from 'react-router-dom';
import {
  JOIN_CHAT_EVENT,
  MESSAGE_RECEIVED_EVENT,
  NEW_CHAT_EVENT,
  LEAVE_CHAT_EVENT,
  CHAT_MESSAGE_DELETE_EVENT,
  REACTION_RECEIVED_EVENT,
  NEW_GROUP_NAME,
  TYPING_EVENT,
  STOP_TYPING_EVENT,
  UPDATE_CHAT_LAST_MESSAGE_EVENT,
  MESSAGE_DELIVERED_EVENT,
  MESSAGE_SEEN_EVENT,
  USER_ONLINE_EVENT,
  USER_OFFLINE_EVENT,
} from '../enums/index.ts';
import { useChat } from '../hooks/useChat.ts';
import { useTyping } from '../hooks/useTyping.ts';
import { useNetwork } from '../hooks/useNetwork.ts';
import { useMessage } from '../hooks/useMessage.ts';
import Typing from '../components/Typing.tsx';
import { MessageItem } from '../components/chat/MessageItem.tsx';
import { useLogoutMutation } from '../features/auth/auth.slice.ts';
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks.ts';
import { RootState } from '../app/store.ts';
import { toast } from 'react-toastify';
import {
  markMessagesAsSeen,
  setCurrentChat,
  updateMessageDelivery,
} from '../features/chats/chat.reducer.ts';
import { useGetChatMessagesQuery } from '../features/chats/chat.slice.ts';
import { useTheme } from '../context/ThemeContext';
import { User } from '../types/auth.ts';
import MessageInput from '../components/inout/MessageInput.tsx';
import { useSocketContext } from '../hooks/useSocket.ts';
import { useOnlineUsers } from '../hooks/useOnlineUsers.ts';
import { useMarkMessagesAsSeen } from '../hooks/useMarkMessagesAsSeen.ts';
import { MobileBottomNav } from '../components/navigation/MobileNavigation.tsx';
import { CreateOrViewStatusWindowPanel } from '../components/status/CreateOrViewStatusWindowPanel.tsx';
import { ApiService } from '../app/services/api.service.ts';
import { ChatMessageInterface } from '../types/chat.ts';
import { GroupChatInfo } from '../components/modal/GroupChatInfo.tsx';

export const Chat = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const { theme } = useTheme();
  const { socket } = useSocketContext();
  const {
    onNewChat,
    _onChatLeave,
    onGroupChatRename,
    currentChat,
    chatMessages: reduxStateMessages,
    refetchChats,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'chat_messages' | 'status' | 'settings'>(
    'chat_messages',
  );

  const { isOnline: hasInternet } = useNetwork();
  const { isUserOnline, handleUserOnline, handleUserOffline, checkUsersOnlineStatus } =
    useOnlineUsers();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [openGroupInfo, setOpenGroupInfo] = useState(false);
  const [__, setOpenOptions] = useState<boolean>(false);

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: _,
    isLoading: loadingMessages,
  } = useGetChatMessagesQuery(currentChat?._id ?? '', {
    skip: !currentChat?._id,
  });

  const messageHook = useMessage();

  const {
    message,
    setOpenEmoji,
    onReactionUpdate,
    onUpdateChatLastMessage,
    onChatMessageDeleted,
    getAllMessages,
    onMessageReceive,
    bottomRef,
    messageInputRef,
    handleSetCloseReply,
    showReply,
    handleReplyToChatMessage,
    scrollToBottom,
    showScrollButton,
    sendChatMessage,
    // unreadMessages,
  } = useMemo(() => messageHook, [messageHook]);

  const {
    emitStartTyping,
    emitStopTyping,
    typingTimeoutRef,
    resetTypingState,

    isTyping,
    handleStartTyping,
    handleStopTyping,
    getTypingText,
  } = useTyping({
    currentChat: currentChat!,
    user,
  });

  const [isOwnedMessage, setIsOwnedMessage] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | undefined>(undefined);

  const handleSetHighlightedMessage = (messageId: string | undefined) => {
    setHighlightedMessageId(messageId);
  };

  // Get the other participant in 1-on-1 chat
  const otherParticipantId = useMemo(() => {
    if (!currentChat || currentChat.isGroupChat) return undefined;

    const otherParticipant = currentChat.participants?.find((p: User) => p._id !== user?._id);

    return otherParticipant?._id;
  }, [currentChat, user?._id]);

  useMarkMessagesAsSeen({
    chatId: currentChat?._id,
    currentUserId: user?._id,
    otherParticipantId,
    enabled: !!currentChat?._id && hasInternet,
  });

  // Check online status of chat participants when chat opens
  useEffect(() => {
    if (!currentChat || !socket) return;

    const participantIds = currentChat.participants
      ?.map((p: User) => p._id)
      .filter((id: string) => id !== user?._id);

    if (participantIds && participantIds.length > 0) {
      checkUsersOnlineStatus(participantIds);
    }
  }, [currentChat, socket, user?._id, checkUsersOnlineStatus]);

  // Show offline indicator
  useEffect(() => {
    if (!hasInternet) {
      toast.warning('You are offline. Messages will be queued.', {
        toastId: 'offline-warning',
      });
    } else {
      toast.dismiss('offline-warning');
    }
  }, [hasInternet]);

  useEffect(() => {
    if (currentChat?._id) {
      getAllMessages();
      scrollToBottom();
    }
  }, [currentChat?._id, getAllMessages, scrollToBottom]);

  useEffect(() => {
    if (!socket || !currentChat?._id) return;

    socket.emit(JOIN_CHAT_EVENT, { chatId: currentChat._id });

    return () => {
      socket.emit(LEAVE_CHAT_EVENT, { chatId: currentChat._id });
    };
  }, [socket, currentChat?._id]);

  useEffect(() => {
    resetTypingState();
    emitStopTyping();
  }, [currentChat?._id, resetTypingState, emitStopTyping]);

  const handleSendMessage = async () => {
    if (showReply) {
      await handleReplyToChatMessage();
      handleSetCloseReply();
    } else {
      await sendChatMessage();
    }
  };

  useEffect(() => {
    const handleCloseEmoji = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.EmojiPickerReact')) {
        setOpenEmoji(false);
      }
    };

    document.addEventListener('mousedown', handleCloseEmoji);

    return () => document.removeEventListener('mousedown', handleCloseEmoji);
  }, [setOpenEmoji]);

  /**
   * Handle typing logic
   * - Emits START_TYPING on first keystroke
   * - Emits STOP_TYPING after 1 second of inactivity
   */
  useEffect(() => {
    if (!message.trim()) {
      // If message is empty, ensure we've stopped typing
      emitStopTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      return;
    }

    // User is typing - emit START_TYPING
    emitStartTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Set new timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 1000);

    // Cleanup function
    return () => {
      if (typingTimeoutRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, emitStartTyping, emitStopTyping, typingTimeoutRef]);

  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;

    socket.on(USER_ONLINE_EVENT, handleUserOnline);
    socket.on(USER_OFFLINE_EVENT, handleUserOffline);
    socket?.on(UPDATE_CHAT_LAST_MESSAGE_EVENT, onUpdateChatLastMessage);
    socket?.on(MESSAGE_RECEIVED_EVENT, onMessageReceive);
    socket?.on(STOP_TYPING_EVENT, handleStopTyping);
    socket?.on(TYPING_EVENT, handleStartTyping);
    socket?.on(REACTION_RECEIVED_EVENT, (p) => {
      console.log('received');

      onReactionUpdate(p);
    });
    socket?.on(CHAT_MESSAGE_DELETE_EVENT, onChatMessageDeleted);
    socket?.on(NEW_CHAT_EVENT, onNewChat);
    socket?.on(LEAVE_CHAT_EVENT, _onChatLeave);
    socket?.on(NEW_GROUP_NAME, onGroupChatRename);
    socket?.on(MESSAGE_DELIVERED_EVENT, (payload) => {
      console.log(payload);

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
  ]);

  // Get online status for display
  const isOtherUserOnline = useMemo(() => {
    if (!otherParticipantId) return false;
    return isUserOnline(otherParticipantId);
  }, [otherParticipantId, isUserOnline]);

  const processChat = (user: User) => {
    const participants = currentChat?.participants;
    const totalParticipant = participants?.length;
    const isGroupChat = currentChat?.isGroupChat;
    const chatName = isGroupChat
      ? currentChat.name
      : participants?.filter((p: User) => p._id !== user?._id)[0]?.username;

    // const avatarUrl = isGroupChat
    //   ? participants?.slice(0, 3)
    //   : participants?.filter((p) => p._id !== user._id)[0]?.avatar;

    return {
      totalParticipant,
      isGroupChat,
      chatName,
    };
  };

  const currentChatMessages = useMemo(() => {
    if (!currentChat?._id || !reduxStateMessages) {
      return [];
    }
    const messages = reduxStateMessages[String(currentChat._id)];
    // Create a shallow copy to avoid proxy issues
    return messages
      ? messages.map((m: ChatMessageInterface) => {
          return { ...m };
        })
      : [];
  }, [currentChat?._id, reduxStateMessages]);

  // Determine if we should show mobile bottom nav
  const showMobileBottomNav = !currentChat;

  const handleLogout = async () => {
    try {
      // 1. Stop all outgoing API calls immediately
      dispatch(ApiService.util.resetApiState());

      // We call the API, but we don't wait for success to clear local UI
      // The Redux Slice extraReducers will handle the state wipe
      await logout().unwrap();
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if the API fails, the user wants out.
      // You could force a page reload here to clear memory: window.location.href = '/login';
      toast.error('Server logout failed, but local session cleared.');
    } finally {
      navigate('/login');
    }
  };

  return (
    <Disclosure as={Fragment}>
      {({ open, close }) => (
        <React.Fragment>
          <GroupChatInfo
            open={openGroupInfo}
            currentChat={currentChat!}
            handleClose={() => setOpenGroupInfo(false)}
            user={user}
            refetchChats={refetchChats}
          />

          <div className={classNames('w-full flex items-stretch h-screen flex-shrink-0')}>
            {/* LEFT SIDEBAR - Chat list / Status list / Settings */}
            <Navigation
              open={open}
              close={close}
              activeTab={activeTab}
              currentChat={currentChat!}
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />

            {/* MAIN CONTENT AREA */}
            <main className={classNames('flex-grow transition-all')}>
              <div
                className={classNames(
                  'relative flex flex-col justify-between h-full',
                  // Hide main area on mobile when no chat is selected and on chat_messages tab
                  !currentChat && activeTab === 'chat_messages'
                    ? 'hidden lg:block'
                    : 'bg-white dark:bg-black',
                )}>
                {/* CHAT MESSAGES TAB */}
                {activeTab === 'chat_messages' &&
                  (currentChat && currentChat._id ? (
                    <>
                      <header
                        className={classNames(
                          'fixed top-0 right-0 p-1.5 left-0 bg-white dark:bg-black border-b-[1.5px] dark:border-b-white/10 border-b-gray-600/30 z-20 transition-all lg:left-[30rem]',
                        )}>
                        <div
                          className={classNames('flex justify-between items-center h-full ml-6')}>
                          <div className='flex items-center gap-8'>
                            <button
                              type='button'
                              title='close chat'
                              className='flex items-center justify-center'
                              onClick={(event) => {
                                event.stopPropagation();
                                if (socket) {
                                  socket.emit(LEAVE_CHAT_EVENT, currentChat._id);
                                }
                                dispatch(setCurrentChat({ chat: null }));
                              }}>
                              <ArrowLeftIcon className='h-5 w-5 dark:text-white' />
                            </button>
                            <div>
                              <h3 className='text-xl font-semibold text-gray-800 dark:text-white'>
                                {processChat(user!)?.chatName}
                              </h3>
                              <p className='inline-flex items-center space-x-1.5'>
                                {!hasInternet ? (
                                  <>
                                    <span className='h-3 w-3 rounded-full block bg-gray-400'></span>
                                    <span className='text-sm font-semibold text-gray-400'>
                                      You're offline
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span
                                      className={classNames(
                                        'h-3 w-3 rounded-full block',
                                        isOtherUserOnline
                                          ? 'bg-green-400 animate-pulse'
                                          : 'bg-gray-400',
                                      )}></span>
                                    <span
                                      className={classNames(
                                        'text-sm font-semibold',
                                        isOtherUserOnline ? 'text-green-600' : 'text-gray-500',
                                      )}>
                                      {isOtherUserOnline ? 'online' : 'offline'}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-3'>
                            <Menu as='div' className='relative z-40'>
                              <Menu.Button
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setOpenOptions((prev) => !prev);
                                }}
                                className='flex dark:text-white text-gray-900 focus:outline-none'>
                                <EllipsisVerticalIcon className='size-7 text-gray-400' />
                              </Menu.Button>
                              <Transition
                                as={Fragment}
                                enter='transition ease-out duration-100'
                                enterFrom='transform opacity-0 scale-95'
                                enterTo='transform opacity-100 scale-100'
                                leave='transition ease-in duration-75'
                                leaveFrom='transform opacity-100 scale-100'
                                leaveTo='transform opacity-0 scale-95'>
                                <Menu.Items className='absolute right-0 z-40 mt-4 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border dark:border-white/10'>
                                  <div className='py-1'>
                                    {currentChat.isGroupChat ? (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();

                                              setOpenGroupInfo(true);
                                            }}
                                            className={classNames(
                                              active ? 'bg-gray-100 dark:bg-white/5' : '',
                                              'flex w-full items-center px-4 py-2 text-sm dark:text-white',
                                            )}>
                                            <InformationCircleIcon className='h-4 w-4 mr-2' /> About
                                            group
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ) : (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();

                                              // deleteChat();
                                            }}
                                            className={classNames(
                                              active
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                                                : 'text-red-500',
                                              'flex w-full items-center px-4 py-2 text-sm font-medium',
                                            )}>
                                            <TrashIcon className='h-4 w-4 mr-2' /> Delete chat
                                          </button>
                                        )}
                                      </Menu.Item>
                                    )}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </div>
                      </header>

                      <div className='relative left-0 lg:w-full right-0 gap-6 h-screen flex flex-col flex-grow overflow-y-auto overflow-x-hidden mt-16 transition-all duration-200'>
                        <div
                          ref={(e) => {
                            bottomRef.current = e;
                            containerRef.current = e;
                          }}
                          className='flex flex-col flex-grow overflow-y-auto gap-10 overflow-x-hidden mb-[5.5rem] md:mb-[4.15rem] lg:mb-[4.35rem]'>
                          {showScrollButton && (
                            <button
                              onClick={scrollToBottom}
                              className='fixed bottom-20 right-5 bg-gray-800 dark:bg-white/5 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10'
                              aria-label='Scroll to bottom'>
                              <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M19 14l-7 7m0 0l-7-7m7 7V3'
                                />
                              </svg>
                            </button>
                          )}
                          {loadingMessages ? (
                            <div className='flex justify-center items-center min-h-[calc(100%-5rem)]'>
                              <Typing />
                            </div>
                          ) : (
                            <>
                              <div className='flex flex-col gap-6 h-full chat-container'>
                                {currentChatMessages?.length > 0 ? (
                                  React.Children.toArray(
                                    currentChatMessages?.map((msg: ChatMessageInterface) => {
                                      return (
                                        <MessageItem
                                          message={msg}
                                          theme={theme}
                                          containerRef={containerRef}
                                          highlightedMessageId={highlightedMessageId}
                                          isGroupChatMessage={currentChat?.isGroupChat}
                                          isOwnedMessage={msg.sender?._id === user?._id}
                                          setIsOwnedMessage={setIsOwnedMessage}
                                          onSetHighlightedMessage={handleSetHighlightedMessage}
                                        />
                                      );
                                    }),
                                  )
                                ) : (
                                  <div className='flex justify-center items-center h-full'>
                                    <p className='text-gray-500'>
                                      No messages yet. Start a conversation!
                                    </p>
                                  </div>
                                )}

                                {isTyping && (
                                  <div className={classNames('flex flex-col gap-2 mb-0.5')}>
                                    {/* Animated dots */}
                                    <div
                                      className={classNames(
                                        'p-3 rounded-3xl bg-secondary w-fit inline-flex gap-1.5',
                                        'bg-black/60 dark:bg-white/5 border-[1.5px] dark:border-white/10 border-gray-300',
                                      )}>
                                      <span className='animation1 mx-[0.5px] h-1 w-1 bg-zinc-300 dark:bg-zinc-400 rounded-full'></span>
                                      <span className='animation2 mx-[0.5px] h-1 w-1 bg-zinc-300 dark:bg-zinc-400 rounded-full'></span>
                                      <span className='animation3 mx-[0.5px] h-1 w-1 bg-zinc-300 dark:bg-zinc-400 rounded-full'></span>
                                    </div>

                                    {getTypingText() && (
                                      <span className='text-xs text-gray-500 dark:text-gray-400 ml-1'>
                                        {getTypingText()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <MessageInput
                          reduxStateMessages={currentChatMessages}
                          isOwnedMessage={isOwnedMessage}
                          theme={theme}
                          textareaRef={messageInputRef}
                          handleSendMessage={handleSendMessage}
                          currentChat={currentChat}
                        />
                      </div>
                    </>
                  ) : (
                    <div className='w-full h-full flex justify-center items-center dark:text-white'>
                      No chat selected
                    </div>
                  ))}
                {/* STATUS TAB */}
                {activeTab === 'status' && (
                  <div className='h-full overflow-hidden'>
                    <CreateOrViewStatusWindowPanel />
                  </div>
                )}
              </div>
            </main>

            {/* MOBILE BOTTOM NAV: Show when no chat is open */}
            {showMobileBottomNav && (
              <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </div>
        </React.Fragment>
      )}
    </Disclosure>
  );
};
