import { useAppDispatch } from "./../redux/redux.hooks";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSocketContext } from "../context/SocketContext.tsx";
import { useTyping } from "./useTyping.ts";
import { STOP_TYPING_EVENT, TYPING_EVENT, JOIN_CHAT_EVENT } from "../enums/index.ts";
import { RootState } from "../app/store.ts";
import { useAppSelector } from "../redux/redux.hooks.ts";
import { type EmojiClickData } from "emoji-picker-react";

import {
  onMessageReceived,
  updateChatLastMessage,
  setUnreadMessages,
  onChatMessageDelete,
} from "../features/chats/chat.reducer.ts";
import {
  useDeleteChatMessageMutation,
  useReactToChatMessageMutation,
} from "../features/chats/chat.slice.ts";
import { User } from "../types/auth.ts";
// import { toast } from "react-toastify";

type FileType = {
  files: File[] | null;
  type: "document-file" | "image-file";
};

const messageReceivedSound = new Audio("../assets/audio/message-notification.mp3");
// const reactionSound = new Audio("/sounds/reaction.mp3");

export const useMessage = () => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { currentChat, unreadMessages } = useAppSelector((state: RootState) => state.chat);
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState<string>("");
  const { socket, connected } = useSocketContext();
  const { typingTimeOutRef, setIsTyping, isTyping } = useTyping();
  const [attachmentFiles, setAttachmentFiles] = useState<FileType>({
    files: null,
    type: "document-file",
  });
  const [showMentionUserMenu, setShowMentionUserMenu] = useState<boolean>(false);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messageItemRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [reaction, setReaction] = useState<Record<string, any>>({});
  const [selectedUser, setSelectedUser] = useState<User>({} as User);
  const [reactionLocation, setReactionLocation] = useState<
    Record<
      string,
      {
        left: number;
        top: number;
      }
    >
  >({});
  const [reactToMessage] = useReactToChatMessageMutation();
  const [deleteChatMessage] = useDeleteChatMessageMutation();

  const handleSelectUser = useCallback((user: User) => {
    setMessage((prev) => {
      return prev + user.username;
    });

    setSelectedUser(user);
    setShowMentionUserMenu(false);
  }, []);

  const calculatePickerPosition = useCallback((messageId: string) => {
    const messageElement = messageItemRef.current[messageId];
    if (!messageElement) return { left: 0, top: 0 };

    const rect = messageElement.getBoundingClientRect();
    const pickerWidth = window.innerWidth < 768 ? Math.min(350, window.innerWidth - 40) : 350;
    const pickerHeight = window.innerWidth < 768 ? Math.min(400, window.innerHeight - 100) : 400;

    const viewportWidth = innerWidth;
    const viewportHeight = innerHeight;

    // Determine if the message is owned (right-aligned) or not (left-aligned)
    const isOwned = messageElement.closest("justify-end") !== null;

    // Calculate horizontal position
    let left;
    if (isOwned) {
      left = rect.right - pickerWidth;
    } else {
      left = rect.left;
    }

    const rightEdge = left + pickerWidth;
    const leftEdge = left;

    if (rightEdge > viewportWidth - 20) {
      left = viewportWidth - pickerWidth - 20;
    }

    if (leftEdge < 20) {
      left = 20;
    }

    let top = rect.top - pickerHeight - 20;

    if (top < 20) {
      top = rect.bottom + 10;
    }

    if (top + pickerHeight > viewportHeight - 20) {
      top = viewportHeight - pickerHeight - 20;
    }

    if (top < 20) {
      top = 20;
    }

    return { top, left };
  }, []);

  const handleShowMentionUserMenu = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const target = event.target;

    const regexPattern = /(^|\s)@$/;

    console.log(target.value.match(regexPattern));

    if (target.value.match(regexPattern)) {
      setShowMentionUserMenu(true);
    } else {
      setShowMentionUserMenu(false);
    }
  }, []);

  const handleShowReactionPicker = useCallback(
    (key: string) => {
      const position = calculatePickerPosition(key);
      setReactionLocation((prev) => ({ ...prev, [key]: position }));
      setShowReactionPicker((prev) => ({ ...prev, [key]: true }));
    },
    [calculatePickerPosition]
  );

  const handleHideReactionPicker = useCallback(
    (key: string) => setShowReactionPicker((prev) => ({ ...prev, [key]: false })),
    []
  );

  const handleSelectReactionEmoji = useCallback(
    async (key: string, emojiData: EmojiClickData, event: MouseEvent) => {
      event.stopPropagation();

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
      handleHideReactionPicker(key);
    },
    [currentChat?._id, handleHideReactionPicker, reactToMessage]
  );

  const handleReactionPicker = useCallback(
    (key: string) => {
      handleShowReactionPicker(key);
    },
    [handleShowReactionPicker]
  );

  const handleHideAllReactionPickers = useCallback(() => setShowReactionPicker({}), []);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(".EmojiPickerReact")) {
        Object.keys(showReactionPicker).forEach((messageId) => {
          setShowReactionPicker((prev) => ({ ...prev, [messageId]: false }));
        });
      }
    },
    [showReactionPicker]
  );

  // Handle window resize to recalculate positions
  const handleResize = useCallback(() => {
    // Recalculate positions for all open pickers
    Object.keys(showReactionPicker).forEach((messageId) => {
      if (showReactionPicker[messageId]) {
        const position = calculatePickerPosition(messageId);
        setReactionLocation((prev) => ({ ...prev, [messageId]: position }));
      }
    });
  }, [showReactionPicker, calculatePickerPosition]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleHideAllReactionPickers();
      }
    },
    [handleHideAllReactionPickers]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleClickOutside, handleKeyDown, handleResize]);

  const handleFileChange = useCallback(
    (fileType: "document-file" | "image-file", event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const files = target.files;

      if (files && files.length) {
        const fileArray = Array.from(files);

        setAttachmentFiles((prev) => {
          // If the previous files are null, initialize with an empty array
          const updatedFiles =
            prev.files && prev.type === fileType ? [...prev.files, ...fileArray] : fileArray;
          const newState = {
            type: fileType,
            files: updatedFiles,
          };
          console.log("Updated attachmentFiles:", newState);
          return newState;
        });
      }

      target.value = "";
    },
    []
  );

  const [openEmoji, setOpenEmoji] = useState<boolean>(false);

  const handleOpenAndCloseEmoji = () => setOpenEmoji(!openEmoji);

  const insertEmoji = useCallback(
    (emojiData: EmojiClickData) => {
      const input = messageInputRef.current;

      console.log("Inserting emoji:", emojiData.emoji);

      if (!input) {
        // Fallback: add to end if no input ref
        setMessage((prev) => prev + emojiData.emoji);
        return;
      }

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      console.log("Cursor position - start:", start, "end:", end);
      console.log("Current message:", message);

      const newMessage = message.slice(0, start) + emojiData.emoji + message.slice(end);
      setMessage(newMessage);

      setTimeout(() => {
        const newCursorPos = start + emojiData?.emoji.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
      }, 0);

      setOpenEmoji(false);
    },
    [message]
  );

  const handleEmojiSelect = useCallback(
    (emojiData: EmojiClickData, event: MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      insertEmoji(emojiData);
      setOpenEmoji(false);

      console.log(emojiData);
    },
    [insertEmoji]
  );

  const handleEmojiSimpleSelect = useCallback((emojiData: EmojiClickData, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setMessage((prev) => {
      const newMessage = prev + emojiData.emoji;

      return newMessage;
    });
    setOpenEmoji(false);
  }, []);

  const handleOnMessageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(evt.target.value);

    if (!socket || !connected) return;

    if (!isTyping) {
      setIsTyping(true);

      socket?.emit(TYPING_EVENT, currentChat?._id);
    }

    console.log(isTyping);

    if (typingTimeOutRef.current) {
      clearTimeout(typingTimeOutRef.current);
    }

    const typingLength = 3000;

    typingTimeOutRef.current = setTimeout(() => {
      socket?.emit(STOP_TYPING_EVENT, currentChat?._id);

      setIsTyping(false);
    }, typingLength);
  };

  const getAllMessages = useCallback(async () => {
    // Early return checks
    if (!socket) {
      console.log("No socket connection, cannot get reduxStateMessages");
      return;
    }

    // if (!currentChat?._id) {
    //   console.log("No chat selected, cannot get reduxStateMessages");
    //   setTimeout(() => {
    //     toast("No chat selected", { type: "warning" });
    //   }, 9000);
    //   return;
    // }

    // Join the chat room
    socket?.emit(JOIN_CHAT_EVENT, currentChat?._id);

    // Filter unread reduxStateMessages
    dispatch(setUnreadMessages({ chatId: currentChat!._id! }));
  }, [currentChat, dispatch, socket]);

  const onMessageReceive = (data: any) => {
    // Always dispatch the received message to the Redux store
    dispatch(onMessageReceived({ data }));

    // Update the last message of the chat
    dispatch(updateChatLastMessage({ chatToUpdateId: data.chat, message: data }));

    if (data.chat === currentChat?._id && !currentChat?.participants.includes(data.sender._id)) {
      messageReceivedSound
        .play()
        .catch((error) => console.error("Failed to play received sound:", error));
    }
  };

  const onChatMessageDeleted = (data: any) => {
    dispatch(onChatMessageDelete({ messageId: data._id, message: data }));
  };

  const handleDeleteChatMessage = useCallback(
    async (messageId: string) => {
      await deleteChatMessage({
        chatId: currentChat?._id || "",
        messageId,
      })
        .unwrap()
        .then((response) => {
          console.log(response);
          messageReceivedSound
            .play()
            .catch((error) => console.error("Failed to play received sound:", error));
        })
        .catch((error: any) => {
          console.error(error);
        });
    },
    [deleteChatMessage, currentChat]
  );

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      Object.keys(showReactionPicker).forEach((key) => {
        if (showReactionPicker[key]) {
          handleReactionPicker(key);
        }
      });
    }
  };

  const onReactionUpdate = useCallback(
    (data: any) => {
      // Update only the reactions for the specific message
      dispatch(
        onMessageReceived({
          data: {
            ...data,
            reactions: data.reactions, // Only update reactions
          },
        })
      );

      messageReceivedSound
        .play()
        .catch((error) => console.error("Failed to play received sound:", error));
    },
    [dispatch]
  );

  const handleRemoveFile = (indexToRemove: number) => {
    if (attachmentFiles?.files) {
      const updatedFiles = attachmentFiles.files.filter((_, index) => index !== indexToRemove);
      setAttachmentFiles({
        ...attachmentFiles,
        files: updatedFiles.length > 0 ? updatedFiles : null,
      });
    }
  };

  return {
    handleOnMessageChange,
    setMessage,
    message,
    setAttachmentFiles,
    unreadMessages,
    attachmentFiles,
    onMessageReceive,
    onChatMessageDeleted,
    bottomRef,
    getAllMessages,
    scrollToBottom, // Expose the scrollToBottom function
    setOpenEmoji,
    handleOpenAndCloseEmoji,
    messageInputRef,
    openEmoji,
    handleEmojiSelect,
    handleEmojiSimpleSelect,
    handleFileChange,
    imageInputRef,
    documentInputRef,
    handleRemoveFile,
    messageItemRef,
    handleShowMentionUserMenu,
    showMentionUserMenu,
    handleSelectUser,
    selectedUser,
    onReactionUpdate,

    // React Picker
    handleSelectReactionEmoji,
    handleReactionPicker,
    reactionLocation,
    reaction,
    showReactionPicker,
    handleHideReactionPicker,
    handleHideAllReactionPickers,
    handleDeleteChatMessage,
  };
};
