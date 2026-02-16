import { Dialog, Transition } from '@headlessui/react';
import {
  PencilIcon,
  XMarkIcon,
  UserPlusIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  UserMinusIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import React, { Fragment, useCallback, useState, useEffect, useMemo } from 'react';
import {
  useGetGroupChatQuery,
  useUpdateGroupChatDetailsMutation,
  useAddParticipantToGroupChatMutation,
  useRemoveParticipantFromGroupChatMutation,
  useLeaveChatGroupMutation,
  useDeleteGroupChatDetailsMutation,
  useGetChatMessagesQuery,
} from '../../features/chats/chat.slice';
import { ChatListItemInterface, ChatMessageInterface } from '../../types/chat';
import { User } from '../../types/auth';
import { toast } from 'react-toastify';
import { useGetMyContactsQuery } from '../../features/contacts/contact.api.slice';
import { AttachmentItem } from '../shared/AttachmentItem';

type GroupInfoProps = {
  open: boolean;
  handleClose: () => void;
  refetchChats: () => void;
  user: User | null;
  currentChat: ChatListItemInterface;
};

export const GroupChatInfo: React.FC<GroupInfoProps> = ({
  open,
  handleClose,
  user,
  currentChat,
  refetchChats,
}) => {
  const [updateGroupChatDetails] = useUpdateGroupChatDetailsMutation();
  const [addParticipant] = useAddParticipantToGroupChatMutation();
  const [removeParticipant] = useRemoveParticipantFromGroupChatMutation();
  const [leaveGroup] = useLeaveChatGroupMutation();
  const [deleteGroup] = useDeleteGroupChatDetailsMutation();

  const [newGroupName, setNewGroupName] = useState<string>('');
  const [renamingName, setRenamingName] = useState<boolean>(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Group Details
  const { data: response, refetch: refetchGroupChatDetails } = useGetGroupChatQuery(
    currentChat?._id as string,
    {
      skip: !currentChat?.isGroupChat || !open,
    },
  );

  const groupChatDetails = (response?.data as ChatListItemInterface) || currentChat;

  // Fetch Group Messages for Shared Media
  const { data: messagesResponse } = useGetChatMessagesQuery(currentChat?._id || '', {
    skip: !currentChat?._id || !open,
  });

  const sharedMedia = useMemo(() => {
    if (!messagesResponse?.data) return [];
    const messages = messagesResponse.data.messages as ChatMessageInterface[];

    return messages
      ?.filter((m) => m.attachments && m.attachments.length > 0)
      ?.flatMap((m) => m.attachments)
      ?.filter((a) => a.url);
  }, [messagesResponse]);

  // Search for new participants

  const { data: myContactsResponse } = useGetMyContactsQuery({
    page: 1,
    limit: 100,
  });

  const myContacts = myContactsResponse?.data?.contacts || [];

  const isAdmin = groupChatDetails?.admin === user?._id;

  const handleGroupChatUpdate = async () => {
    if (!newGroupName) return toast.info('Group name is required');

    try {
      const res = await updateGroupChatDetails({
        chatId: currentChat?._id as string,
        name: newGroupName,
      }).unwrap();

      setNewGroupName(res?.data?.name);
      refetchGroupChatDetails();
      setRenamingName(false);
      refetchChats();
      toast.success(res?.message);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update group name');
    }
  };

  const handleAddParticipant = async (participantId: string) => {
    try {
      const res = await addParticipant({
        chatId: currentChat?._id,
        participantId,
      }).unwrap();
      refetchGroupChatDetails();
      toast.success(res?.message);
      setSearchQuery(''); // Clear search after adding
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const res = await removeParticipant({
        chatId: currentChat?._id,
        participantId,
      }).unwrap();
      refetchGroupChatDetails();
      toast.success(res?.message);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove participant');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await leaveGroup(currentChat?._id).unwrap();
      toast.success(res?.message);
      handleClose();
      refetchChats();
      window.location.reload(); // Simple reload to reset chat state/view
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.'))
      return;
    try {
      const res = await deleteGroup(currentChat?._id).unwrap();
      toast.success(res?.message);
      handleClose();
      refetchChats();
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete group');
    }
  };

  const handleSetRenaming = useCallback(() => {
    setRenamingName(true);
    setNewGroupName(groupChatDetails?.name || '');
  }, [groupChatDetails?.name]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setRenamingName(false);
      setIsAddingParticipant(false);
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={handleClose}>
        <div className='fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity' />

        <div className='fixed inset-0 overflow-hidden'>
          <div className='absolute inset-0 overflow-hidden'>
            <div className='pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16'>
              <Transition.Child
                as={Fragment}
                enter='transform transition ease-in-out duration-300 sm:duration-500'
                enterFrom='translate-x-full'
                enterTo='translate-x-0'
                leave='transform transition ease-in-out duration-300 sm:duration-500'
                leaveFrom='translate-x-0'
                leaveTo='translate-x-full'>
                <Dialog.Panel className='pointer-events-auto w-screen max-w-md'>
                  <div className='flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#111] shadow-xl border-l dark:border-zinc-800'>
                    {/* Header */}
                    <div className='px-4 py-6 sm:px-6 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50'>
                      <div className='flex items-start justify-between'>
                        <Dialog.Title className='text-lg font-semibold leading-6 text-gray-900 dark:text-white'>
                          Group Info
                        </Dialog.Title>
                        <div className='ml-3 flex h-7 items-center'>
                          <button
                            type='button'
                            className='rounded-md text-gray-400 hover:text-gray-500 focus:outline-none'
                            onClick={handleClose}>
                            <span className='sr-only'>Close panel</span>
                            <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                          </button>
                        </div>
                      </div>

                      {/* Avatar & Name */}
                      <div className='mt-6 flex flex-col items-center'>
                        <div className='flex -space-x-4 overflow-hidden mb-4'>
                          {groupChatDetails?.participants?.slice(0, 4).map((p) => (
                            <img
                              key={p._id}
                              className='inline-block h-16 w-16 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover'
                              src={p.avatar?.url}
                              alt={p.username}
                            />
                          ))}
                        </div>

                        {renamingName ? (
                          <div className='flex items-center gap-2 w-full max-w-xs transition-all'>
                            <input
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className='block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700'
                              placeholder='Group Name'
                            />
                            <button
                              onClick={handleGroupChatUpdate}
                              className='text-indigo-600 hover:text-indigo-500 text-sm font-semibold'>
                              Save
                            </button>
                            <button
                              onClick={() => setRenamingName(false)}
                              className='text-gray-500 hover:text-gray-400 text-sm'>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div
                            className='flex items-center gap-2 group cursor-pointer'
                            onClick={isAdmin ? handleSetRenaming : undefined}>
                            <h2 className='text-xl font-bold text-gray-900 dark:text-white text-center'>
                              {groupChatDetails?.name}
                            </h2>
                            {isAdmin && (
                              <PencilIcon className='h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity' />
                            )}
                          </div>
                        )}
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                          Group · {groupChatDetails?.participants?.length} participants
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='p-4 sm:p-6 space-y-6'>
                      {/* Add Participant Section */}
                      {isAdmin && (
                        <div>
                          <div className='flex items-center justify-between mb-2'>
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white'>
                              Participants
                            </h3>
                            <button
                              onClick={() => setIsAddingParticipant(!isAddingParticipant)}
                              className='flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 font-medium'>
                              <UserPlusIcon className='h-4 w-4' />
                              {isAddingParticipant ? 'Done' : 'Add Members'}
                            </button>
                          </div>

                          {isAddingParticipant && (
                            <div className='mb-4 space-y-3 bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg'>
                              <input
                                type='text'
                                placeholder='Search users to add...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700'
                              />
                              <div className='max-h-40 overflow-y-auto space-y-2'>
                                {myContacts.length > 0 ? (
                                  myContacts
                                    .filter(
                                      (u) =>
                                        !groupChatDetails?.participants?.find(
                                          (p) => p._id === u.contact._id,
                                        ),
                                    )
                                    .map(({ contact }) => (
                                      <div
                                        key={contact._id}
                                        className='flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer'
                                        onClick={() => handleAddParticipant(contact._id)}>
                                        <div className='flex items-center gap-2'>
                                          <img
                                            src={contact?.avatar?.url}
                                            className='h-8 w-8 rounded-full bg-gray-300'
                                            alt=''
                                          />
                                          <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                                            {contact?.username}
                                          </span>
                                        </div>
                                        <div className='px-2 py-1.5 flex items-center gap-x-1 bg-indigo-600 rounded-lg'>
                                          <span className='text-white font-nunito font-bold text-xs'>
                                            Add
                                          </span>
                                          <UserPlusIcon className='h-4 w-4 text-white' />
                                        </div>
                                      </div>
                                    ))
                                ) : searchQuery ? (
                                  <p className='text-xs text-center text-gray-500 py-2'>
                                    No users found
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Participant List */}
                      <ul className='divide-y divide-gray-100 dark:divide-zinc-800'>
                        {groupChatDetails?.participants?.map((participant) => (
                          <li
                            key={participant._id}
                            className='flex items-center justify-between py-3'>
                            <div className='flex items-center gap-3'>
                              <img
                                src={participant.avatar?.url}
                                alt=''
                                className='h-10 w-10 rounded-full bg-gray-300 object-cover'
                              />
                              <div>
                                <p className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2'>
                                  {participant.username}
                                  {participant._id === groupChatDetails.admin && (
                                    <span className='inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'>
                                      Admin
                                    </span>
                                  )}
                                  {participant._id === user?._id && (
                                    <span className='text-xs text-gray-500'>(You)</span>
                                  )}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                  {participant.email}
                                </p>
                              </div>
                            </div>
                            {isAdmin && participant._id !== user?._id && (
                              <button
                                onClick={() => handleRemoveParticipant(participant._id)}
                                title='Remove participant'
                                className='text-gray-400 hover:text-red-500 transition-colors p-1'>
                                <UserMinusIcon className='h-5 w-5' />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Shared Media Section */}
                      <div className='border-t dark:border-zinc-800 pt-6'>
                        <h4 className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-3'>
                          <PhotoIcon className='h-4 w-4 text-gray-500' />
                          Shared Media
                          <span className='ml-auto text-xs text-gray-400 font-normal'>
                            {sharedMedia.length} files
                          </span>
                        </h4>

                        {sharedMedia.length > 0 ? (
                          <div className='grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1'>
                            {sharedMedia.map((file, idx) => (
                              <AttachmentItem key={file._id || idx} file={file} />
                            ))}
                          </div>
                        ) : (
                          <div className='flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-zinc-900/50 rounded-lg'>
                            <PhotoIcon className='h-8 w-8 mb-2 opacity-20' />
                            <p className='text-xs'>No shared media yet</p>
                          </div>
                        )}
                      </div>

                      {/* Danger Zone */}
                      <div className='border-t dark:border-zinc-800 pt-6 space-y-3'>
                        <button
                          onClick={handleLeaveGroup}
                          className='w-full flex justify-center items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 dark:bg-transparent dark:ring-red-900 dark:hover:bg-red-900/20'>
                          <ArrowRightOnRectangleIcon className='h-4 w-4' />
                          Leave Group
                        </button>

                        {isAdmin && (
                          <button
                            onClick={handleDeleteGroup}
                            className='w-full flex justify-center items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500'>
                            <TrashIcon className='h-4 w-4' />
                            Delete Group
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
