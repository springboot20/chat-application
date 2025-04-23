import {
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChatMessageInterface } from "../../types/chat";
import { classNames } from "../../utils";
import moment from "moment";
import { useState } from "react";

export const MessageItem: React.FC<{
  isOwnedMessage?: boolean;
  isGroupChatMessage?: boolean;
  message: ChatMessageInterface;
}> = ({ isOwnedMessage, isGroupChatMessage, message }) => {
  const [resizedImage, setResizedImage] = useState<string | null>(null);

  return (
    <>
      {resizedImage ? (
        <div className="h-full z-30 p-8 overflow-hidden w-full absolute inset-0 bg-black/70 flex justify-center items-center">
          <XMarkIcon
            className="absolute top-5 right-5 w-9 h-9 text-white cursor-pointer"
            onClick={() => setResizedImage(null)}
          />
          <img className="w-full h-full object-contain" src={resizedImage} alt="chat image" />
        </div>
      ) : null}

      <div
        className={classNames(
          "flex items-start p-1.5 text-white text-base relative h-auto w-full gap-6 ",
          isOwnedMessage ? "justify-end" : "justify-start"
        )}
      >
        <img
          src={message.sender?.avatar ? message.sender?.avatar?.url : ""}
          alt={message.sender?.username}
          className={classNames(
            "h-10 w-10 object-cover rounded-full items-center justify-center flex flex-shrink-0 bg-white border-2",
            isOwnedMessage ? "order-1" : "order-2"
          )}
        />
        <div
          className={classNames(
            "flex flex-col self-end w-auto p-2 relative",
            isOwnedMessage ? "order-1" : "order-2",
            isOwnedMessage
              ? "before:absolute before:content-[''] before:border-[#615EF0] before:-right-5 before:-z-10 before:top-0 before:border-t-[15px] before:border-b-[15px] before:border-b-transparent before:border-l-[25px] before:border-r-[25px] before:border-r-transparent bg-[#615EF0] before:-right rounded-xl rounded-tr-none"
              : "bg-green-500 before:absolute before:content-[''] before:-left-5 before:-z-10 before:top-0 before:border-b-[25px] before:border-t-transparent before:border-b-transparent  before:border-r-[40px] before:border-green-500 rounded-xl rounded-tl-none"
          )}
        >
          {isOwnedMessage && (
            <button title="open user profile" className="self-start">
              <span className="text-white text-sm">{message.sender?.username}</span>
            </button>
          )}

          <div className="relative">
            {isGroupChatMessage && !isOwnedMessage ? (
              <button title="open user profile" className="self-start">
                <span
                  className={classNames(
                    "text-sm text-white font-semibold mb-0.5",
                    ["text-green-500", "text-[#615EF0]"][message?.sender?.username?.length % 2]
                  )}
                >
                  {message.sender?.username}
                </span>
              </button>
            ) : null}

            {message?.attachments?.length > 0 ? (
              <div
                className={classNames(
                  "grid max-w-7xl gap-2",
                  message.attachments?.length === 1 ? " grid-cols-1" : "",
                  message.attachments?.length === 2 ? " grid-cols-2" : "",
                  message.attachments?.length >= 3 ? " grid-cols-3" : "",
                  message.content ? "mb-6" : ""
                )}
              >
                {message.attachments?.map((file) => {
                  return (
                    <div
                      key={file._id}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                    >
                      <button
                        onClick={() => setResizedImage(file.url)}
                        className="absolute inset-0 z-20 flex justify-center items-center w-full gap-2 h-full bg-black/60 group-hover:opacity-100 opacity-0 transition-opacity ease-in-out duration-150"
                      >
                        <MagnifyingGlassPlusIcon className="h-6 w-6 text-white" />
                        <a href={file.url} download onClick={(e) => e.stopPropagation()}>
                          <ArrowDownTrayIcon
                            title="download"
                            className="hover:text-zinc-400 h-6 w-6 text-white cursor-pointer"
                          />
                        </a>
                      </button>
                      <img className="h-full w-full object-cover" src={file.url} alt="msg_img" />
                    </div>
                  );
                })}
              </div>
            ) : null}

            {message.content ? (
              <p className="text-base font-semibold text-white">{message.content}</p>
            ) : null}

            <p
              className={classNames(
                "mt-1.5 self-end text-[10px] inline-flex items-center",
                isOwnedMessage ? "text-zinc-50" : "text-gray-800"
              )}
            >
              {message.attachments?.length > 0 ? <PaperClipIcon className="h-4 w-4 mr-2 " /> : null}
              {moment(message.updatedAt).add("TIME_ZONE", "hours").fromNow(true)} ago
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
