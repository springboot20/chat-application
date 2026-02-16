import { Disclosure } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { SearchInput } from '../panels/SearchInput.tsx';
import { ChatItem } from '../chat/ChatItem.tsx';
import { Loading } from '../Loading.tsx';
import { classNames, getMessageObjectMetaData } from '../../utils/index.ts';
import { ChatListItemInterface } from '../../types/chat.ts';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks.ts';
import { onChatDelete, setCurrentChat } from '../../features/chats/chat.reducer.ts';
import { useDebounce } from '../../hooks/useDebounce.ts';
import { useTyping } from '../../hooks/useTyping.ts';
import { useChat } from '../../hooks/useChat.ts';
import { useMessage } from '../../hooks/useMessage.ts';
import { NewChatModal } from '../modal/NewChatModal.tsx';

type MessageTabComponentProps = {
  open: boolean;
  close: () => any;
};

export const MessageTabComponent: React.FC<MessageTabComponentProps> = ({ close }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { setMessage, getAllMessages } = useMessage();
  const dispatch = useAppDispatch();

  const [itemDeleted, setItemDeleted] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const [openChat, setOpenChat] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // useChat should provide unreadMessages (likely from a socket listener or global state)
  const { chatsWithMeta, isLoadingChats, refetchChats, currentChat } = useChat();

  const { typingUsers } = useTyping({
    currentChat: currentChat!,
    user,
  });

  const debounceValue = useDebounce(localSearchQuery, 300);
  const isSearching = localSearchQuery !== debounceValue;

  useEffect(() => {
    if (itemDeleted) {
      refetchChats();
      setItemDeleted(false);
    }
  }, [itemDeleted, refetchChats]);

  const handleChatSelect = useCallback(
    (chat: ChatListItemInterface) => {
      if (currentChat && currentChat?._id === chat?._id) return;

      // 1. Set current chat in Redux
      dispatch(setCurrentChat({ chat }));

      // 2. Clear input and fetch history
      setMessage('');
      getAllMessages();

      // 3. Close the sidebar on mobile
      close();
    },
    [close, currentChat, dispatch, setMessage, getAllMessages],
  );

  const handleChatDelete = useCallback(
    (chatId: string) => {
      setItemDeleted(true);
      dispatch(onChatDelete({ chatId }));
    },
    [dispatch],
  );

  /**
   * Filtering logic that reacts to search input, the filter tab,
   * and REAL-TIME unread count changes.
   */
  const filteredChats = useMemo(() => {
    if (!chatsWithMeta) return [];

    let filtered = [...chatsWithMeta];

    // Filter by search
    if (debounceValue) {
      const searchTerm = debounceValue.toLowerCase();
      filtered = filtered.filter((chat) => {
        const title = getMessageObjectMetaData(chat, user!).title;
        return title?.toLowerCase().includes(searchTerm);
      });
    }

    // Filter by Read/Unread status
    if (filter === 'unread') {
      filtered = filtered.filter((chat) => chat?.unreadCount > 0);
    } else if (filter === 'read') {
      filtered = filtered.filter((chat) => chat?.unreadCount === 0);
    }

    // Sort by most recent activity (like WhatsApp)
    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [chatsWithMeta, filter, debounceValue, user]);

  const chatCounts = useMemo(() => {
    const all = chatsWithMeta?.length || 0;
    const unread = chatsWithMeta?.filter((chat) => chat?.unreadCount > 0).length || 0;
    const read = all - unread;
    return { all, unread, read };
  }, [chatsWithMeta]);

  const handleCloseChat = useCallback(() => setOpenChat(false), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  }, []);

  const FilterButton = ({
    filterType,
    label,
    count,
  }: {
    filterType: 'all' | 'unread' | 'read';
    label: string;
    count: number;
  }) => (
    <button
      type='button'
      onClick={() => setFilter(filterType)}
      className={classNames(
        'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
        filter === filterType
          ? 'bg-[#615EF0] text-white shadow-md'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10',
      )}>
      {label} {count > 0 && <span className='ml-1 opacity-70'>{count}</span>}
    </button>
  );

  return (
    <>
      <NewChatModal open={openChat} onClose={handleCloseChat} />

      {/* DESKTOP SIDEBAR */}
      <div className='fixed lg:left-20 w-[25rem] bg-white dark:bg-black flex-1 border-r border-gray-200 dark:border-white/10 h-screen z-50 hidden lg:block'>
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex justify-between items-center w-full p-3 border-b border-gray-200 dark:border-white/10'>
            <div className='flex items-center gap-2'>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>Messages</h2>
              <FontAwesomeIcon icon={faCaretDown} className='text-gray-400 mt-1 cursor-pointer' />
            </div>
            <button
            type="button"
              onClick={() => setOpenChat(true)}
              className='p-2 rounded-full bg-[#615EF0] hover:bg-[#4f4dbf] transition-colors text-white shadow-lg'>
              <PlusIcon className='h-6 w-6' />
            </button>
          </div>

          <div className='px-4 pt-4'>
            {/* Search */}
            <div className='relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-transparent focus-within:border-[#615EF0] transition-all'>
              <div className='absolute left-3 inset-y-0 flex items-center pointer-events-none'>
                <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
              </div>
              <SearchInput
                ref={inputRef}
                placeholder='Search messages'
                onChange={handleSearchChange}
                value={localSearchQuery}
                className='w-full pl-10 pr-4 py-3 bg-transparent focus:outline-none dark:text-white'
              />
            </div>

            {/* Filter Pills */}
            <div className='flex gap-2 my-4'>
              <FilterButton filterType='all' label='All' count={chatCounts.all} />
              <FilterButton filterType='unread' label='Unread' count={chatCounts.unread} />
            </div>
          </div>

          {/* Chat List */}
          <div className='flex-1 overflow-y-auto custom-scrollbar'>
            {isLoadingChats || isSearching ? (
              <div className='flex justify-center mt-10'>
                <Loading />
              </div>
            ) : filteredChats.length > 0 ? (
              <div className='flex flex-col'>
                {filteredChats.map((chat) => (
                  <ChatItem
                    key={chat._id}
                    chat={chat}
                    isActive={chat._id === currentChat?._id}
                    user={user}
                    onClick={handleChatSelect}
                    onChatDelete={handleChatDelete}
                    close={close}
                    typingUsers={typingUsers}
                    unreadCount={chat?.unreadCount}
                    refetchChats={refetchChats}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center mt-20 px-10 text-center opacity-40'>
                <MagnifyingGlassIcon className='h-12 w-12 mb-2 text-gray-400' />
                <p className='text-gray-500 dark:text-gray-400'>No chats found here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE PANEL (Disclosure.Panel) */}
      <Disclosure.Panel
        static
        className='fixed inset-0 w-full bg-white dark:bg-black z-50 lg:hidden overflow-y-auto'>
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex justify-between items-center w-full p-4 border-b border-gray-200 dark:border-white/10'>
            <div className='flex items-center gap-2'>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>Messages</h2>
              <FontAwesomeIcon icon={faCaretDown} className='text-gray-400 mt-1 cursor-pointer' />
            </div>
            <button
              onClick={() => setOpenChat(true)}
              className='p-2 rounded-full bg-[#615EF0] hover:bg-[#4f4dbf] transition-colors text-white shadow-lg'>
              <PlusIcon className='h-6 w-6' />
            </button>
          </div>

          <div className='px-4 pt-4'>
            {/* Search */}
            <div className='relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-transparent focus-within:border-[#615EF0] transition-all'>
              <div className='absolute left-3 inset-y-0 flex items-center pointer-events-none'>
                <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
              </div>
              <SearchInput
                ref={inputRef}
                placeholder='Search messages'
                onChange={handleSearchChange}
                value={localSearchQuery}
                className='w-full pl-10 pr-4 py-3 bg-transparent focus:outline-none dark:text-white'
              />
            </div>

            {/* Filter Pills */}
            <div className='flex gap-2 my-4'>
              <FilterButton filterType='all' label='All' count={chatCounts.all} />
              <FilterButton filterType='unread' label='Unread' count={chatCounts.unread} />
            </div>
          </div>

          {/* Chat List */}
          <div className='flex-1 overflow-y-auto custom-scrollbar'>
            {isLoadingChats || isSearching ? (
              <div className='flex justify-center mt-10'>
                <Loading />
              </div>
            ) : filteredChats.length > 0 ? (
              <div className='flex flex-col'>
                {filteredChats.map((chat) => (
                  <ChatItem
                    key={chat._id}
                    chat={chat}
                    isActive={chat._id === currentChat?._id}
                    user={user}
                    onClick={handleChatSelect}
                    onChatDelete={handleChatDelete}
                    close={close}
                    typingUsers={typingUsers}
                    unreadCount={chat?.unreadCount}
                    refetchChats={refetchChats}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center mt-20 px-10 text-center opacity-40'>
                <MagnifyingGlassIcon className='h-12 w-12 mb-2 text-gray-400' />
                <p className='text-gray-500 dark:text-gray-400'>No chats found here.</p>
              </div>
            )}
          </div>
        </div>
      </Disclosure.Panel>
    </>
  );
};
