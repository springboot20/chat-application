import {
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { ChatMessageInterface } from "../../types/chat";
import { classNames } from "../../utils";
import moment from "moment";

export const MessageItem: React.FC<{
  isOwnedMessage?: boolean;
  isGroupChatMessage?: boolean;
  message: ChatMessageInterface;
}> = ({ isOwnedMessage, isGroupChatMessage, message }) => {
  return (
    <div
      className={classNames(
        "flex items-end p-1.5 text-white text-base justify-start relative h-auto w-auto rounded-xl rounded-tl-none bg-[#615EF0] right-2",
        "before:absolute before:content-[''] before:top-0 before:-left-4 before:border-b-[15px] before:border-t-transparent before:border-b-transparent before:border-r-[25px] before:border-[#615EF0]"
      )}
    >
      <div
        className={classNames(
          "p-4 rounded-3xl flex flex-col",
          isOwnedMessage
            ? "order-1 rounded-br-none bg-primary"
            : "order-2 rounded-bl-none bg-secondary"
        )}
      >
        {isGroupChatMessage && !isOwnedMessage ? (
          <p
            className={classNames(
              "text-lg text-white font-semibold mb-2",
              ["text-success", "text-danger"][message?.sender?.username?.length % 2]
            )}
          >
            {message.sender?.username}
          </p>
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
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                >
                  <button
                    // onClick={() => setResizedImage(file.url)}
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
          <p className="text-lg font-semibold text-white">{message.content}</p>
        ) : null}

        <p
          className={classNames(
            "mt-1.5 self-end text-[10px] inline-flex items-center",
            isOwnedMessage ? "text-zinc-50" : "text-zinc-400"
          )}
        >
          {message.attachments?.length > 0 ? <PaperClipIcon className="h-4 w-4 mr-2 " /> : null}
          {moment(message.updatedAt).add("TIME_ZONE", "hours").fromNow(true)} ago
        </p>
      </div>
    </div>
  );
};
