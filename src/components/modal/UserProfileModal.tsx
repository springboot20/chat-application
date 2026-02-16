import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UserPlusIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  NoSymbolIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import {
  useAddToContactMutation,
  useGetMyContactsQuery,
  useToggleBlockContactMutation,
} from '../../features/contacts/contact.api.slice';
import { User } from '../../types/auth'; // Or adapt to the interface you have
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import {
  useCreateUserChatMutation,
  useGetChatMessagesQuery,
} from '../../features/chats/chat.slice';
import { useChat } from '../../hooks/useChat';
import { setCurrentChat } from '../../features/chats/chat.reducer';
import { ChatListItemInterface, ChatMessageInterface } from '../../types/chat';
import { classNames } from '../../utils';
import { useMemo } from 'react';
import { AttachmentItem } from '../shared/AttachmentItem';

type UserProfileModalProps = {
  open: boolean;
  onClose: () => void;
  user: Partial<User> | null; // Allow partial user data since sometimes we only have ID/Username
};

export const UserProfileModal = ({ open, onClose, user }: UserProfileModalProps) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { chatsWithMeta } = useChat();

  const [addToContact, { isLoading: isAdding }] = useAddToContactMutation();
  const [createChat, { isLoading: isCreatingChat }] = useCreateUserChatMutation();
  const [toggleBlock, { isLoading: isBlocking }] = useToggleBlockContactMutation();

  const { data: contactsResponse } = useGetMyContactsQuery({ page: 1, limit: 1000 });
  const myContacts = contactsResponse?.data?.contacts || [];

  // Find 1:1 Chat ID with this user to fetch shared media
  const existingChatId = useMemo(() => {
    if (!user?._id) return null;

    const chat = chatsWithMeta.find(
      (c: ChatListItemInterface) =>
        !c.isGroupChat && c.participants.some((p) => p._id === user._id),
    );
    return chat?._id;
  }, [chatsWithMeta, user?._id]);

  // Fetch messages if chat exists
  const { data: messagesResponse } = useGetChatMessagesQuery(existingChatId || '', {
    skip: !existingChatId || !open,
  });

  const sharedMedia = useMemo(() => {
    if (!messagesResponse?.data) return [];
    const messages = messagesResponse.data.messages as ChatMessageInterface[];

    return messages
      ?.filter((m) => m.attachments && m.attachments.length > 0)
      ?.flatMap((m) => m.attachments)
      ?.filter((a) => a.url); // Ensure valid URL
  }, [messagesResponse]);

  if (!user) return null;

  const isMe = currentUser?._id === user._id;
  const contactRecord = myContacts.find((c) => c.contact._id === user._id);
  const isContact = !!contactRecord;
  const isBlocked = contactRecord?.isBlocked || false;

  const handleAddContact = async () => {
    if (!user._id) return;
    try {
      const res = await addToContact({ contactId: user._id }).unwrap();
      toast.success(res.message || 'Contact added successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add contact');
    }
  };

  const handleBlockToggle = async () => {
    if (!contactRecord?._id) return;
    if (
      !window.confirm(
        `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${user.username}?`,
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

  const handleSendMessage = async () => {
    if (!user._id) return;
    try {
      const res = await createChat(user._id).unwrap();
      // Assuming res.data is the chat object or has _id
      const chatId = res.data?._id; // Adjust based on actual API response structure

      const currentChat = chatsWithMeta?.find(
        (chat: ChatListItemInterface) => chat._id.toString() === String(chatId),
      );
      dispatch(setCurrentChat({ chat: currentChat }));

      onClose();
      toast.success('Chat created/retrieved!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as='div' className='relative z-[100]' onClose={onClose}>
        <div className='fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity' />

        <div className='fixed inset-0 z-10 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center sm:p-0'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'>
              <Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white dark:bg-[#111] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border dark:border-zinc-800 flex flex-col max-h-[90vh]'>
                <div className='absolute right-0 top-0 hidden pr-4 pt-4 sm:block z-10'>
                  <button
                    type='button'
                    className='rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none'
                    onClick={onClose}>
                    <span className='sr-only'>Close</span>
                    <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                  </button>
                </div>

                <div className='px-4 pb-4 pt-5 sm:p-6 sm:pb-4'>
                  <div className='flex flex-col items-center justify-center text-center'>
                    <div className='relative'>
                      {user.avatar?.url ? (
                        <img
                          src={user.avatar.url}
                          alt={user.username}
                          className='h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-zinc-800'
                        />
                      ) : (
                        <div className='h-24 w-24 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center ring-4 ring-white dark:ring-zinc-800'>
                          <UserIcon className='h-12 w-12 text-gray-400' />
                        </div>
                      )}
                    </div>

                    <div className='mt-4'>
                      <Dialog.Title
                        as='h3'
                        className='text-xl font-semibold leading-6 text-gray-900 dark:text-white'>
                        {user.username || 'Unknown User'}
                      </Dialog.Title>
                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className='my-6 flex flex-wrap justify-center gap-3 w-full'>
                  {!isMe && !isContact && (
                    <button
                      type='button'
                      className='inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors'
                      onClick={handleAddContact}
                      disabled={isAdding}>
                      <UserPlusIcon className='h-4 w-4' />
                      {isAdding ? 'Adding...' : 'Add Contact'}
                    </button>
                  )}

                  {!isMe && isContact && (
                    <div className='inline-flex justify-center items-center gap-2 rounded-md bg-green-100 dark:bg-green-900/30 px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 cursor-default'>
                      <span>In Contacts</span>
                    </div>
                  )}

                  {!isMe && (
                    <button
                      type='button'
                      onClick={handleSendMessage}
                      disabled={isCreatingChat}
                      className='inline-flex justify-center items-center gap-2 rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors'>
                      <ChatBubbleLeftRightIcon className='h-4 w-4' />
                      Message
                    </button>
                  )}

                  {!isMe && isContact && (
                    <button
                      type='button'
                      onClick={handleBlockToggle}
                      disabled={isBlocking}
                      className={classNames(
                        'inline-flex justify-center items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors',
                        isBlocked
                          ? 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900'
                          : 'bg-white text-red-600 ring-red-200 hover:bg-red-50 dark:bg-transparent dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-900/10',
                      )}>
                      <NoSymbolIcon className='h-4 w-4' />
                      {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>

                {/* Shared Media Section */}
                {!isMe && (
                  <div className='flex-1 overflow-y-auto px-4 pb-4 sm:px-6 border-t dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30'>
                    <div className='pt-4'>
                      <h4 className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-3'>
                        <PhotoIcon className='h-4 w-4 text-gray-500' />
                        Shared Media
                        <span className='ml-auto text-xs text-gray-400 font-normal'>
                          {sharedMedia.length} files
                        </span>
                      </h4>

                      {sharedMedia.length > 0 ? (
                        <div className='grid grid-cols-3 gap-2'>
                          {sharedMedia.map((file, idx) => (
                            <AttachmentItem key={file._id || idx} file={file} />
                          ))}
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600'>
                          <PhotoIcon className='h-12 w-12 mb-2 opacity-20' />
                          <p className='text-xs'>No shared media yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
