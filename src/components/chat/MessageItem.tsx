import {
  ArrowLeftIcon,
  ArrowRightIcon,
  NoSymbolIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChatMessageInterface } from "../../types/chat";
import { classNames } from "../../utils";
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DocumentPreview } from "../file/DocumentPreview";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { MessageMenuSelection } from "../menu/MessageMenu";
import { User } from "../../types/auth";
import { isEqual } from "lodash"; // For deep comparison

const arePropsEqual = (prevProps: MessageItemProps, nextProps: MessageItemProps) => {
  // Compare message content, reactions, and attachments
  const messageEqual = isEqual(prevProps.message, nextProps.message);

  // Compare other props that might change
  const showReactionPickerEqual =
    prevProps.showReactionPicker[nextProps.message._id] ===
    nextProps.showReactionPicker[nextProps.message._id];
  const reactionLocationEqual = isEqual(
    prevProps.reactionLocation[nextProps.message._id],
    nextProps.reactionLocation[nextProps.message._id]
  );

  // Only re-render if relevant props have changed
  return (
    messageEqual &&
    showReactionPickerEqual &&
    reactionLocationEqual &&
    prevProps.isOwnedMessage === nextProps.isOwnedMessage &&
    prevProps.isGroupChatMessage === nextProps.isGroupChatMessage &&
    prevProps.theme === nextProps.theme &&
    prevProps.messageToReply === nextProps.messageToReply &&
    prevProps.highlightedMessageId === nextProps.highlightedMessageId
  );
};

interface MessageItemProps {
  isOwnedMessage?: boolean;
  isGroupChatMessage?: boolean;
  message: ChatMessageInterface;
  messageItemRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  handleReactionPicker: (key: string) => void;
  showReactionPicker: Record<string, boolean>;
  handleSelectReactionEmoji: (key: string, emojiData: EmojiClickData, event: MouseEvent) => void;
  handleHideReactionPicker: (key: string) => void;
  handleDeleteChatMessage: (key: string) => void;
  reaction: Record<string, any>;
  theme: string;
  messageToReply: string;
  users: User[];
  reactionLocation: Record<string, { left: number; top: number }>;
  handleSetOpenReply: (messageId: string) => void;
  highlightedMessageId?: string; // Add this prop to track which message should glow
  onSetHighlightedMessage?: (messageId: string | undefined) => void;
}

