import { Dialog } from '@headlessui/react';
import {
  UserGroupIcon,
  XMarkIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useRef, useState } from 'react';
import { classNames } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useAddToContactMutation,
  useGetMyContactsQuery,
  useToggleBlockContactMutation,
} from '../../features/contacts/contact.api.slice';
import { SelectModalInput } from './Select';
import {
  useCreateGroupChatMutation,
  useCreateUserChatMutation,
  useGetAvailableUsersQuery,
} from '../../features/chats/chat.slice';
import { User } from '../../types/auth';
import { toast } from 'react-toastify';
import { Button } from '../buttons/Buttons';

type NewChatModalProps = {
  open: boolean;
  onClose: () => void;
};

type TabType = 'new-chat' | 'new-group' | 'discover';

const tabs: { id: TabType; label: string; icon: any; description: string }[] = [
  {
    id: 'new-chat',
    label: 'New Chat',
    icon: ChatBubbleLeftRightIcon,
    description: 'Message your contacts',
  },
  {
    id: 'new-group',
    label: 'New Group',
    icon: UserGroupIcon,
    description: 'Create a group chat',
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: UserPlusIcon,
    description: 'Find new people',
  },
];

export const NewChatModal: React.FC<NewChatModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('new-chat');

  const handleClose = () => {
    setActiveTab('new-chat');
    onClose();
  };

  const splittedTabText = activeTab.split('-');

  return (
    <Dialog open={open} onClose={handleClose} className='relative z-[60]'>
      <Dialog.Backdrop className='fixed inset-0 z-50 bg-gray-500/75 dark:bg-black/70 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in' />

      <div className='fixed inset-0 w-screen overflow-y-auto'>
        <div className='flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4 md:py-8'>
          <Dialog.Panel className='flex w-full transform text-left text-base transition data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in md:data-[closed]:translate-y-0 md:data-[closed]:scale-95 mx-auto md:max-w-5xl md:rounded-2xl overflow-hidden'>
            <div className='relative flex flex-col md:flex-row bg-white dark:bg-gray-900 w-full min-h-screen md:min-h-[600px] md:max-h-[85vh]'>
              {/* Header - Mobile Only */}
              <div className='md:hidden flex justify-between items-center w-full h-16 px-4 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30'>
                <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                  <span className='capitalize'>{splittedTabText[0]} </span>
                  <span className='capitalize'>{splittedTabText[1]}</span>
                </Dialog.Title>
                <button
                  type='button'
                  onClick={handleClose}
                  className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                  <span className='sr-only'>Close</span>
                  <XMarkIcon className='h-6 w-6' />
                </button>
              </div>

              {/* Sidebar Navigation */}
              <div className='w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/50'>
                {/* Header - Desktop Only */}
                <div className='hidden md:flex justify-between items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30'>
                  <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                    <span className='capitalize'>{splittedTabText[0]} </span>
                    <span className='capitalize'>{splittedTabText[1]}</span>
                  </Dialog.Title>
                  <button
                    type='button'
                    onClick={handleClose}
                    className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'>
                    <span className='sr-only'>Close</span>
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                {/* Tab Menu Items */}
                <div className='flex md:flex-col overflow-x-auto md:overflow-x-visible'>
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type='button'
                        onClick={() => setActiveTab(tab.id)}
                        className={classNames(
                          'flex items-center gap-4 px-6 py-4 w-full transition-all group',
                          'min-w-[140px] md:min-w-0',
                          isActive
                            ? 'bg-violet-50 dark:bg-gray-800 border-b-2 md:border-b-0 md:border-l-4 border-violet-600'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b-2 md:border-b-0 md:border-l-4 border-transparent',
                        )}>
                        <div
                          className={classNames(
                            'rounded-full p-2 transition-all',
                            isActive
                              ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg'
                              : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600',
                          )}>
                          <Icon
                            className={classNames(
                              'h-5 w-5 transition-transform group-hover:scale-110',
                              isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400',
                            )}
                          />
                        </div>
                        <div className='text-left flex-1'>
                          <p
                            className={classNames(
                              'text-sm font-semibold',
                              isActive
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300',
                            )}>
                            {tab.label}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400 hidden md:block'>
                            {tab.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className='flex-1 overflow-y-auto bg-white dark:bg-gray-900'>
                <AnimatePresence mode='wait'>
                  {activeTab === 'new-chat' && (
                    <ExistingContactList key='chat' onClose={handleClose} />
                  )}
                  {activeTab === 'new-group' && <NewGroupList key='group' onClose={handleClose} />}
                  {activeTab === 'discover' && <DiscoverUsersList key='discover' />}
                </AnimatePresence>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

const ExistingContactList = ({ onClose }: { onClose: () => void }) => {
  const [_, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data: contactsResponse,
    isFetching,
    isLoading,
  } = useGetMyContactsQuery({
    page: currentPage,
  });
  const [toggleBlock, { isLoading: isBlocking }] = useToggleBlockContactMutation();
  const [createUserChat, { isLoading: isCreatingChat }] = useCreateUserChatMutation();

  const myContacts = useMemo(
    () => (contactsResponse?.data?.contacts || []) as any[],
    [contactsResponse?.data],
  );

  const hasMore = contactsResponse?.data?.pagination?.hasMore;

  const handleBlockToggle = async (contactRecordId: string) => {
    if (!contactRecordId) return;

    const contactRecord = myContacts?.find((c) => c.contact._id === contactRecordId);
    const isBlocked = contactRecord.isBlocked;

    if (
      !window.confirm(
        `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${contactRecord.contact.username}?`,
      )
    )
      return;

    try {
      const res = await toggleBlock(contactRecord._id).unwrap();
      toast.success(res.message || `User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update block status');
    }
  };

  const lastUserElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching || isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetching, isLoading, hasMore],
  );

  const selectOptions = useMemo(() => {
    return myContacts.map((item) => ({
      label: item.contact.username,
      value: item.contact._id,
      isBlocked: item.isBlocked,
      isContact: true,
    }));
  }, [myContacts]);

  const getUserById = (id: string) => {
    const contactUser = myContacts.find((c) => c.contact._id === id);
    if (contactUser) return { ...contactUser.contact, isContact: true };
    return undefined;
  };

  const selectedUser = selectedUserId ? getUserById(selectedUserId) : null;

  const handleStartChat = async () => {
    if (!selectedUserId) return;

    try {
      await createUserChat(selectedUserId).unwrap();
      toast.success('Chat started successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className='p-4 md:p-6'>
      {/* Selected Contact */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='mb-4 md:mb-6 overflow-hidden'>
            <div className='rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 p-3 md:p-4 border border-violet-200 dark:border-violet-800/30'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 md:gap-3 min-w-0 flex-1'>
                  <div className='h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base md:text-lg uppercase shadow-lg shrink-0'>
                    {selectedUser.username[0]}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                      {selectedUser.username}
                    </p>
                    <p className='text-xs text-gray-600 dark:text-gray-400'>Ready to chat</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className='rounded-full p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0'>
                  <XCircleIcon className='h-5 w-5' />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Input with Contacts */}
      <div className='mb-4 md:mb-0'>
        <SelectModalInput
          placeholder='Search contacts...'
          options={selectOptions}
          value={selectedUserId || ''}
          onChange={({ value }) => setSelectedUserId(value)}
          onSearchChange={(val) => {
            setSearchQuery(val);
            if (!val) setCurrentPage(1);
          }}
          isFetching={isFetching}
          isBlocking={isBlocking}
          showBlockContact={true}
          onToggleBlockContact={handleBlockToggle}
          lastElementRef={lastUserElementRef}
        />
      </div>

      {/* Action Button */}
      {selectedUserId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-4 md:mt-6'>
          <Button
            onClick={handleStartChat}
            disabled={isCreatingChat}
            className='w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'>
            {isCreatingChat ? (
              <span className='flex items-center justify-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                Starting Chat...
              </span>
            ) : (
              'Start Chat'
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

const NewGroupList = ({ onClose }: { onClose: () => void }) => {
  const [_, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  const {
    data: contactsResponse,
    isFetching,
    isLoading,
  } = useGetMyContactsQuery({
    page: currentPage,
  });

  const [createNewGroupChat, { isLoading: isCreating }] = useCreateGroupChatMutation();
  const [toggleBlock, { isLoading: isBlocking }] = useToggleBlockContactMutation();

  const myContacts = useMemo(
    () => (contactsResponse?.data?.contacts || []) as any[],
    [contactsResponse?.data],
  );

  const hasMore = contactsResponse?.data?.pagination?.hasMore;

  const handleBlockToggle = async (contactRecordId: string) => {
    if (!contactRecordId) return;

    const contactRecord = myContacts?.find((c) => c.contact._id === contactRecordId);
    const isBlocked = contactRecord.isBlocked;

    if (
      !window.confirm(
        `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${contactRecord.contact.username}?`,
      )
    )
      return;

    try {
      const res = await toggleBlock(contactRecord._id).unwrap();
      toast.success(res.message || `User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update block status');
    }
  };

  const lastUserElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching || isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetching, isLoading, hasMore],
  );

  const selectOptions = useMemo(() => {
    return myContacts.map((item) => ({
      label: item.contact.username,
      value: item.contact._id,
      isBlocked: item.isBlocked,
      isContact: true,
    }));
  }, [myContacts]);

  const getUserById = (id: string) => {
    const contactUser = myContacts.find((c) => c.contact._id === id);
    if (contactUser) return { ...contactUser.contact, isContact: true };
    return undefined;
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || participants.length < 2) {
      toast.warning('Group name and at least 2 participants required');
      return;
    }

    try {
      await createNewGroupChat({ name: groupName, participants }).unwrap();
      toast.success('Group created successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create group');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className='p-4 md:p-6'>
      {/* Selected Participants */}
      <AnimatePresence>
        {participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='mb-4 md:mb-6 overflow-hidden'>
            <div className='rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 p-3 md:p-4 border border-violet-200 dark:border-violet-800/30'>
              <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 md:mb-3 flex items-center gap-2'>
                <UserGroupIcon className='h-4 w-4' />
                {participants.length} participant{participants.length !== 1 ? 's' : ''} selected
              </p>
              <div className='flex flex-wrap gap-1.5 md:gap-2'>
                {participants.map((id) => {
                  const user = getUserById(id);
                  return (
                    user && (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className='flex items-center gap-1.5 md:gap-2 bg-white dark:bg-gray-800 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium text-gray-900 dark:text-white shadow-sm'>
                        <div className='h-4 w-4 md:h-5 md:w-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[9px] md:text-[10px] font-bold uppercase'>
                          {user.username[0]}
                        </div>
                        <span className='max-w-[80px] md:max-w-none truncate'>{user.username}</span>
                        <button
                          onClick={() => setParticipants((prev) => prev.filter((p) => p !== id))}
                          className='hover:text-red-500 transition-colors'>
                          <XCircleIcon className='h-3.5 w-3.5 md:h-4 md:w-4' />
                        </button>
                      </motion.div>
                    )
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Name Input */}
      <div className='mb-3 md:mb-4'>
        <label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
          Group Name
        </label>
        <input
          type='text'
          placeholder='Enter group name...'
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className='w-full rounded-xl border-0 bg-gray-100 dark:bg-gray-800 py-2.5 md:py-3 px-3 md:px-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 transition-all'
        />
      </div>

      {/* Select Input for adding participants */}
      <div className='mb-4 md:mb-0'>
        <SelectModalInput
          placeholder='Search contacts to add...'
          options={selectOptions}
          value=''
          onChange={({ value }) =>
            setParticipants((prev) => (prev.includes(value) ? prev : [...prev, value]))
          }
          onSearchChange={(val) => {
            setSearchQuery(val);
            if (!val) setCurrentPage(1);
          }}
          isFetching={isFetching}
          isBlocking={isBlocking}
          showBlockContact={true}
          onToggleBlockContact={handleBlockToggle}
          lastElementRef={lastUserElementRef}
        />
      </div>

      {/* Action Button */}
      <div className='mt-4 md:mt-6'>
        <Button
          onClick={handleCreateGroupChat}
          disabled={isCreating || !groupName.trim() || participants.length < 2}
          className='w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'>
          {isCreating ? (
            <span className='flex items-center justify-center gap-2'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
              Creating Group...
            </span>
          ) : (
            `Create Group ${participants.length >= 2 ? `(${participants.length} members)` : ''}`
          )}
        </Button>
        {(!groupName.trim() || participants.length < 2) && (
          <p className='mt-2 md:mt-3 text-xs text-center text-gray-500 dark:text-gray-400'>
            {!groupName.trim() && 'Enter a group name'}
            {!groupName.trim() && participants.length < 2 && ' and '}
            {participants.length < 2 && 'select at least 2 participants'}
          </p>
        )}
      </div>
    </motion.div>
  );
};

type ContactCategoryType = 'friend' | 'family' | 'work' | 'other';

const DiscoverUsersList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<ContactCategoryType>('friend');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingContactId, setPendingContactId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data: availableUsersResponse,
    isFetching,
    isLoading,
  } = useGetAvailableUsersQuery({
    page: currentPage,
    search: debouncedSearch,
  });

  const [addToContact] = useAddToContactMutation();

  const hasMore = availableUsersResponse?.data?.pagination?.hasMore;

  const availableUsers = useMemo(
    () => (availableUsersResponse?.data?.users || []) as User[],
    [availableUsersResponse?.data?.users],
  );

  const lastUserElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching || isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetching, isLoading, hasMore],
  );

  const selectOptions = useMemo(() => {
    return availableUsers.map((u) => ({
      label: u.username,
      value: u._id,
      isContact: false,
    }));
  }, [availableUsers]);

  const handleAddToContactClick = (contactId: string) => {
    setPendingContactId(contactId);
    setShowCategoryModal(true);
  };

  const handleConfirmAddContact = async () => {
    if (!pendingContactId) return;

    try {
      await addToContact({ contactId: pendingContactId, category: selectedCategory }).unwrap();
      toast.success(`Added to ${selectedCategory} contacts!`);
      setShowCategoryModal(false);
      setPendingContactId(null);
      setSelectedCategory('friend');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add contact');
    }
  };

  const categories = [
    { value: 'friend' as const, label: 'Friend', icon: '👥', color: 'violet' },
    { value: 'family' as const, label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'pink' },
    { value: 'work' as const, label: 'Work', icon: '💼', color: 'blue' },
    { value: 'other' as const, label: 'Other', icon: '📋', color: 'gray' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className='p-4 md:p-6'>
      <SelectModalInput
        placeholder='Search for new people...'
        options={selectOptions}
        value=''
        onChange={() => {}}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        isFetching={isFetching}
        showAddToContact={true}
        onAddToContact={handleAddToContactClick}
        lastElementRef={lastUserElementRef}
      />

      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4'
            onClick={() => {
              setShowCategoryModal(false);
              setPendingContactId(null);
              setSelectedCategory('friend');
            }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Select Contact Category
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
                Choose how you want to categorize this contact
              </p>

              <div className='grid grid-cols-2 gap-3 mb-6'>
                {categories.map((cat) => (
                  <button
                    type='button'
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={classNames(
                      'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                      selectedCategory === cat.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    )}>
                    <span className='text-3xl mb-2'>{cat.icon}</span>
                    <span
                      className={classNames(
                        'text-sm font-medium',
                        selectedCategory === cat.value
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400',
                      )}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowCategoryModal(false);
                    setPendingContactId(null);
                    setSelectedCategory('friend');
                  }}
                  className='flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleConfirmAddContact}
                  className='flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg'>
                  Add Contact
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
