import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../components/status/StatusAvatar';
import { UserProfileModal } from '../../components/modal/UserProfileModal';
import { GroupChatInfo } from '../../components/modal/GroupChatInfo';
import { MessageItem } from '../../components/chat/MessageItem';
import MessageInput from '../../components/input/MessageInput';
import Typing from '../../components/Typing';
import { useChat } from '../../hooks/useChat';
import { useMessage } from '../../hooks/useMessage';
import { useTyping } from '../../hooks/useTyping';
import { useSocketContext } from '../../hooks/useSocket';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import { RootState } from '../../app/store';
import { useTheme } from '../../context/ThemeContext';
import { User } from '../../types/auth';
import { ChatListItemInterface, ChatMessageInterface } from '../../types/chat';
import { setCurrentChat } from '../../features/chats/chat.reducer';
import { JOIN_CHAT_EVENT, LEAVE_CHAT_EVENT } from '../../enums/index';
import { useMarkMessagesAsSeen } from '../../hooks/useMarkMessagesAsSeen';
import { useNetwork } from '../../hooks/useNetwork';
import { useGetChatMessagesQuery } from '../../features/chats/chat.slice';

export const ChatRoom: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  const { socket } = useSocketContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isUserOnline, checkUsersOnlineStatus } = useOnlineUsers();
  const { isOnline: hasInternet } = useNetwork();

  const { currentChat, chatMessages: reduxStateMessages, refetchChats } = useChat();
  const messageHook = useMessage();

  const {
    getAllMessages,
    bottomRef,
    messageInputRef,
    handleSetCloseReply,
    showReply,
    handleReplyToChatMessage,
    scrollToBottom,
    showScrollButton,
    sendChatMessage,
  } = messageHook;

  const { isTyping, getTypingText, emitStopTyping, resetTypingState } = useTyping({
    currentChat: currentChat!,
    user,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [openGroupInfo, setOpenGroupInfo] = useState(false);
  const [openUserInfo, setOpenUserInfo] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | undefined>(undefined);

  const otherParticipantId = useMemo(() => {
    if (!currentChat || currentChat.isGroupChat) return undefined;
    const otherParticipant = currentChat.participants?.find((p: User) => p && p._id !== user?._id);
    return otherParticipant?._id;
  }, [currentChat, user?._id]);

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: _,
    isLoading: loadingMessages,
  } = useGetChatMessagesQuery(currentChat?._id ?? '', {
    skip: !currentChat?._id,
  });

  const currentChatMessages = useMemo(() => {
    if (!currentChat?._id || !reduxStateMessages) {
      return [];
    }
    // Create a shallow copy to avoid proxy issues
    return Array.isArray(reduxStateMessages)
      ? reduxStateMessages.map((m: ChatMessageInterface) => {
          return { ...m };
        })
      : [];
  }, [currentChat?._id, reduxStateMessages]);

  const handleSendMessage = async () => {
    if (showReply) {
      await handleReplyToChatMessage();
      handleSetCloseReply();
    } else {
      await sendChatMessage();
    }
  };

  const isOtherUserOnline = useMemo(() => {
    if (!otherParticipantId) return false;
    return isUserOnline(otherParticipantId);
  }, [otherParticipantId, isUserOnline]);

  const processChat = () => {
    const participants = currentChat?.participants;
    const totalParticipant = participants?.length;
    const isGroupChat = currentChat?.isGroupChat;

    const otherParticipant = participants?.find((p: User) => p && p._id !== user?._id);

    const chatName = isGroupChat ? currentChat.name : otherParticipant?.username || 'Unknown User';

    const avatarUrl = isGroupChat
      ? (currentChat?.avatar?.url ?? '')
      : (otherParticipant?.avatar?.url ?? '');

    return {
      totalParticipant,
      isGroupChat,
      chatName,
      avatarUrl,
      otherParticipant,
    };
  };

  useMarkMessagesAsSeen({
    chatId: currentChat?._id,
    currentUserId: user?._id,
    otherParticipantId,
    enabled: !!currentChat?._id && hasInternet,
  });

  useEffect(() => {
    if (!currentChat?._id || !socket) return;

    const participantIds = currentChat.participants
      ?.filter(Boolean)
      ?.map((p: User) => p._id)
      .filter((id: string) => id !== user?._id);

    if (participantIds && participantIds.length > 0) {
      checkUsersOnlineStatus(participantIds);
    }

    // Join the chat room
    socket.emit(JOIN_CHAT_EVENT, { chatId: currentChat._id });

    return () => {
      socket.emit(LEAVE_CHAT_EVENT, { chatId: currentChat._id });
    };
  }, [currentChat?._id, socket, user?._id, checkUsersOnlineStatus]);

  useEffect(() => {
    if (currentChat?._id) {
      getAllMessages();
      scrollToBottom();
    }
  }, [currentChat?._id, getAllMessages, scrollToBottom]);

  useEffect(() => {
    resetTypingState();
    emitStopTyping();
  }, [currentChat?._id, resetTypingState, emitStopTyping]);

  if (!currentChat) return null;

  const chatInfo = processChat();

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <GroupChatInfo
        open={openGroupInfo}
        currentChat={currentChat}
        handleClose={() => setOpenGroupInfo(false)}
        user={user}
        refetchChats={refetchChats}
      />
      <UserProfileModal
        open={openUserInfo}
        onClose={() => setOpenUserInfo(false)}
        user={chatInfo?.otherParticipant || null}
      />

      <header
        className={classNames(
          'fixed top-0 right-0 p-2 left-0 bg-white dark:bg-black border-b-[1.5px] dark:border-b-white/10 border-b-gray-600/30 z-20 lg:left-[30rem]',
        )}>
        <div className='flex justify-between items-center h-full'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                dispatch(setCurrentChat({ chat: undefined as unknown as ChatListItemInterface }));
                navigate('/chat');
              }}
              className='flex items-center justify-center p-1'>
              <ArrowLeftIcon className='h-5 w-5 dark:text-white' />
            </button>
            <div
              className='flex items-center gap-3 cursor-pointer'
              onClick={() =>
                currentChat.isGroupChat ? setOpenGroupInfo(true) : setOpenUserInfo(true)
              }>
              <div className='size-12'>
                <UserAvatar imageUrl={chatInfo?.avatarUrl || ''} />
              </div>
              <div className='flex flex-col'>
                <h3 className='text-xl font-semibold text-gray-800 dark:text-white'>
                  {chatInfo?.chatName}
                </h3>
                <span
                  className={classNames(
                    'text-sm font-semibold',
                    isOtherUserOnline ? 'text-green-600' : 'text-gray-500',
                  )}>
                  {isOtherUserOnline ? 'online' : 'offline'}
                </span>
              </div>
            </div>
          </div>
          <EllipsisVerticalIcon className='size-7 text-gray-400' />
        </div>
      </header>

      <div className='relative left-0 lg:w-full right-0 gap-6 h-screen flex flex-col flex-grow overflow-y-auto overflow-x-hidden mt-16 transition-all duration-200 chat-background'>
        <div
          ref={(e) => {
            bottomRef.current = e;
            containerRef.current = e;
          }}
          className='flex flex-col flex-grow overflow-y-auto gap-10 overflow-x-hidden mb-[8rem] lg:mb-[8.25rem]'>
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className='fixed bottom-20 right-5 bg-gray-800 dark:bg-white/5 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10'
              aria-label='Scroll to bottom'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
            <div className='flex flex-col gap-y-2.5 h-full chat-container'>
              {currentChatMessages?.map((msg: any) => (
                <MessageItem
                  key={msg._id}
                  message={msg}
                  theme={theme}
                  containerRef={containerRef}
                  highlightedMessageId={highlightedMessageId}
                  isGroupChatMessage={currentChat.isGroupChat}
                  onSetHighlightedMessage={setHighlightedMessageId}
                />
              ))}
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
          )}
        </div>
        <MessageInput
          reduxStateMessages={currentChatMessages}
          theme={theme}
          textareaRef={messageInputRef}
          handleSendMessage={handleSendMessage}
          currentChat={currentChat}
        />
      </div>
    </div>
  );
};
