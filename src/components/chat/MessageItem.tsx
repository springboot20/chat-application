import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChatMessageInterface } from "../../types/chat";
import { classNames } from "../../utils";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { DocumentPreview } from "../file/DocumentPreview";

export const MessageItem: React.FC<{
  isOwnedMessage?: boolean;
  isGroupChatMessage?: boolean;
  message: ChatMessageInterface;
}> = ({ isOwnedMessage, isGroupChatMessage, message }) => {
  // const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [currentMessageImageIndex, setCurrentMessageImageIndex] = useState<number>(-1);
  const messageFiles = message.attachments;

  const handleNextImage = useCallback(() => {
    setCurrentMessageImageIndex((prev) => (prev + 1) % messageFiles.length);
  }, [messageFiles]);

  const handleImageChange = useCallback(
    (index: number) => {
      setCurrentMessageImageIndex(index);
    },
    [setCurrentMessageImageIndex]
  );

  const handlePreviousImage = useCallback(() => {
    if (currentMessageImageIndex > 1) {
      setCurrentMessageImageIndex((prev) => (prev - 1 + messageFiles.length) % messageFiles.length);
    }
  }, [currentMessageImageIndex, messageFiles]);

  const handleCloseModal = useCallback(() => {
    setCurrentMessageImageIndex(-1);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (currentMessageImageIndex >= 0) {
        switch (e.key) {
          case "Escape":
            handleCloseModal();
            break;
          case "ArrowLeft":
            handlePreviousImage();
            break;
          case "ArrowRight":
            handleNextImage();
            break;
        }
      }
    },
    [currentMessageImageIndex, handleCloseModal, handlePreviousImage, handleNextImage]
  );

  useEffect(() => {
    if (currentMessageImageIndex >= 0) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [currentMessageImageIndex, handleKeyDown]);

  return (
    <>
      {messageFiles.length > 0 &&
        currentMessageImageIndex >= 0 &&
        currentMessageImageIndex < messageFiles.length && (
          <div className="h-full z-30 p-8 overflow-y-auto w-full fixed inset-0 bg-black/80">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-60 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              onClick={handleCloseModal}
              aria-label="Close preview"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>

            {/* Navigation buttons */}
            {messageFiles.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-60 flex items-center justify-center rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 transition-colors"
                  onClick={handlePreviousImage}
                  aria-label="Previous image"
                >
                  <ArrowLeftIcon className="h-6 w-6 text-white" />
                </button>

                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-60 flex items-center justify-center rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 transition-colors"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  <ArrowRightIcon className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Main content */}
            <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6 w-full">
              <div className="w-full max-h-[80vh] flex items-center justify-center">
                <DocumentPreview
                  attachment={messageFiles[currentMessageImageIndex]}
                  index={currentMessageImageIndex}
                  isModal={true}
                />
              </div>

              {/* Thumbnail navigation */}
              {messageFiles.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {messageFiles.map((file, index) => (
                    <button
                      key={file._id}
                      onClick={() => handleImageChange(index)}
                      className={classNames(
                        "h-16 w-16 rounded overflow-hidden transition-all flex-shrink-0",
                        index === currentMessageImageIndex
                          ? "ring-2 ring-white scale-110"
                          : "hover:scale-105 opacity-70 hover:opacity-100"
                      )}
                      aria-label={`View attachment ${index + 1}`}
                    >
                      <DocumentPreview attachment={file} index={index} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
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
                {message.attachments?.map((file, index) => {
                  return (
                    <DocumentPreview
                      key={file._id}
                      attachment={file}
                      index={index}
                      onClick={() => handleImageChange(index)}
                      isModal={false}
                    />
                  );
                })}
              </div>
            ) : null}

            {message.content && (
              <p className="text-base font-semibold text-white">{message.content}</p>
            )}

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
