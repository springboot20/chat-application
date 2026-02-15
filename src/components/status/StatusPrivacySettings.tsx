import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  CheckIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useState, useCallback, useMemo, useRef } from 'react';
import { classNames } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useStatusStories } from '../../hooks/useStatusStories';
import { useGetMyContactsQuery } from '../../features/contacts/contact.api.slice';

type PrivacyOption = {
  value: 'all_contacts' | 'selected' | 'except';
  label: string;
  description: string;
  icon: any;
};

const privacyOptions: PrivacyOption[] = [
  {
    value: 'all_contacts',
    label: 'My Contacts',
    description: 'Only your contacts can view',
    icon: UserGroupIcon,
  },
  {
    value: 'selected',
    label: 'Only Share With...',
    description: 'Share with specific contacts',
    icon: UserPlusIcon,
  },
  {
    value: 'except',
    label: 'Share With All Except...',
    description: 'Hide from specific contacts',
    icon: UserMinusIcon,
  },
];

type StatusPrivacySettingsProps = {
  open: boolean;
  onClose: () => void;
};

export const StatusPrivacySettings: React.FC<StatusPrivacySettingsProps> = ({ open, onClose }) => {
  const { privacy, setPrivacy, selectedContacts, setSelectedContacts } = useStatusStories();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data: contactsResponse,
    isFetching,
    isLoading,
  } = useGetMyContactsQuery({
    page: currentPage,
  });

  const myContacts = useMemo(
    () => (contactsResponse?.data?.contacts || []) as any[],
    [contactsResponse?.data],
  );

  const hasMore = contactsResponse?.data?.pagination?.hasMore;

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return myContacts;
    return myContacts.filter((c) =>
      c.contact.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [myContacts, searchQuery]);

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

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const handleSelectAll = () => {
    const allContactIds = myContacts.map((c) => c.contact._id);
    setSelectedContacts(allContactIds);
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  // const getPrivacyLabel = () => {
  //   const option = privacyOptions.find((opt) => opt.value === privacy);
  //   if (!option) return 'My Contacts';

  //   if ((privacy === 'selected' || privacy === 'except') && selectedContacts.length > 0) {
  //     return `${option.label} (${selectedContacts.length})`;
  //   }
  //   return option.label;
  // };

  return (
    <Dialog open={open} onClose={onClose} className='relative z-[70]'>
      <Dialog.Backdrop className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50' />

      <div className='fixed inset-0 w-screen overflow-y-auto'>
        <div className='flex min-h-full items-center justify-center p-4'>
          <Dialog.Panel className='w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transition-all border border-gray-200 dark:border-gray-700'>
            {/* Header */}
            <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
              <Dialog.Title className='text-xl font-bold text-gray-900 dark:text-white'>
                Privacy Settings
              </Dialog.Title>
              <button
                type='button'
                onClick={onClose}
                className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'>
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>

            <div className='p-6 max-h-[600px] overflow-y-auto'>
              {/* Privacy Options */}
              <div className='space-y-3 mb-6'>
                {privacyOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = privacy === option.value;

                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setPrivacy(option.value)}
                      className={classNames(
                        'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      )}>
                      <div
                        className={classNames(
                          'rounded-full p-2 transition-colors',
                          isActive
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                        )}>
                        <Icon className='h-5 w-5' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-gray-900 dark:text-white'>
                          {option.label}
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {option.description}
                        </p>
                      </div>
                      {isActive && (
                        <CheckIcon className='h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0' />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Contact Selection (for 'selected' and 'except' options) */}
              <AnimatePresence>
                {(privacy === 'selected' || privacy === 'except') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}>
                    <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='font-semibold text-gray-900 dark:text-white'>
                          {privacy === 'selected' ? 'Share with' : 'Hide from'} (
                          {selectedContacts.length}/{myContacts.length})
                        </h3>
                        <div className='flex gap-2'>
                          <button
                            type='button'
                            onClick={handleSelectAll}
                            className='text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline'>
                            Select All
                          </button>
                          <span className='text-gray-400'>|</span>
                          <button
                            type='button'
                            onClick={handleDeselectAll}
                            className='text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline'>
                            Deselect All
                          </button>
                        </div>
                      </div>

                      {/* Search */}
                      <div className='mb-4'>
                        <input
                          type='text'
                          placeholder='Search contacts...'
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className='w-full rounded-xl border-0 bg-gray-100 dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all'
                        />
                      </div>

                      {/* Contacts List */}
                      <div className='space-y-2 max-h-[300px] overflow-y-auto'>
                        {isLoading && currentPage === 1 ? (
                          <div className='flex items-center justify-center py-12'>
                            <div className='h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent'></div>
                          </div>
                        ) : filteredContacts.length === 0 ? (
                          <div className='text-center py-12'>
                            <UserGroupIcon className='mx-auto h-12 w-12 text-gray-400' />
                            <p className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                              {searchQuery ? 'No contacts found' : 'No contacts available'}
                            </p>
                          </div>
                        ) : (
                          filteredContacts.map((contact, index) => {
                            const isLast = index === filteredContacts.length - 1;
                            const isSelected = selectedContacts.includes(contact.contact._id);

                            return (
                              <div
                                key={contact._id}
                                ref={isLast ? lastUserElementRef : null}
                                onClick={() => handleToggleContact(contact.contact._id)}
                                className={classNames(
                                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                                  isSelected
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                                )}>
                                <div className='h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm uppercase'>
                                  {contact.contact.username[0]}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                    {contact.contact.username}
                                  </p>
                                  <p className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                                    {contact.category}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckIcon className='h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0' />
                                )}
                              </div>
                            );
                          })
                        )}
                        {isFetching && currentPage > 1 && (
                          <div className='flex justify-center py-4'>
                            <div className='h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent'></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                type='button'
                onClick={onClose}
                className='w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all'>
                Done
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

// Privacy display component to show in creation UI
export const StatusPrivacyDisplay: React.FC<{
  onOpenSettings: () => void;
}> = ({ onOpenSettings }) => {
  const { privacy, selectedContacts } = useStatusStories();

  const getPrivacyLabel = () => {
    const option = privacyOptions.find((opt) => opt.value === privacy);
    if (!option) return 'My Contacts';

    if ((privacy === 'selected' || privacy === 'except') && selectedContacts.length > 0) {
      return `${option.label} (${selectedContacts.length})`;
    }
    return option.label;
  };

  const getPrivacyIcon = () => {
    const option = privacyOptions.find((opt) => opt.value === privacy);
    return option?.icon || UserGroupIcon;
  };

  const Icon = getPrivacyIcon();

  return (
    <button
      onClick={onOpenSettings}
      type='button'
      className='w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all'>
      <div className='flex items-center gap-3'>
        <Icon className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
        <div className='text-left'>
          <p className='text-sm font-medium text-gray-900 dark:text-white'>{getPrivacyLabel()}</p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>Who can view this status</p>
        </div>
      </div>
      <span className='text-gray-400'>
        <ChevronRightIcon className='size-4' />
      </span>
    </button>
  );
};
