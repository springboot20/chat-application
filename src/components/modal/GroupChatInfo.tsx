import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React, { Fragment, useState } from "react";
import {
  useGetAvailableUsersQuery,
  useGetGroupChatQuery,
  useUpdateGroupChatDetailsMutation,
} from "../../features/chats/chat.slice";
import { useAppDispatch, useAppSelector } from "../../redux/redux.hooks";
import { ChatListItemInterface } from "../../types/chat";
import { RootState } from "../../app/store";
import { User } from "../../types/auth";
import { toast } from "react-toastify";
import { setCurrentChat } from "../../features/chats/chat.reducer";

type GroupInfoProps = {
  open: boolean;
  handleClose: () => void;
};

export const GroupChatInfo: React.FC<GroupInfoProps> = ({ open, handleClose }) => {
  const [updateGroupChatDetails] = useUpdateGroupChatDetailsMutation();
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [renamingName, setRenamingName] = useState<boolean>(false);
  const [participantToBeAdded, setParticipantToBeAdded] = useState<string>("");

  const dispatch = useAppDispatch();
  const { currentChat } = useAppSelector((state: RootState) => state.chat);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const { data: response, refetch: refetchGroupChatDetails } = useGetGroupChatQuery(
    currentChat?._id!,
    {
      skip: !currentChat?.isGroupChat,
    }
  );
  const { data: usersResponse, refetch: refetchUsers } = useGetAvailableUsersQuery();

  const groupChatDetails = response?.data as ChatListItemInterface;
  const availableUsers = usersResponse?.data as User[];

  console.log(availableUsers);

  console.log(groupChatDetails);

  const handleGroupChatUpdate = async () => {
    if (!newGroupName) toast("Group name is required", { type: "info" });

    try {
      const response = await updateGroupChatDetails({
        chatId: currentChat?._id!,
        name: newGroupName,
      }).unwrap();

      setNewGroupName(response?.data?.name);
      refetchGroupChatDetails();
      refetchUsers();
      setRenamingName(false);

      toast(response?.message, { type: "success" });
    } catch (error: any) {
      toast(error?.data?.message, { type: "error" });
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          handleClose();
          dispatch(setCurrentChat({ chat: null }));
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/70 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white border-l border-zinc-300">
                    <div className="flex items-start justify-between">
                      <div className="ml-2 mt-2 flex h-7 w-7 items-center justify-center">
                        <button
                          type="button"
                          title="close panel"
                          className="relative rounded-md text-zinc-400 hover:text-zinc-500 focus:outline-none"
                          onClick={handleClose}
                        >
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <div className="flex flex-col justify-center items-start">
                        <div className="flex pl-16 justify-center items-center relative w-full h-max gap-3">
                          {groupChatDetails?.participants.slice(0, 3).map((p) => {
                            return (
                              <img
                                className="w-24 h-24 -ml-16 rounded-full outline outline-4 outline-zinc-300"
                                key={p?._id}
                                src={p?.avatar?.url}
                                alt="avatar"
                              />
                            );
                          })}
                          {groupChatDetails?.participants &&
                          groupChatDetails?.participants.length > 3 ? (
                            <p>+{groupChatDetails?.participants.length}</p>
                          ) : null}
                        </div>

                        <div className="w-full flex flex-col justify-center items-center text-center">
                          {renamingName ? (
                            <div className="w-full flex justify-center items-center mt-5 gap-2">
                              <input
                                placeholder="Enter new group name..."
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                              />
                              <button title="save group name" onClick={handleGroupChatUpdate}>
                                Save
                              </button>

                              <button
                                title="cancle renaming name"
                                onClick={() => setRenamingName(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="w-full inline-flex justify-center items-center text-center mt-5">
                              <h1 className="text-2xl font-semibold truncate-1">
                                {groupChatDetails?.name}
                              </h1>
                              {groupChatDetails?.admin === user?._id ? (
                                <button onClick={() => setRenamingName(true)}>
                                  <PencilIcon className="w-5 h-5 ml-4" />
                                </button>
                              ) : null}
                            </div>
                          )}

                          <p className="mt-2 text-zinc-400 text-sm">
                            Group · {groupChatDetails?.participants.length} participants
                          </p>
                        </div>
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