export const MessageItem: React.FC<MessageItemProps> = React.memo(
  ({
    isOwnedMessage,
    messageItemRef,
    isGroupChatMessage,
    message,
    handleReactionPicker,
    showReactionPicker,
    handleSelectReactionEmoji,
    handleHideReactionPicker,
    reactionLocation,
    theme,
    handleDeleteChatMessage,
    users,
    handleSetOpenReply,
    onSetHighlightedMessage,
    highlightedMessageId,
    messageToReply,
  }) => {
    console.log(message);

    const [currentMessageImageIndex, setCurrentMessageImageIndex] = useState<number>(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const messageFiles = message.attachments || [];
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [isGlowing, setIsGlowing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      const clickX = event.clientX;
      const clickY = event.clientY;

      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      let menuWidth = 250;
      let menuHeight = 160;

      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        menuWidth = menuRect.width;
        menuHeight = menuRect.height;
      }

      let XPosition = clickX;
      let YPosition = clickY;

      console.log(XPosition + menuWidth)

      if (XPosition + menuWidth > screenWidth) {
        XPosition = screenWidth - menuWidth - 100;
      }

      console.log(screenWidth - menuWidth)

      if (YPosition + menuHeight > screenHeight) {
        YPosition = screenHeight - menuHeight - 100;
      }

      if (XPosition < 20) XPosition = 100;
      if (YPosition < 20) YPosition = 100;

      setShowMenu(true);
      setMenuPosition({ x: XPosition, y: YPosition });
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
        setShowMenu(false);
      }
    };

    useEffect(() => {
      if (showMenu) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("contextmenu", handleClickOutside);

        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("contextmenu", handleClickOutside);
        };
      }
    }, [showMenu]);

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
      if (currentMessageImageIndex > 0) {
        setCurrentMessageImageIndex(
          (prev) => (prev - 1 + messageFiles.length) % messageFiles.length
        );
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
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }, [currentMessageImageIndex, handleKeyDown]);

    // Handle glow effect when message is highlighted
    useEffect(() => {
      if (highlightedMessageId === message._id) {
        setIsGlowing(true);
        // Remove glow after animation completes
        const timer = setTimeout(() => {
          setIsGlowing(false);
          onSetHighlightedMessage?.(undefined);
        }, 2000); // Adjust timing as needed

        return () => clearTimeout(timer);
      }
    }, [highlightedMessageId, message._id, onSetHighlightedMessage]);

    // Handle glow effect when replyinh to a message
    useEffect(() => {
      if (messageToReply === message._id) {
        setIsAnimating(true);
        // Remove glow after animation completes
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 2000); // Adjust timing as needed

        return () => clearTimeout(timer);
      }
    }, [highlightedMessageId, message._id, messageToReply]);

    const renderMessageWithtMention = () => {
      const mentionRegex = /@(\w+)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = mentionRegex.exec(message.content)) !== null) {
        const username = match[1];

        const mentionedUser = (users || [])?.find(
          (user) => user.username.toLowerCase() === username.toLowerCase()
        );

        if (match.index > lastIndex) {
          parts.push(message.content.slice(lastIndex, match.index));
        }

        if (mentionedUser) {
          parts.push(
            <span
              key={`mention-${match.index}`}
              onClick={() => {
                console.log(mentionedUser.username);
              }}
              className={classNames(
                isOwnedMessage ? "text-gray-800" : "text-indigo-500",
                " hover:underline !font-bold font-nunito"
              )}
            >
              @{mentionedUser.username}
            </span>
          );
        } else {
          parts.push(
            <span
              key={`not-mention-${username}`}
              className={classNames(
                isOwnedMessage ? "text-gray-800" : "text-indigo-500",
                "hover:underline !font-bold font-nunito"
              )}
            >
              @{username}
            </span>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < message.content.length) {
        parts.push(message.content.slice(lastIndex));
      }

      return parts.map((part, index) => {
        return typeof part === "string" ? <span key={index}>{part}</span> : part;
      });
    };

    const getGlowClass = () => {
      if (!isGlowing) return "";
      return isOwnedMessage ? "animate-glow-purple" : "animate-glow-green";
    };

    console.log(getGlowClass());
    console.log(highlightedMessageId);

    return (
      <>
        {/* Image Modal */}
        {messageFiles.length > 0 &&
          currentMessageImageIndex >= 0 &&
          currentMessageImageIndex < messageFiles.length && (
            <div className="h-full z-30 p-8 overflow-y-auto w-full fixed inset-0 bg-black/80">
              <button
                className="absolute top-4 right-4 z-60 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                onClick={handleCloseModal}
                aria-label="Close preview"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>

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

              <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6 w-full">
                <div className="w-full max-h-[80vh] flex items-center justify-center">
                  <DocumentPreview
                    attachment={messageFiles[currentMessageImageIndex]}
                    index={currentMessageImageIndex}
                    isModal={true}
                  />
                </div>

                {messageFiles.length > 1 && (
                  <div className="flex items-center gap-3 pb-2">
                    {messageFiles.map((file, index) => (
                      <button
                        key={file._id}
                        onClick={() => handleImageChange(index)}
                        className={classNames(
                          "h-24 w-24 rounded overflow-hidden transition-all flex-shrink-0",
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

        {/* Message Content */}
        <div
          className={classNames(
            "flex items-start p-1.5 text-white text-base relative h-auto w-full gap-6",
            isOwnedMessage ? "justify-end" : "justify-start",
            getGlowClass(),
            isAnimating && (isOwnedMessage ? "slide-right" : "slide-left")
          )}
          onContextMenu={(event) => {
            handleContextMenu(event);
          }}
        >
          {showMenu && (
            <MessageMenuSelection
              open={showMenu}
              menuRef={menuRef}
              menuPosition={menuPosition}
              handleDeleteChatMessage={() => handleDeleteChatMessage(message._id)}
              closeMenu={() => setShowMenu(false)}
              isMessageDeleted={message.isDeleted}
              handleSetOpenReply={() => handleSetOpenReply(message._id)}
            />
          )}

          {/* Emoji Picker Portal */}
          {!message.isDeleted &&
            showReactionPicker[message._id] &&
            reactionLocation[message._id] && (
              <div
                className="fixed z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                style={{
                  top: `${reactionLocation[message._id].top}px`,
                  left: `${reactionLocation[message._id].left}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative shadow-2xl rounded-lg overflow-hidden">
                  <EmojiPicker
                    onReactionClick={(emoji, event) =>
                      handleSelectReactionEmoji(message._id, emoji, event)
                    }
                    reactionsDefaultOpen={true}
                    theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                    searchDisabled={false}
                    width={window.innerWidth < 768 ? Math.min(350, window.innerWidth - 40) : 350}
                    height={window.innerWidth < 768 ? Math.min(400, window.innerHeight - 100) : 400}
                    lazyLoadEmojis
                  />
                  {/* Close button for mobile */}
                  <button
                    onClick={() => handleHideReactionPicker(message._id)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-gray-700 transition-colors md:hidden z-10"
                    aria-label="Close emoji picker"
                  >
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            )}

          {!message.isDeleted && message.reactions && message.reactions.length > 0 && (
            <div
              className={classNames(
                "absolute z-10 -bottom-4 rounded-full px-3 py-1 justify-center flex items-center gap-1",
                isOwnedMessage
                  ? "bg-[#615EF0] right-3 dark:bg-[#615EF0] dark:text-white border-2 dark:border-black"
                  : "bg-green-500 dark:bg-green-200 dark:text-green-700 border-2 dark:border-black left-3"
              )}
            >
              {message.reactions.slice(0, 3).map((reaction, index) => {
                return (
                  <span key={`${reaction.userId}-${reaction.emoji}-${index}`} className="text-xs">
                    {reaction.emoji}
                  </span>
                );
              })}
              <span className="text-xs">{message.reactions.length}</span>{" "}
              {/* Placeholder for reaction count */}
            </div>
          )}

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
            id={`message-item-${message._id}`}
            className={classNames(
              "flex flex-col self-end w-auto p-2 relative max-w-md cursor-pointer",
              isOwnedMessage ? "order-1" : "order-2",
              isOwnedMessage
                ? "before:absolute before:content-[''] before:border-[#615EF0] before:-right-5 before:-z-10 before:top-0 before:border-t-[15px] before:border-b-[15px] before:border-b-transparent before:border-l-[25px] before:border-r-[25px] before:border-r-transparent bg-[#615EF0] before:-right rounded-xl rounded-tr-none"
                : "bg-green-500 before:absolute before:content-[''] before:-left-5 before:-z-10 before:top-0 before:border-b-[25px] before:border-t-transparent before:border-b-transparent before:border-r-[40px] before:border-green-500 rounded-xl rounded-tl-none"
            )}
            onDoubleClick={(e) => {
              // Only trigger for non-owned messages
              e.preventDefault();
              e.stopPropagation();
              handleReactionPicker(message._id);
            }}
            ref={(element) => {
              messageItemRef.current[message._id] = element;
            }}
            data-id={message._id}
          >
            {isOwnedMessage && (
              <button title="open user profile" className="self-start">
                <span className="text-gray-800 font-nunito font-bold text-sm">
                  ~{message.sender?.username}
                </span>
              </button>
            )}

            <div className="relative">
              {isGroupChatMessage && !isOwnedMessage ? (
                <button title="open user profile" className="self-start">
                  <span
                    className={classNames(
                      "text-sm font-semibold mb-0.5",
                      ["text-gray-800", "text-[#615EF0]"][message?.sender?.username?.length % 2]
                    )}
                  >
                    ~{message.sender?.username}
                  </span>
                </button>
              ) : null}

              {/* Reply Preview */}
              {message.replyId && (
                <div
                  className={classNames(
                    "mb-2 p-2 rounded-lg bg-gray-100/50 dark:bg-gray-700/50 border-l-4 cursor-pointer"
                  )}
                  onClick={() => {
                    if (message.repliedMessage && message.replyId) {
                      // Set the message to be highlighted
                      onSetHighlightedMessage?.(message.replyId);

                      const element = messageItemRef.current[message.replyId] as HTMLElement;
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }
                  }}
                >
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Replying to {message.repliedMessage?.sender?.username}
                  </p>
                  {message.repliedMessage ? (
                    message.repliedMessage.isDeleted ? (
                      <p className="text-xs italic text-gray-500 dark:text-gray-400">
                        Message deleted
                      </p>
                    ) : (
                      <p className="text-xs text-gray-800 dark:text-gray-200 truncate">
                        {message.repliedMessage.content || "Attachment"}
                      </p>
                    )
                  ) : null}
                </div>
              )}

              {message?.attachments?.length > 0 ? (
                <div
                  className={classNames(
                    "grid max-w-7xl gap-2",
                    message.attachments?.length === 1 ? "grid-cols-1" : "",
                    message.attachments?.length === 2 ? "grid-cols-2" : "",
                    message.attachments?.length >= 3 ? "grid-cols-3" : "",
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

              {message.isDeleted ? (
                <div className="flex items-center gap-2">
                  <NoSymbolIcon className="text-gray-800 dark:text-red-500 h-6" strokeWidth={2} />
                  <p className="text-xsm sm:text-sm italic font-normal text-gray-800 break-words">
                    message deleted
                  </p>
                </div>
              ) : (
                message.content && (
                  <p className="text-base font-normal text-white break-words">
                    {renderMessageWithtMention()}
                  </p>
                )
              )}

              <p
                className={classNames(
                  "mt-1.5 self-end text-xs inline-flex items-center dark:text-white",
                  isOwnedMessage ? "text-zinc-50" : "text-gray-800"
                )}
              >
                {message.attachments?.length > 0 ? (
                  <PaperClipIcon className="h-4 w-4 mr-2" />
                ) : null}
                {moment(message.updatedAt).add("TIME_ZONE", "hours").fromNow(true)} ago
              </p>
            </div>
          </div>
        </div>
      </>
    );
  },
  arePropsEqual
);
