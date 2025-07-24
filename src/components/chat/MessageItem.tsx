import { NoSymbolIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { ChatMessageInterface } from "../../types/chat";
import { classNames } from "../../utils";
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DocumentPreview } from "../file/DocumentPreview";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { MessageMenuSelection } from "../menu/MessageMenu";
import { User } from "../../types/auth";
import { isEqual } from "lodash"; // For deep comparison
import { useAppSelector } from "../../redux/redux.hooks";
import { RootState } from "../../app/store";
import { FilePreviewModal } from "../modal/FilePreviewModal";
import { useReactToChatMessageMutation } from "../../features/chats/chat.slice";
import ReactionTooltip from "../modal/ReactionTooltip";

const arePropsEqual = (prevProps: MessageItemProps, nextProps: MessageItemProps) => {
  // Compare message content, reactions, and attachments
  const messageEqual = isEqual(prevProps.message, nextProps.message);

  // Only re-render if relevant props have changed
  return (
    messageEqual &&
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
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleDeleteChatMessage: (key: string) => void;
  theme: string;
  messageToReply: string;
  users: User[];
  handleSetOpenReply: (messageId: string) => void;
  highlightedMessageId?: string; // Add this prop to track which message should glow
  onSetHighlightedMessage?: (messageId: string | undefined) => void;
  setIsOwnedMessage: (value: React.SetStateAction<boolean>) => void;
}

type EmojiType = {
  _id: string;
  emoji: string;
  userIds: string[];
  users: {
    avatar?: { url: string; localPath: string; _id: string };
    _id: string;
    username: string;
  }[];
};

type ReactionStats = {
  totalReactions: number;
  uniqueEmojis: number;
  topReaction: null;
  userHasReacted: boolean;
  categorizedReactions: CategorizedReaction[];
};

type CategorizedReaction = EmojiType & { count: number };

export const MessageItem: React.FC<MessageItemProps> = React.memo(
  ({
    isOwnedMessage,
    messageItemRef,
    isGroupChatMessage,
    message,
    theme,
    handleDeleteChatMessage,
    users,
    handleSetOpenReply,
    onSetHighlightedMessage,
    highlightedMessageId,
    containerRef: messagesContainerRef,
    messageToReply,
    setIsOwnedMessage,
  }) => {
    const [currentMessageImageIndex, setCurrentMessageImageIndex] = useState<number>(-1);
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { currentChat } = useAppSelector((state: RootState) => state.chat);
    const [reactToMessage] = useReactToChatMessageMutation();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const messageFiles = message.attachments || [];
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const [reaction, setReaction] = useState<Record<string, any>>({});
    const [showMenu, setShowMenu] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const reactionRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isGlowing, setIsGlowing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [contextMenuEvent, setContextMenuEvent] = useState<{
      clientX: number;
      clientY: number;
    } | null>(null);
    const [reactionLocation, setReactionLocation] = useState<{
      left: number;
      top: number;
    }>({
      left: 0,
      top: 0,
    });
    const [doubleClickPosition, setDoubleClickPosition] = useState<{
      clientX: number;
      clientY: number;
    } | null>(null);

    const [showReactionTooltip, setShowReactionTooltip] = useState(false);

    const calculateMenuPosition = useCallback(() => {
      if (
        !contextMenuEvent ||
        !containerRef.current ||
        !menuRef.current ||
        !messagesContainerRef.current
      )
        return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get scroll offsets
      const scrollX = messagesContainerRef.current.scrollWidth;
      const scrollY = messagesContainerRef.current.scrollHeight;

      console.log({
        scrollX,
        scrollY,
      });

      // Calculate initial position relative to viewport
      let x = contextMenuEvent.clientX;
      let y = contextMenuEvent.clientY;

      const MARGIN = -100;

      // Adjust if menu would go off the right edge
      if (x + menuRect.width > scrollX + viewportWidth) {
        console.log(scrollX + viewportWidth - (menuRect.width + MARGIN));
        x = scrollX + viewportWidth - menuRect.width - MARGIN; // 10px margin
      }

      console.log("menu width: ", menuRect.width);

      // Adjust if menu would go off the bottom edge
      if (y + menuRect.height > scrollY + viewportHeight) {
        y = scrollY + viewportHeight - menuRect.height - MARGIN; // 10px margin
      }

      console.log(menuRect.height);

      // Adjust if menu would go off the left edge of container
      if (x < containerRect.left + scrollX) {
        console.log(containerRect.left + scrollX);
        console.log(scrollX);
        x = containerRect.left + scrollX - MARGIN; // 10px margin
      }

      // Adjust if menu would go off the top edge of container
      if (y < containerRect.top + scrollY) {
        y = containerRect.top + scrollY - MARGIN; // 10px margin
      }

      console.log(`x position: ${x}`);
      console.log(`y position: ${y}`);

      // Convert to position relative to container
      const relativeX = x - containerRect.left - scrollX;
      const relativeY = y - containerRect.top - scrollY;

      console.log(`Relative x position: ${relativeX}`);
      console.log(`Relative y position: ${relativeY}`);
      console.log(scrollX);

      setMenuPosition({ x: relativeX, y: relativeY });
    }, [contextMenuEvent, messagesContainerRef]);

    const calculatePickerPosition = useCallback(() => {
      if (
        !doubleClickPosition ||
        !containerRef.current ||
        !reactionRef.current ||
        !messagesContainerRef.current
      ) {
        return;
      }

      // Get the message element's bounding rect
      const messageRect = containerRef.current.getBoundingClientRect();
      const reactionRect = reactionRef.current.getBoundingClientRect();

      // Get the viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get scroll offsets
      const scrollX = messagesContainerRef.current.scrollWidth;
      const scrollY = messagesContainerRef.current.scrollHeight;

      // Constants for picker dimensions (you may need to adjust these)
      const MARGIN = 10;

      let x = doubleClickPosition.clientX;
      let y = doubleClickPosition.clientY;

      // Ensure picker stays within viewport bounds
      if (x + reactionRect.width > scrollX + viewportWidth) {
        x = scrollX + viewportWidth - reactionRect.width - MARGIN;
      }

      if (x < messageRect.left + scrollX) {
        x = messageRect.left + scrollX - MARGIN;
      }

      if (y + reactionRect.height > scrollY - viewportHeight) {
        y = scrollY + viewportHeight - reactionRect.height - MARGIN;
      }

      if (y < messageRect.top + scrollY) {
        y = messageRect.top + scrollY - MARGIN;
      }

      // Convert to position relative to the message element
      const relativeX = x - messageRect.left - scrollX;
      const relativeY = y - messageRect.top - scrollY;

      setReactionLocation({
        left: Math.min(0, Math.abs(relativeX)),
        top: Math.min(0, Math.abs(relativeY)),
      });
    }, [doubleClickPosition, messagesContainerRef]);

    const handleReactionPicker = useCallback(
      (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault();
        event.stopPropagation();

        // Store click position with message ID
        setDoubleClickPosition({
          clientX: event.clientX,
          clientY: event.clientY,
        });

        setShowReactionPicker(true);
      },
      []
    );

    const handleHideReactionPicker = useCallback(() => {
      setShowReactionPicker(false);
      setDoubleClickPosition(null);
    }, []);

    const handleSelectReactionEmoji = useCallback(
      async (key: string, emojiData: EmojiClickData, event: MouseEvent) => {
        if (event) {
          event.stopPropagation();
        }

        setReaction((prev) => ({
          ...prev,
          [key]: emojiData.emoji, // Store the emoji string
        }));

        await reactToMessage({
          chatId: currentChat?._id || "",
          messageId: key,
          emoji: emojiData.emoji,
        })
          .unwrap()
          .then(() => {})
          .catch((error: any) => {
            console.error("Failed to send reaction:", error);
            // Optionally revert local state on failure
            setReaction((prev) => {
              const { [key]: _, ...rest } = prev;
              console.log(_);
              return rest;
            });
          });
        handleHideReactionPicker();
      },
      [currentChat?._id, handleHideReactionPicker, reactToMessage]
    );

    useEffect(() => {
      if (showReactionPicker && doubleClickPosition) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          calculatePickerPosition();
        });
      }
    }, [doubleClickPosition, showReactionPicker, calculatePickerPosition]);

    console.log(showReactionPicker);

    const handleHideAllReactionPickers = useCallback(() => {
      setShowReactionPicker(false);
      setDoubleClickPosition(null);
    }, []);

    const handleReactionClickOutside = useCallback((event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(".EmojiPickerReact")) {
        setShowReactionPicker(false);
      }
    }, []);

    // Keyboard navigation handler
    const handleReactionKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          handleHideAllReactionPickers();
        }
      },
      [handleHideAllReactionPickers]
    );

    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
        setShowMenu(false);
      }
    }, []);

    useEffect(() => {
      document.addEventListener("mousedown", handleReactionClickOutside);
      document.addEventListener("keydown", handleReactionKeyDown);
      window.addEventListener("resize", calculatePickerPosition);

      return () => {
        document.removeEventListener("mousedown", handleReactionClickOutside);
        document.removeEventListener("keydown", handleReactionKeyDown);
        window.removeEventListener("resize", calculatePickerPosition);
      };
    }, [calculatePickerPosition, handleReactionClickOutside, handleReactionKeyDown]);

    const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      // Store the event coordinates
      setContextMenuEvent({
        clientX: event.clientX,
        clientY: event.clientY,
      });

      setShowMenu(true);
    }, []);

    // Calculate menu position after it's rendered
    useEffect(() => {
      if (showMenu && contextMenuEvent) {
        // Use requestAnimationFrame to ensure menu is rendered
        requestAnimationFrame(() => {
          calculateMenuPosition();
        });
      }
    }, [showMenu, contextMenuEvent, calculateMenuPosition]);

    const handleCloseMenu = useCallback(() => {
      setShowMenu(false);
      setContextMenuEvent(null);
    }, []);

    useEffect(() => {
      if (showMenu) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("contextmenu", handleClickOutside);
        // Also handle window resize to recalculate position
        window.addEventListener("resize", calculateMenuPosition);

        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("contextmenu", handleClickOutside);
          window.removeEventListener("resize", calculateMenuPosition);
        };
      }
    }, [showMenu, handleClickOutside, calculateMenuPosition]);

    const handleNextImage = useCallback(() => {
      setCurrentMessageImageIndex((prev) => {
        console.log(prev);
        return (prev + 1) % messageFiles.length;
      });
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

    useEffect(() => {
      setIsOwnedMessage(isOwnedMessage || message.sender?._id === user?._id);
    }, [isOwnedMessage, message.sender?._id, setIsOwnedMessage, user?._id]);

    const renderMessageWithtMention = () => {
      const mentionRegex = /@([@\w\s]+?)(?=\s|$)/g;
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

    console.log(reaction);

    const categorizeReactions = (reactions: EmojiType[]) => {
      if (!reactions || !reactions.length) return [] as any;

      console.log(reactions);

      const reactionMap = new Map<string, CategorizedReaction>();

      reactions?.forEach(({ emoji, userIds, ...rest }) => {
        if (reactionMap.has(emoji)) {
          const existing = reactionMap.get(emoji)!;
          console.log(existing);

          reactionMap.set(emoji, {
            ...existing,
            userIds: userIds,
            count: userIds?.length,
          });
        } else {
          reactionMap.set(emoji, {
            emoji,
            userIds: userIds || [],
            count: userIds ? userIds?.length : 1,
            ...rest,
          });
        }
      });

      return Array.from(reactionMap.values())?.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.emoji.localeCompare(b.emoji);
      });
    };

    const hasUserReacted = (reaction: CategorizedReaction, currentUserId: string): boolean => {
      return reaction?.userIds?.includes(currentUserId);
    };

    const renderReactionsWithDuplicate = () => {
      if (!message.reactions || message.reactions.length === 0) return null;

      const reactions = message.reactions;

      const categorizedReactions: CategorizedReaction[] = categorizeReactions(reactions);
      const totalReactions = categorizedReactions.reduce((sum, r) => {
        console.log(r);
        return sum + r.count;
      }, 0);

      console.log(categorizedReactions);
      console.log(totalReactions);

      return (
        <div
          className={classNames(
            "absolute z-10 -bottom-4 rounded-full px-2 py-1 justify-center flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity",
            isOwnedMessage
              ? "bg-[#615EF0] right-3 dark:bg-[#615EF0] dark:text-white border-2 dark:border-black"
              : "bg-green-500 dark:bg-green-200 dark:text-green-700 border-2 dark:border-black left-3"
          )}
          onClick={(e) => {
            e.stopPropagation();
            // You can add a handler here to show detailed reaction info
            console.log("Reaction details:", categorizedReactions);
            setShowReactionTooltip(true);
          }}
        >
          {/* Show top 3 different emojis */}
          {categorizedReactions.slice(0, 3).map((reaction: CategorizedReaction, index: number) => (
            <span
              key={`${reaction.emoji}-${index}`}
              className={classNames(
                "text-xs transition-transform hover:scale-110 inline-block",
                hasUserReacted(reaction, user?._id || "") ? "animate-pulse" : ""
              )}
              title={`${reaction.emoji} ${reaction.count} - ${reaction.users
                ?.map((user) => user.username)
                .join(", ")}`}
            >
              {reaction.emoji}
            </span>
          ))}

          {/* Show total count */}
          <span className="text-xs font-medium ml-1">{totalReactions}</span>
        </div>
      );
    };

    // Helper function to get reaction statistics
    const getReactionStats = (): ReactionStats => {
      const categorizedReactions = categorizeReactions(message.reactions || []);
      const totalReactions = categorizedReactions.reduce(
        (sum: number, r: CategorizedReaction) => sum + r.count,
        0
      );
      const userHasReacted: boolean = categorizedReactions.some((r: CategorizedReaction) =>
        hasUserReacted(r, user?._id || "")
      );

      return {
        totalReactions,
        uniqueEmojis: categorizedReactions.length,
        topReaction: categorizedReactions[0] || null,
        userHasReacted,
        categorizedReactions,
      };
    };

    return (
      <>
        {/* Image Modal */}
        <FilePreviewModal
          open={
            messageFiles.length > 0 &&
            currentMessageImageIndex >= 0 &&
            currentMessageImageIndex < messageFiles.length
          }
          handleCloseModal={handleCloseModal}
          messageFiles={messageFiles}
          message={message}
          handleNextImage={handleNextImage}
          handlePreviousImage={handlePreviousImage}
          handleImageChange={handleImageChange}
          currentMessageImageIndex={currentMessageImageIndex}
        />

        <ReactionTooltip
          open={showReactionTooltip}
          onClose={() => setShowReactionTooltip(false)}
          stats={getReactionStats()!}
        />

        {/* Message Content */}
        <div
          className={classNames(
            "flex items-start p-1.5 text-white text-base relative h-auto w-full gap-6",
            isOwnedMessage ? "justify-end" : "justify-start",
            getGlowClass(),
            isAnimating && (isOwnedMessage ? "slide-right" : "slide-left")
          )}
          // onMouseDown={handleMouseDown}
          ref={containerRef}
          onDoubleClick={handleReactionPicker}
          onContextMenu={handleContextMenu}
        >
          {showMenu && (
            <MessageMenuSelection
              open={showMenu}
              menuRef={menuRef}
              menuPosition={menuPosition}
              handleDeleteChatMessage={() => handleDeleteChatMessage(message._id)}
              closeMenu={handleCloseMenu}
              isMessageDeleted={message.isDeleted}
              handleSetOpenReply={() => handleSetOpenReply(message._id)}
            />
          )}

          {/* Emoji Picker Portal */}
          {!message.isDeleted && showReactionPicker && (
            <div
              ref={reactionRef}
              className="absolute z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                top: `${reactionLocation.top}px`,
                left: `${reactionLocation.left}px`,
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
                  width={window.innerWidth < 768 ? Math.min(350, window.innerWidth - 100) : 350}
                  height={window.innerWidth < 768 ? Math.min(400, window.innerHeight - 100) : 400}
                  lazyLoadEmojis
                />
              </div>
            </div>
          )}

          {!message.isDeleted &&
            message.reactions &&
            message.reactions.length > 0 &&
            renderReactionsWithDuplicate()}

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
            ref={(element) => {
              messageItemRef.current[message._id] = element;
            }}
            data-id={message._id}
          >
            {!isOwnedMessage && !isGroupChatMessage ? (
              <button title="open user profile" className="self-start">
                <span className="text-gray-800 font-nunito font-bold text-sm">
                  ~{message.sender?.username}
                </span>
              </button>
            ) : (
              isOwnedMessage && (
                <span className="text-gray-800 font-nunito font-bold text-sm">You</span>
              )
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
                    "mb-2 p-2 rounded-lg overflow-hidden bg-gray-700/80 before:content-[''] before:w-1 before:left-0 before:block before:absolute before:top-0 before:h-full cursor-pointer relative",
                    isOwnedMessage
                      ? "bg-indigo-300/50 before:bg-indigo-100"
                      : "bg-green-100/50 before:bg-green-100"
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
                  <p
                    className={classNames(
                      "text-xs font-semibold ",
                      !isOwnedMessage ? "dark:text-gray-700" : "dark:text-gray-300"
                    )}
                  >
                    Replying to {message.repliedMessage?.sender?.username}
                  </p>
                  {message.repliedMessage ? (
                    message.repliedMessage.isDeleted ? (
                      <p className="text-xs italic dark:text-gray-400">Message deleted</p>
                    ) : (
                      <p
                        className={classNames(
                          "text-xs truncate",
                          !isOwnedMessage ? "dark:text-gray-100" : "dark:text-gray-200"
                        )}
                      >
                        {message.repliedMessage.content || "Attachment"}
                      </p>
                    )
                  ) : null}
                </div>
              )}

              {message?.attachments?.length > 0 && !message.isDeleted ? (
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
                <div className="flex items-center">
                  <NoSymbolIcon className="text-red-500 h-6 mr-2" strokeWidth={2} />
                  <p className="text-xsm sm:text-sm italic font-normal text-gray-800 break-words">
                    {user?._id === message.sender?._id ? "you" : message.sender?.username} deleted
                    this message
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
                {message.attachments?.length > 0 && !message.isDeleted ? (
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
