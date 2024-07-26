import React from "react";
import { ChatListItemInterface } from "../../types/chat";
import { deleteOneOneChatMessage } from "../../api";
import {
  classNames,
  getMessageObjectMetaData,
  requestHandler,
} from "../../utils";
import { useAuth } from "../../context/AuthContext";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import moment from "moment";

export const ChatItem: React.FC<{
  unreadMessageCount: number;
  chat: ChatListItemInterface;
  onClick: (chat: ChatListItemInterface) => void;
  onChatMessageDelete: (chatId: string) => void;
  isActive?: boolean;
}> = ({ chat, unreadMessageCount, onChatMessageDelete, onClick, isActive }) => {
  const { user } = useAuth();

  const deleteChat = async () => {
    await requestHandler({
      api: async () => await deleteOneOneChatMessage(chat?._id),
      setLoading: null,
      onSuccess: () => {
        onChatMessageDelete(chat?._id);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  return (
    <>
      <div
        role="button"
        className={classNames(
          "bg-gray-200 group flex items-start cursor-pointer hover:bg-gray-100 justify-between gap-3",
          isActive ? "bg-gray-300 border-[1.5px] border-zinc-300" : "",
          unreadMessageCount > 0 ? "border-2 border-green-500 bg-green-950" : ""
        )}
        onClick={() => onClick(chat)}
      >
        <div className="flex items-center gap-4">
          <div className="flex justify-center items-center flex-shrink-0">
            {chat.isGroupChat ? (
              <div className="w-12 relative h-12 flex-shrink-0 flex justify-start items-center flex-nowrap">
                {chat.participants.slice(0, 3).map((p, index) => (
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
                ))}
              </div>
            ) : (
              <img
                src={getMessageObjectMetaData(chat, user!).avatar}
                className="w-12 h-12 rounded-full"
                alt="user image"
              />
            )}
          </div>
          <div className="flex flex-col items-start w-full">
            <p> {getMessageObjectMetaData(chat, user!).title}</p>
            <div className="">
              {chat.lastMessage && chat.lastMessage.attachments.length > 0 ? (
                <PaperClipIcon />
              ) : null}
              <small>{getMessageObjectMetaData(chat, user!).title}</small>
            </div>
          </div>
        </div>

        <div className="h-full flex justify-between items-end">
          <small>
            {moment(chat.updatedAt).add("TIME_ZONE", "hours").fromNow(true)}
          </small>

          {unreadMessageCount <= 0 ? (
            <small className="h-5 w-5 rounded-full flex items-center justify-center text-white bg-green-600">
              {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
            </small>
          ) : null}
        </div>
      </div>
    </>
  );
};
