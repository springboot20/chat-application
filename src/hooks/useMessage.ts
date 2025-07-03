import { useAppDispatch } from "./../redux/redux.hooks";
import { useRef, useState, useCallback } from "react";
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
  const [attachmentFiles, setAttachmentFiles] = useState<FileType>({} as FileType);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    (fileType: "document-file" | "image-file", event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      if (Array.isArray(attachmentFiles.files)) {
        const files = target.files;
        setAttachmentFiles({
          type: fileType,
          files: files as any,
        });
      }

      console.log(attachmentFiles);
    },
    [attachmentFiles]
  );
  console.log(attachmentFiles);

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

    console.log("Emoji inserted:", emojiData.emoji);
    console.log("New message:", newMessage);

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

  console.log("Input ref:", messageInputRef.current);
  console.log("Input value:", messageInputRef.current?.value);
  console.log("Message state:", message);

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

  // const scrollToBottom = () => {
  //   if (bottomRef.current) {
  //     // Use block: "end" to ensure it aligns to the bottom
  //     bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  //   }
  // };

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
    // scrollToBottom, // Expose the scrollToBottom function
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
  };
};
