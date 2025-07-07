import React, { Fragment, useEffect, useState } from "react";
import { Button } from "../buttons/Buttons";
import { Dialog, Switch, Transition } from "@headlessui/react";
import { UserGroupIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SelectModalInput } from "./Select";
import { classNames } from "../../utils";
import { toast } from "react-toastify";
import {
  useCreateGroupChatMutation,
  useCreateUserChatMutation,
  useGetAvailableUsersQuery,
} from "../../features/chats/chat.slice";
import { User } from "../../types/auth";

export const ChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, open, onSuccess }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
  const [createNewGroupChat] = useCreateGroupChatMutation();

  const { data: availableUsers, refetch: refetchUsers } = useGetAvailableUsersQuery();
  const [_createNewChat] = useCreateUserChatMutation();
  const users = availableUsers?.data as User[];

  const createNewChat = async () => {
    if (!userId) return toast.error("Plase select a user");

    setCreatingChat(true);

    try {
      const response = await _createNewChat(userId).unwrap();
      const { message } = response;
      toast(message, { type: "success" });

      onSuccess();
      handleClose();
    } catch (error: any) {
      const { message } = error.data;
      toast(message, { type: "error" });
      handleClose();
    } finally {
      setCreatingChat(false);
    }
  };

  const _createNewGroupChat = async () => {
    if (!groupName) {
      toast.warning("Group name is required");
      return;
    }

    if (!participants?.length || participants?.length < 2) {
      toast.warning("There must be at least 2 group participant");
      return;
    }

    const values = { name: groupName, participants };

    try {
      const response = await createNewGroupChat(values).unwrap();
      const { message } = response;
      toast(message, { type: "success" });
      handleClose();
    } catch (error: any) {
      const { message } = error.data;

      toast(message, { type: "error" });
    }
  };

  const handleClose = () => {
    setGroupName("");
    setParticipants([]);
    setUserId(null);
    setIsGroupChat(false);
    onClose();
  };

  useEffect(() => {
    if (open && !users?.length) refetchUsers();
  }, [open, refetchUsers, users]);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => handleClose()}>
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

          <div className="fixed inset-0 z-10 overflow-y-visible">
            <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className="relative transform overflow-x-hidden rounded-lg bg-white dark:bg-black dark:border dark:border-white/10 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-full sm:max-w-xl sm:p-6 h-full"
                  style={{
                    overflow: "inherit",
                  }}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <Dialog.Title
                        as="h3"
                        className="text-2xl font-medium leading-6 text-gray-900 dark:text-white"
                      >
                        Create Chat
                      </Dialog.Title>
                      <button
                        type="button"
                        className="bg-gray-300 hover:text-zinc-600 dark:bg-white/5 rounded-full dark:border dark:border-white/10 p-2 flex justify-center items-center"
                        onClick={() => handleClose()}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon
                          strokeWidth={2.5}
                          className="h-6 w-6 text-gray-800 dark:text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                  <Switch.Group as="div" className="flex items-center my-5">
                    <Switch
                      checked={isGroupChat}
                      onChange={setIsGroupChat}
                      className={classNames(
                        isGroupChat ? "bg-gray-200" : "bg-gray-100",
                        "relative outline outline-[1px] dark:bg-black dark:outline-white/10 outline-white inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-0"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          isGroupChat ? "translate-x-5 bg-white" : "translate-x-0 bg-white",
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow dark:bg-white/50 ring-0 transition duration-200 ease-in-out"
                        )}
                      />
                    </Switch>
                    <Switch.Label as="span" className="ml-3 text-sm">
                      <span
                        className={classNames(
                          "font-medium text-white",
                          isGroupChat ? "" : "opacity-40"
                        )}
                      >
                        Is it a group chat?
                      </span>{" "}
                    </Switch.Label>
                  </Switch.Group>

                  {isGroupChat ? (
                    <div className="my-5">
                      <input
                        className="block w-full rounded-xl outline outline-[1px] outline-zinc-400 dark:bg-black dark:outline-white/10 dark:text-white dark:placeholder:text-white/60 border-0 py-4 px-5"
                        placeholder="Enter a group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                  ) : null}

                  <div className="my-5">
                    <SelectModalInput
                      placeholder={
                        isGroupChat ? "Select group particaipans" : "Select a user to chat..."
                      }
                      value={isGroupChat ? "" : userId || ""}
                      options={users?.map((user) => {
                        return {
                          label: user.username,
                          value: user._id,
                        };
                      })}
                      onChange={({ value }) => {
                        if (isGroupChat) {
                          // if user is creating a group chat track the participants in an array
                          setParticipants((prev) =>
                            prev.includes(value) ? prev : [...prev, value]
                          );
                        } else {
                          // if user is creating normal chat just get a single user
                          setUserId(value);
                        }
                      }}
                    />
                  </div>
                  {isGroupChat ? (
                    <div className="my-5">
                      <span
                        className={classNames(
                          "font-medium text-gray-500 dark:text-white inline-flex items-center"
                        )}
                      >
                        <UserGroupIcon className="h-5 w-5 mr-2" /> Selected participants
                      </span>{" "}
                      <div className="flex justify-start items-center flex-wrap gap-2 mt-3">
                        {users
                          ?.filter((user) => participants.includes(user._id))
                          ?.map((participant) => {
                            return (
                              <div
                                className="inline-flex bg-secondary rounded-full p-2 border-[1px] border-zinc-400 items-center gap-2"
                                key={participant._id}
                              >
                                {/* <img
                                  className="h-6 w-6 rounded-full object-cover"
                                  src={participant.avatar.url}
                                /> */}
                                <p className="text-gray-500">{participant.username}</p>
                                <XCircleIcon
                                  role="button"
                                  className="w-6 h-6 hover:text-gray-600 text-gray-700 cursor-pointer"
                                  onClick={() => {
                                    setParticipants(
                                      participants.filter((p) => p !== participant._id)
                                    );
                                  }}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-5 flex justify-between items-center gap-4">
                    <Button
                      disabled={creatingChat}
                      onClick={handleClose}
                      className="w-[40%] bg-black/40 dark:bg-white/5 dark:hover:bg-white/10 text-white text-xl font-semibold rounded-lg"
                    >
                      Close
                    </Button>
                    <Button
                      disabled={creatingChat}
                      onClick={isGroupChat ? _createNewGroupChat : createNewChat}
                      className="w-[40%] bg-violet-500 text-white text-xl font-semibold rounded-lg"
                    >
                      Create
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
