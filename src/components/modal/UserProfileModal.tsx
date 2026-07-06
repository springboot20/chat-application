import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";
import {
  UserPlusIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  NoSymbolIcon,
  PhotoIcon,
  PowerIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  useAddToContactMutation,
  useGetMyContactsQuery,
  useToggleBlockContactMutation,
} from "../../features/contacts/contact.api.slice";
import { User } from "../../types/auth";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../redux/redux.hooks";
import {
  useCreateUserChatMutation,
  useGetChatMessagesQuery,
} from "../../features/chats/chat.slice";
import {
  AuthApiSlice,
  useUploadAvatarMutation,
} from "../../features/auth/auth.slice";
import { useChat } from "../../hooks/useChat";
import { setCurrentChat } from "../../features/chats/chat.reducer";
import { ChatListItemInterface, ChatMessageInterface } from "../../types/chat";
import { classNames } from "../../utils";
import { useMemo } from "react";
import { AttachmentItem } from "../shared/AttachmentItem";
import { InfoRow } from "../shared/InfoRow";

type UserProfileModalProps = {
  open: boolean;
  onClose: () => void;
  user: Partial<User> | null;
  onLogout?: () => void;
};

export const UserProfileModal = ({
  open,
  onClose,
  user,
  onLogout,
}: UserProfileModalProps) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { chatsWithMeta } = useChat();

  const [addToContact, { isLoading: isAdding }] = useAddToContactMutation();
  const [createChat, { isLoading: isCreatingChat }] =
    useCreateUserChatMutation();
  const [toggleBlock, { isLoading: isBlocking }] =
    useToggleBlockContactMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] =
    useUploadAvatarMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contactsResponse } = useGetMyContactsQuery({
    page: 1,
    limit: 1000,
  });
  const myContacts = contactsResponse?.data?.contacts || [];

  const existingChatId = useMemo(() => {
    if (!user?._id) return null;
    const chat = chatsWithMeta.find(
      (c: ChatListItemInterface) =>
        !c.isGroupChat && c.participants.some((p) => p._id === user._id),
    );
    return chat?._id;
  }, [chatsWithMeta, user?._id]);

  const { data: messagesResponse } = useGetChatMessagesQuery(
    existingChatId || "",
    {
      skip: !existingChatId || !open,
    },
  );

  const sharedMedia = useMemo(() => {
    if (!messagesResponse?.data) return [];
    const messages = messagesResponse.data.messages as ChatMessageInterface[];
    return messages
      ?.filter((m) => m.attachments && m.attachments.length > 0)
      ?.flatMap((m) => m.attachments)
      ?.filter((a) => a.url);
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
      toast.success(res.message || "Contact added successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add contact");
    }
  };

  const handleBlockToggle = async () => {
    if (!contactRecord?._id) return;
    if (
      !window.confirm(
        `Are you sure you want to ${isBlocked ? "unblock" : "block"} ${user.username}?`,
      )
    )
      return;
    try {
      const res = await toggleBlock(contactRecord._id).unwrap();
      toast.success(
        res.message ||
          `User ${isBlocked ? "unblocked" : "blocked"} successfully`,
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update block status");
    }
  };

  const handleSendMessage = async () => {
    if (!user._id) return;
    try {
      const res = await createChat(user._id).unwrap();
      const chatId = res.data?._id;
      const currentChat = chatsWithMeta?.find(
        (chat: ChatListItemInterface) => chat._id.toString() === String(chatId),
      );
      dispatch(setCurrentChat({ chat: currentChat }));
      onClose();
      toast.success("Chat created/retrieved!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to start chat");
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validExtensions = [".png", ".jpeg", ".jpg", ".svg"];
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!validExtensions.includes(fileExt)) {
      toast.error("Invalid file extension. Please use PNG, JPEG, or SVG.");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await uploadAvatar(formData).unwrap();
      toast.success(res.message || "Avatar updated successfully");
      dispatch(AuthApiSlice.endpoints.getCurrentUser.initiate()).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update avatar");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#111] shadow-xl border-l dark:border-zinc-800">
                    {/* Header — matches WhatsApp: X + title left, pencil right (only for self) */}
                    <div className="flex items-center justify-between px-4 py-4 sm:px-6 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                          {isMe ? "Profile" : "Contact info"}
                        </Dialog.Title>
                      </div>
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {/* Avatar + Name block */}
                    <div className="flex flex-col items-center px-6 pt-8 pb-6">
                      <div
                        className={classNames(
                          "relative group",
                          isMe && "cursor-pointer",
                        )}
                        onClick={() => isMe && fileInputRef.current?.click()}
                      >
                        {user.avatar?.url ? (
                          <img
                            src={user.avatar.url}
                            alt={user.username}
                            className="h-32 w-32 rounded-full object-cover ring-4 ring-white dark:ring-zinc-800"
                          />
                        ) : (
                          <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center ring-4 ring-white dark:ring-zinc-800">
                            <UserIcon className="h-14 w-14 text-gray-400" />
                          </div>
                        )}
                        {isMe && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/40">
                            <PhotoIcon className="h-8 w-8 text-white" />
                          </div>
                        )}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {isMe && (
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".png,.jpeg,.jpg,.svg"
                            onChange={handleAvatarChange}
                          />
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {user.username || "Unknown User"}
                        </h2>
                        {user.isEmailVerified && (
                          <CheckBadgeIcon
                            className="h-5 w-5 text-indigo-500"
                            title="Verified"
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {user.email}
                      </p>
                      {user.about && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-3 text-center">
                          "{user.about}"
                        </p>
                      )}

                      {/* ✅ Search-in-chat circular button, like WhatsApp */}
                      {!isMe && existingChatId && (
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          title="Search in conversation"
                          className="mt-5 flex flex-col items-center gap-1.5 text-indigo-600 dark:text-indigo-400"
                        >
                          <span className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                          </span>
                          <span className="text-xs font-medium">Search</span>
                        </button>
                      )}
                    </div>

                    {/* Primary actions — non-contact / non-chat states */}
                    {!isMe && (!isContact || !existingChatId) && (
                      <div className="flex flex-wrap justify-center gap-3 px-6 pb-4">
                        {!isContact && (
                          <button
                            type="button"
                            onClick={handleAddContact}
                            disabled={isAdding}
                            className="inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                          >
                            <UserPlusIcon className="h-4 w-4" />
                            {isAdding ? "Adding..." : "Add Contact"}
                          </button>
                        )}
                        {!existingChatId && (
                          <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={isCreatingChat}
                            className="inline-flex justify-center items-center gap-2 rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            Message
                          </button>
                        )}
                      </div>
                    )}

                    {/* Media, links and docs — WhatsApp style */}
                    {!isMe && (
                      <div className="border-t dark:border-zinc-800">
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
                            <PhotoIcon className="h-5 w-5 text-gray-500" />
                            Media, links and docs
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            {sharedMedia.length}
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </span>
                        </div>

                        {sharedMedia.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1 px-4 pb-4">
                            {sharedMedia.slice(0, 6).map((file, idx) => (
                              <AttachmentItem
                                key={file._id || idx}
                                file={file}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-600">
                            <PhotoIcon className="h-10 w-10 mb-1 opacity-20" />
                            <p className="text-xs">No shared media yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* List rows */}
                    <div className="border-t dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                      {!isMe && isContact && (
                        <InfoRow
                          icon={<NoSymbolIcon className="h-5 w-5" />}
                          label={isBlocked ? "Unblock" : "Block"}
                          sublabel={isBlocking ? "Updating..." : undefined}
                          onClick={handleBlockToggle}
                          danger
                        />
                      )}
                      {isMe && onLogout && (
                        <InfoRow
                          icon={<PowerIcon className="h-5 w-5" />}
                          label="Log Out"
                          onClick={onLogout}
                          danger
                        />
                      )}
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
