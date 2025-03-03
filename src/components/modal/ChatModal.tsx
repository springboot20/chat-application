import React, { Fragment, useEffect, useState } from "react";
import { Button } from "../buttons/Buttons";
import { Dialog, Switch, Transition } from "@headlessui/react";
import { UserGroupIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SelectModalInput } from "./Select";
import { ChatListItemInterface } from "../../types/chat";
import { UserType } from "../../types/user";
import { classNames, requestHandler } from "../../utils";
import { createChat, createGroupChat, getAvailableUser } from "../../api";
import { toast } from "react-toastify";

export const ChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: (chat: ChatListItemInterface) => void;
}> = ({ onClose, open, onSuccess }) => {
  const [userId, setUserId] = useState<string>();
  const [creatingChat, setCreatingChat] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [users, setUsers] = useState<UserType[] | undefined>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);

  const getAllUsers = () => {
    requestHandler({
      api: async () => await getAvailableUser(),
      setLoading: null,
      onSuccess: (res) => {
        const { data } = res;

        setUsers(data || []);
      },
      onError(error, toast) {
        toast(error);
      },
    });
  };

  const createNewChat = () => {
    if (!userId) return toast.error("Plase select a user");

    requestHandler({
      api: async () => await createChat(userId),
      setLoading: setCreatingChat,
      onSuccess: (res) => {
        if (res.statusCode === 200) {
          toast.warning("Chat with selected user already exists");
          return;
        }

        onSuccess(res.data);
        handleClose();
      },
      onError(error, toast) {
        toast(error);
      },
    });
  };

  const createNewGroupChat = () => {
    if (!groupName) return toast.warning("Group name is required");
    if (!participants.length || participants.length < 2)
      return toast.warning("There must be at least 2 group participant");

    requestHandler({
      api: async () => await createGroupChat({ name: groupName, participants }),
      setLoading: setCreatingChat,
      onSuccess: (res) => {
        onSuccess(res.data);
        handleClose();
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const handleClose = () => {
    setUsers([]);
    setGroupName("");
    setParticipants([]);
    setUserId("");
    setIsGroupChat(false);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    getAllUsers();
  }, [open]);

  console.log(users);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
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
                  className="relative transform overflow-x-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6 h-full"
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
                        className="bg-gray-300 hover:text-zinc-600 rounded-full p-2 flex justify-center items-center"
                        onClick={() => handleClose()}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon
                          strokeWidth={2.5}
                          className="h-6 w-6 text-gray-800"
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
                        "relative outline outline-[1px] outline-white inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-0"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          isGroupChat ? "translate-x-5 bg-white" : "translate-x-0 bg-white",
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
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
                        className="block w-full rounded-xl outline outline-[1px] outline-zinc-400 border-0 py-4 px-5 bg-secondaryfont-light"
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
                        if (isGroupChat && !participants.includes(value)) {
                          // if user is creating a group chat track the participants in an array
                          setParticipants([...participants, value]);
                        } else {
                          setUserId(value);
                          // if user is creating normal chat just get a single user
                        }
                      }}
                    />
                  </div>
                  {isGroupChat ? (
                    <div className="my-5">
                      <span
                        className={classNames("font-medium text-white inline-flex items-center")}
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
                                <img
                                  className="h-6 w-6 rounded-full object-cover"
                                  src={participant.avatar.url}
                                />
                                <p className="text-white">{participant.username}</p>
                                <XCircleIcon
                                  role="button"
                                  className="w-6 h-6 hover:text-primary cursor-pointer"
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
                      className="w-[40%] bg-black/40 text-white text-xl font-semibold rounded-lg"
                    >
                      Close
                    </Button>
                    <Button
                      disabled={creatingChat}
                      onClick={isGroupChat ? createNewGroupChat : createNewChat}
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
