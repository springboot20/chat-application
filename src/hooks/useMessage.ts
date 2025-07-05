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
} from "../features/chats/chat.reducer.ts";
import { useReactToChatMessageMutation } from "../features/chats/chat.slice.ts";
// import { toast } from "react-toastify";

type FileType = {
  files: File[] | null;
  type: "document-file" | "image-file";
};

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
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messageItemRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [reaction, setReaction] = useState<Record<string, any>>({});
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

  const calculatePickerPosition = useCallback((messageId: string) => {
    const messageElement = messageItemRef.current[messageId];
    if (!messageElement) return { left: 0, top: 0 };

    const rect = messageElement.getBoundingClientRect();
    const pickerWidth = window.innerWidth < 768 ? Math.min(350, window.innerWidth - 40) : 350;
    const pickerHeight = window.innerWidth < 768 ? Math.min(400, window.innerHeight - 100) : 400;

    // Determine if the message is owned (right-aligned) or not (left-aligned)
    const isOwned = messageElement.classList.contains("justify-end");

    // Calculate horizontal position
    let left = isOwned
      ? rect.right - pickerWidth // Align picker with the right edge for owned messages
      : rect.left; // Align picker with the left edge for non-owned messages

    // Adjust left position to prevent overflow
    if (left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 10; // 10px padding from edge
    }
    if (left < 10) {
      left = 10; // 10px padding from left edge
    }

    // Calculate vertical position (prefer above the message, like WhatsApp)
    let top = rect.top - pickerHeight - 10; // 10px gap above the message

    // If there's not enough space above, place below the message
    if (top < 10) {
      top = rect.bottom + 10; // 10px gap below the message
    }

    // Ensure the picker doesn't overflow below the viewport
    if (top + pickerHeight > window.innerHeight) {
      top = window.innerHeight - pickerHeight - 10; // Adjust to fit within viewport
    }

    return { left, top };
  }, []);

  const handleShowReactionPicker = useCallback(
    (key: string) => {
      const position = calculatePickerPosition(key);
      setReactionLocation((prev) => ({ ...prev, [key]: position }));
      setShowReactionPicker((prev) => ({ ...prev, [key]: true }));
    },
    [calculatePickerPosition]
  );

  const handleHideReactionPicker = (key: string) =>
    setShowReactionPicker((prev) => ({ ...prev, [key]: false }));

  const handleSelectReactionEmoji = async (
    key: string,
    emojiData: EmojiClickData,
    event: MouseEvent
  ) => {
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
      .then((result) => {
        console.log(result);
      })
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
  };

  const handleReactionPicker = useCallback(
    (key: string) => {
      handleShowReactionPicker(key);
    },
    [handleShowReactionPicker]
  );

  const handleHideAllReactionPickers = () => setShowReactionPicker({});

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if the click is outside any emoji picker
    const isClickInsideAnyPicker = target.closest(".EmojiPickerReact");

    // Check if the click is on a message item (to allow double-click)
    const isClickOnMessage = Object.keys(messageItemRef.current).some((messageId) => {
      const messageElement = messageItemRef.current[messageId];
      return messageElement && messageElement.contains(target);
    });

    if (!isClickInsideAnyPicker && !isClickOnMessage) {
      handleHideAllReactionPickers();
    }
  }, []);

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
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      handleHideAllReactionPickers();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("click", handleClickOutside);
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

  const insertEmoji = (emojiData: EmojiClickData) => {
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
  };

  const handleEmojiSelect = (emojiData: EmojiClickData, event: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    insertEmoji(emojiData);
    setOpenEmoji(false);

    console.log(emojiData);
  };

  const handleEmojiSimpleSelect = (emojiData: EmojiClickData, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setMessage((prev) => {
      const newMessage = prev + emojiData.emoji;

      return newMessage;
    });
    setOpenEmoji(false);
  };

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
  };

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

    // React Picker
    handleSelectReactionEmoji,
    handleReactionPicker,
    reactionLocation,
    reaction,
    showReactionPicker,
    handleHideReactionPicker,
    handleHideAllReactionPickers,
  };
};
