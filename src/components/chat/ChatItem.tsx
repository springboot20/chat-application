import React, { useState } from "react";
import { ChatListItemInterface } from "../../types/chat";
import { classNames, getMessageObjectMetaData } from "../../utils";
import {
  EllipsisVerticalIcon,
  InformationCircleIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import { useAppSelector } from "../../redux/redux.hooks";
import { RootState } from "../../app/store";
import { useDeleteOneOneChatMessageMutation } from "../../features/chats/chat.slice";
import { toast } from "react-toastify";

export const ChatItem: React.FC<{
  chat: ChatListItemInterface;
  onClick: (chat: ChatListItemInterface) => void;
  isActive?: boolean;
  unreadCount?: number;
  onChatDelete: (chatId: string) => void;
}> = ({ chat, onClick, unreadCount = 0, onChatDelete, isActive }) => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [openOptions, setOpenOptions] = useState(false);
  const [openGroupInfo, setOpenGroupInfo] = useState(false);

  const [deleteOneOneChatMessage] = useDeleteOneOneChatMessageMutation();

  // const handleMessageDelete = (chatId: string) => {
  //   setChats((prev) => prev.filter((chat) => chat._id !== chatId));
  //   if (currentChat.current?._id === chatId) {
  //     currentChat.current = null;
  //     LocalStorage.remove("currentChat");
  //   }
  // };

  console.log(openGroupInfo);
  console.log(getMessageObjectMetaData(chat, user!).lastMessage)

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
      <div
        role="button"
        className={classNames(
          "bg-gray-200 group flex items-start cursor-pointer hover:bg-gray-100 px-1 py-2.5  justify-between",
          isActive ? "bg-gray-300 border-[1.5px] border-zinc-300" : "",
          unreadCount > 0 ? "border-2 border-green-500 bg-green-950" : ""
        )}
        onClick={() => onClick(chat)}
        onMouseLeave={() => setOpenOptions(false)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenOptions(!openOptions);
              }}
              className="self-center relative"
            >
              <EllipsisVerticalIcon className="h-6 group-hover:w-6 group-hover:opacity-100 w-0 opacity-0 transition-all ease-in-out duration-100 text-zinc-300" />
              <div
                className={classNames(
                  "z-20 text-left absolute bottom-0 translate-y-full text-sm w-52 bg-dark rounded-2xl p-2 shadow-md border-[1px] border-secondary",
                  openOptions ? "block" : "hidden"
                )}
              >
                {chat.isGroupChat ? (
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenGroupInfo(true);
                    }}
                    role="button"
                    className="p-4 w-full rounded-lg inline-flex items-center hover:bg-secondary"
                  >
                    <InformationCircleIcon className="h-4 w-4 mr-2" /> About group
                  </p>
                ) : (
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      const ok = confirm("Are you sure you want to delete this chat?");
                      if (ok) {
                        deleteChat();
                      }
                    }}
                    role="button"
                    className="p-4 text-danger rounded-lg w-full inline-flex items-center hover:bg-secondary"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete chat
                  </p>
                )}
              </div>
            </button>

            <div className="flex justify items-center flex-shrink-0">
              {chat.isGroupChat ? (
                <div className="w-12 relative h-12 flex-shrink-0 flex justify-start items-center flex-nowrap">
                  {/* { chat.participants &&  chat.participants.slice(0, 3).map((p, index) => (
                  <img
                    src={p.avatar.url}
                    className={classNames(
                      "w-8 h-8 rounded-full border-[1.5px] border-gray-500 absolute",
                      index === 0
                        ? "left-0 z-30"
                        : index == 1
                        ? "left-2.5 z-20"
                        : index === 2
                        ? "left-3.5 z-20"
                        : ""
                    )}
                    alt=""
                    key={p?._id}
                  />
                ))} */}
                </div>
              ) : // <img
              //   src={getMessageObjectMetaData(chat, user!).avatar}
              //   className="w-12 h-12 rounded-full"
              //   alt="user image"
              // />

              null}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <p> {getMessageObjectMetaData(chat, user!).title}</p>
            <div className="flex items-center gap-1 text-gray-500">
              {chat.lastMessage &&
              chat.lastMessage.attachments &&
              chat.lastMessage.attachments.length > 0 ? (
                <PaperClipIcon className="h-4 w-4" />
              ) : null}
              <small>{getMessageObjectMetaData(chat, user!).lastMessage}</small>
            </div>
          </div>
        </div>

        <div className="h-full flex flex-col justify-start">
          <small className="flex-shrink-0 inline-block w-full">
            {moment(chat.updatedAt).add("TIME_ZONE", "hours").fromNow(true)}
          </small>

          {unreadCount > 0 ? (
            <small className="h-5 w-5 rounded-full flex items-center justify-center text-white bg-green-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </small>
          ) : null}
        </div>
      </div>
    </>
  );
};
