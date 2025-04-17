import { useAppDispatch } from "./../redux/redux.hooks";
import { useRef, useState, useCallback } from "react";
import { useSocketContext } from "../context/SocketContext.tsx";
import { useTyping } from "./useTyping.ts";
import { STOP_TYPING_EVENT, TYPING_EVENT, JOIN_CHAT_EVENT } from "../enums/index.ts";
import { RootState } from "../app/store.ts";
import { useAppSelector } from "../redux/redux.hooks.ts";
import {
  onMessageReceived,
  updateChatLastMessage,
  setUnreadMessages,
} from "../features/chats/chat.reducer.ts";
// import { toast } from "react-toastify";

export const useMessage = () => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { currentChat, unreadMessages } = useAppSelector((state: RootState) => state.chat);
  const dispatch = useAppDispatch();

  const [message, setMessage] = useState<string>("");
  const { socket, connected } = useSocketContext();
  const { typingTimeOutRef, setIsTyping, isTyping } = useTyping();
  const [attachmentFiles, setAttachmentFiles] = useState<File[] | undefined>([]);

  const handleOnMessageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(evt.target.value);
    if (!socket && !connected) return;

    if (!isTyping) {
      setIsTyping(true);

      socket?.emit(TYPING_EVENT, currentChat?._id);
    }

    if (typingTimeOutRef.current) {
      clearTimeout(typingTimeOutRef.current);
    }

    let typingLength = 3000;

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
    dispatch(setUnreadMessages({ chatId: currentChat?._id! }));
  }, [currentChat?._id, dispatch, socket]);

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
  };
};
