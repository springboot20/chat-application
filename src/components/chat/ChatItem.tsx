import React, { Fragment, useState } from "react";
import { ChatListItemInterface } from "../../types/chat";
import { classNames, getMessageObjectMetaData } from "../../utils";
import {
  CheckCircleIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import { useAppDispatch, useAppSelector } from "../../redux/redux.hooks";
import { RootState } from "../../app/store";
import { useDeleteOneOneChatMessageMutation } from "../../features/chats/chat.slice";
import { toast } from "react-toastify";
import { Menu, Transition } from "@headlessui/react";
import { GroupChatInfo } from "../modal/GroupChatInfo";
import { setCurrentChat } from "../../features/chats/chat.reducer";

export const ChatItem: React.FC<{
  chat: ChatListItemInterface;
  onClick: (chat: ChatListItemInterface) => void;
  isActive?: boolean;
  unreadCount?: number;
  onChatDelete: (chatId: string) => void;
}> = ({ chat, onClick, unreadCount = 0, onChatDelete, isActive }) => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [openGroupInfo, setOpenGroupInfo] = useState(false);
  const [openOptions, setOpenOptions] = useState<{ [key: string]: boolean }>({});

  const dispatch = useAppDispatch();

  const toggleOptions = (id: string, evt: React.MouseEvent) => {
    evt.stopPropagation();

    console.log(openGroupInfo);

    setOpenOptions((prev) => {
      return {
        ...prev,
        [id]: !openOptions[id],
      };
    });
  };

  const [deleteOneOneChatMessage] = useDeleteOneOneChatMessageMutation();

  const deleteChat = async () => {
    await deleteOneOneChatMessage(chat?._id)
      .unwrap()
      .then((response) => {
        toast(response?.message, {
          type: "success",
        });
        onChatDelete(chat?._id);
      })
      .catch((error: any) => {
        toast(error?.data?.message, { type: "error" });
      });
  };

  return (
    <>
      <GroupChatInfo open={openGroupInfo} handleClose={() => setOpenGroupInfo(false)} />
      <div
        role="button"
        className={classNames(
          "hover:bg-gray-300/40 group flex items-start cursor-pointer bg-gray-100 px-1 py-2.5 justify-between dark:bg-white/5",
          isActive ? "bg-gray-300/40 border-[1.5px] border-zinc-300" : "",
          unreadCount > 0 ? "border-2 border-green-500 bg-green-100" : ""
        )}
        onClick={() => onClick(chat)}
        onMouseLeave={(e) => toggleOptions(chat?._id, e)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <Menu as="div" className="relative">
              <div>
                <Menu.Button
                  onClick={(e) => {
                    toggleOptions(chat?._id, e);
                  }}
                  className="flex dark:text-white text-gray-900"
                >
                  <span className="sr-only">Open auth menu</span>
                  <EllipsisVerticalIcon className="h-6 group-hover:w-6 group-hover:opacity-100 w-0 opacity-0 transition-all ease-in-out duration-100 text-gray-600 dark:text-white" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-5 z-40 mt-8 w-max origin-top-right rounded-md bg-white dark:bg-black/50 dark:ring-white/10 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {openOptions && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          title="mark as read"
                          className={classNames(
                            active ? "bg-gray-100 dark:bg-white/5" : "",
                            "flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800 font-medium dark:text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptions((prev) => ({ ...prev, [chat?._id]: false }));
                          }}
                          role="button"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Mark as read
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {chat.isGroupChat ? (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          title="check group info"
                          className={classNames(
                            active ? "bg-gray-100 dark:bg-white/5" : "",
                            "flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800 font-medium dark:text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenGroupInfo(true);

                            dispatch(setCurrentChat({ chat }));
                          }}
                          role="button"
                        >
                          <InformationCircleIcon className="h-4 w-4 mr-2" /> About group
                        </button>
                      )}
                    </Menu.Item>
                  ) : (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          title="delete messages"
                          className={classNames(
                            active ? "bg-gray-100 dark:bg-white/5" : "",
                            "flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800 font-medium dark:text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptions((prev) => ({ ...prev, [chat?._id]: false }));
                            deleteChat();
                          }}
                          role="button"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete message
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
            <div className="flex justify items-center flex-shrink-0">
              {chat.isGroupChat ? (
                <div className="w-12 relative h-12 flex-shrink-0 flex justify-start items-center flex-nowrap">
                  {React.Children.toArray(
                    chat.participants &&
                      chat.participants?.slice(0, 3)?.map((_, index) => (
                        // <img
                        //   src={p.avatar.url}
                        //   className={classNames(
                        //     "w-8 h-8 rounded-full border-[1.5px] border-gray-500 absolute",
                        //     index === 0
                        //       ? "left-0 z-30"
                        //       : index == 1
                        //       ? "left-2.5 z-20"
                        //       : index === 2
                        //       ? "left-3.5 z-20"
                        //       : ""
                        //   )}
                        //   alt=""
                        //   key={p?._id}
                        // />
                        <div
                          className={classNames(
                            "w-8 h-8 rounded-full border-[1.5px] border-gray-500 absolute",
                            index === 0
                              ? "left-0 z-10 bg-green-500"
                              : index == 1
                              ? "left-1.5 z-20 bg-indigo-500"
                              : index === 2
                              ? "left-3.5 z-30 bg-violet-500"
                              : ""
                          )}
                        ></div>
                      ))
                  )}
                </div>
              ) : (
                // <img
                //   src={getMessageObjectMetaData(chat, user!).avatar}
                //   className="w-12 h-12 rounded-full"
                //   alt="user image"
                // />
                <div className="w-12 h-12 rounded-full border"></div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <p className="dark:text-white"> {getMessageObjectMetaData(chat, user!)?.title}</p>
            <div className="flex items-center gap-1 text-gray-500">
              {chat?.lastMessage &&
              chat?.lastMessage.attachments &&
              chat?.lastMessage.attachments?.length > 0 ? (
                <PaperClipIcon className="h-4 w-4" />
              ) : null}
              <small className="dark:text-white">{getMessageObjectMetaData(chat, user!).lastMessage}</small>
            </div>
          </div>
        </div>

        <div className="h-full flex flex-col justify-start">
          <small className="flex-shrink-0 inline-block w-full dark:text-white">
            {moment(chat.updatedAt).add("TIME_ZONE", "hours").fromNow(true)}
          </small>

          {unreadCount > 0 && (
            <small className="h-5 w-5 rounded-full flex items-center justify-center text-white bg-green-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </small>
          )}
        </div>
      </div>
    </>
  );
};
