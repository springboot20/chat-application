import React, { Fragment, useMemo, useState } from 'react';
import { ChatListItemInterface } from '../../types/chat';
import { classNames, formatMessageTime, getMessageObjectMetaData } from '../../utils';
import {
  CheckCircleIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  NoSymbolIcon,
  TrashIcon,
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { useDeleteOneOneChatMessageMutation } from '../../features/chats/chat.slice';
import { toast } from 'react-toastify';
import { Menu, Transition } from '@headlessui/react';
import { GroupChatInfo } from '../modal/GroupChatInfo';
import { User } from '../../types/auth';
import { setCurrentChat } from '../../features/chats/chat.reducer';
import { useAppDispatch } from '../../redux/redux.hooks';
import { TypingUser } from '../../hooks/useTyping';

interface ChatItemProps {
  chat: ChatListItemInterface;
  onClick: (chat: ChatListItemInterface) => void;
  isActive?: boolean;
  unreadCount: number;
  onChatDelete: (chatId: string) => void;
  close: () => any;
  refetchChats: () => any;
  user: User | null;
  typingUsers: TypingUser[];
}

export const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  onClick,
  unreadCount,
  onChatDelete,
  isActive,
  close,
  user,
  refetchChats,
  typingUsers,
}) => {
  const [openGroupInfo, setOpenGroupInfo] = useState(false);
  const [openOptions, setOpenOptions] = useState<{ [key: string]: boolean }>({});
  const dispatch = useAppDispatch();

  const toggleOptions = (id: string, evt: React.MouseEvent) => {
    evt.stopPropagation();
    setOpenOptions((prev) => ({
      ...prev,
      [id]: !openOptions[id],
    }));
  };

  const [deleteOneOneChatMessage] = useDeleteOneOneChatMessageMutation();

  const deleteChat = async () => {
    await deleteOneOneChatMessage(chat?._id)
      .unwrap()
      .then((response) => {
        toast.success(response?.message || 'Chat deleted');
        onChatDelete(chat?._id);
      })
      .catch((error: any) => {
        toast.error(error?.data?.message || 'Failed to delete');
      });
  };

  const chatMeta = useMemo(() => {
    return getMessageObjectMetaData(chat, user!);
  }, [user, chat]);

  const lastMessage = useMemo(() => {
    if (chat.lastMessage?.isDeleted) {
      return 'deleted message';
    }
    return chatMeta.lastMessage;
  }, [chatMeta, chat.lastMessage]);

  return (
    <>
      <GroupChatInfo
        open={openGroupInfo}
        currentChat={chat}
        handleClose={() => setOpenGroupInfo(false)}
        user={user}
        refetchChats={refetchChats}
      />
      <div
        role='button'
        className={classNames(
          'group flex items-start cursor-pointer px-3 py-3 justify-between transition-all duration-200 border-b border-gray-200 dark:border-white/5',
          isActive
            ? 'bg-gray-200 dark:bg-white/10'
            : 'bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5',
        )}
        onClick={() => {
          onClick(chat);
          close();
        }}
        onMouseLeave={() => setOpenOptions({})}>
        <div className='flex items-center gap-3 w-full'>
          {/* Options Menu Button (Hidden by default, shown on hover) */}
          <div className='flex items-center flex-shrink-0'>
            <Menu as='div' className='relative'>
              <Menu.Button
                onClick={(e) => toggleOptions(chat?._id, e)}
                className='flex dark:text-white text-gray-900 focus:outline-none'>
                <EllipsisVerticalIcon className='h-5 w-5 group-hover:opacity-100 opacity-0 transition-opacity text-gray-400' />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter='transition ease-out duration-100'
                enterFrom='transform opacity-0 scale-95'
                enterTo='transform opacity-100 scale-100'
                leave='transition ease-in duration-75'
                leaveFrom='transform opacity-100 scale-100'
                leaveTo='transform opacity-0 scale-95'>
                <Menu.Items className='absolute left-5 z-40 mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border dark:border-white/10'>
                  <div className='py-1'>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptions({});
                          }}
                          className={classNames(
                            active ? 'bg-gray-100 dark:bg-white/5' : '',
                            'flex w-full items-center px-4 py-2 text-sm dark:text-white',
                          )}>
                          <CheckCircleIcon className='h-4 w-4 mr-2' /> Mark as read
                        </button>
                      )}
                    </Menu.Item>
                    {chat.isGroupChat ? (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenGroupInfo(true);
                              dispatch(setCurrentChat({ chat }));
                            }}
                            className={classNames(
                              active ? 'bg-gray-100 dark:bg-white/5' : '',
                              'flex w-full items-center px-4 py-2 text-sm dark:text-white',
                            )}>
                            <InformationCircleIcon className='h-4 w-4 mr-2' /> About group
                          </button>
                        )}
                      </Menu.Item>
                    ) : (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat();
                            }}
                            className={classNames(
                              active ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-red-500',
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

            {/* Avatar Section */}
            <div className='flex-shrink-0 ml-1'>
              {chat.isGroupChat ? (
                <div className='w-12 h-12 relative flex items-center justify-center'>
                  <div className='w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-black'>
                    {chat.name?.charAt(0) || 'G'}
                  </div>
                </div>
              ) : (
                <div className='w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden'>
                  <span className='text-gray-400 text-xs'>User</span>
                </div>
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className='flex flex-col flex-1 overflow-hidden'>
            <div className='flex justify-between items-center w-full'>
              <p
                className={classNames(
                  'truncate transition-all',
                  unreadCount > 0
                    ? 'text-gray-900 dark:text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 font-medium',
                )}>
                {chatMeta?.title}
              </p>
              <small
                className={classNames(
                  'flex-shrink-0 ml-2',
                  unreadCount > 0
                    ? 'text-green-600 dark:text-green-400 font-bold'
                    : 'text-gray-400',
                )}>
                {formatMessageTime(chat.updatedAt)}
              </small>
            </div>

            <div className='flex items-center gap-1 overflow-hidden h-5'>
              {/* Message Status */}
              {(chatMeta as any).isSender &&
                !chat.lastMessage?.isDeleted &&
                (chatMeta as any).status && (
                  <div className='flex items-center mr-1'>
                    {(chatMeta as any).status === 'sent' && (
                      <CheckIcon className='w-3.5 h-3.5 text-gray-400' />
                    )}
                    {(chatMeta as any).status === 'delivered' && (
                      <span className='text-gray-400'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='24'
                          height='24'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='h-3.5 w-3.5'>
                          <path d='M18 6 7 17l-5-5' />
                          <path d='m22 10-7.5 7.5L13 16' />
                        </svg>
                      </span>
                    )}
                    {(chatMeta as any).status === 'seen' && (
                      <span className='text-blue-500'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='24'
                          height='24'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='h-3.5 w-3.5'>
                          <path d='M18 6 7 17l-5-5' />
                          <path d='m22 10-7.5 7.5L13 16' />
                        </svg>
                      </span>
                    )}
                  </div>
                )}

              {/* Attachment Icon */}
              {!chat.lastMessage?.isDeleted && (chatMeta as any).attachmentType && (
                <div className='flex-shrink-0 text-gray-500 dark:text-gray-400 mr-1'>
                  {(chatMeta as any).attachmentType === 'image' && (
                    <PhotoIcon className='h-3.5 w-3.5' />
                  )}
                  {(chatMeta as any).attachmentType === 'video' && (
                    <VideoCameraIcon className='h-3.5 w-3.5' />
                  )}
                  {(chatMeta as any).attachmentType === 'voice' && (
                    <MicrophoneIcon className='h-3.5 w-3.5' />
                  )}
                  {((chatMeta as any).attachmentType === 'document' ||
                    (chatMeta as any).attachmentType === 'file') && (
                    <DocumentIcon className='h-3.5 w-3.5' />
                  )}
                </div>
              )}

              {typingUsers && typingUsers.length > 0 ? (
                <small className='italic text-green-500 font-medium animate-pulse truncate'>
                  {typingUsers.map((u) => u.username).join(', ')} typing...
                </small>
              ) : chat?.lastMessage?.isDeleted ? (
                <div className='flex items-center space-x-1 overflow-hidden'>
                  <NoSymbolIcon className='text-gray-400 h-3 flex-shrink-0' strokeWidth={2} />
                  <p className='text-xs italic text-gray-400 truncate'>deleted this message</p>
                </div>
              ) : (
                <small
                  className={classNames(
                    'truncate',
                    unreadCount > 0
                      ? 'text-gray-900 dark:text-gray-100 font-semibold'
                      : 'text-gray-500 dark:text-gray-400',
                  )}>
                  {lastMessage}
                </small>
              )}
            </div>
          </div>
        </div>

        {/* Unread Badge Section */}
        {unreadCount > 0 && (
          <div className='flex flex-col justify-end items-center h-10 ml-2'>
            <span className='h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-green-500 shadow-sm'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </div>
    </>
  );
};
