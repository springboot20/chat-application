import { useAppDispatch } from "./../redux/redux.hooks";
import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext.tsx";
import { useTyping } from "./useTyping.ts";
import { JOIN_CHAT_EVENT, STOP_TYPING_EVENT, TYPING_EVENT } from "../enums/index.ts";
import { toast } from "react-toastify";
import { RootState } from "../app/store.ts";
import { useAppSelector } from "../redux/redux.hooks.ts";
import { useGetChatMessagesQuery, useSendMessageMutation } from "../features/chats/chat.slice.ts";
import {
  onMessageReceived,
  setUnreadMessages,
  updateChatLastMessage,
} from "../features/chats/chat.reducer.ts";
import { ChatMessageInterface } from "../types/chat.ts";

export const useMessage = () => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const {
    currentChat,
    unreadMessages,
    chatMessages: reduxChatMessages,
  } = useAppSelector((state: RootState) => state.chat);
  const dispatch = useAppDispatch();
  const {
    data: response,
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useGetChatMessagesQuery(currentChat?._id ?? "");
  const [sendMessage] = useSendMessageMutation();

  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageInterface[]>([] as ChatMessageInterface[]);
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

  const getAllMessages = async () => {
    // Early return checks
    if (!socket) {
      console.log("No socket connection, cannot get messages");
      return;
    }

    if (!currentChat?._id) {
      console.log("No chat selected, cannot get messages");
      setTimeout(() => {
        toast("No chat selected", { type: "warning" });
      }, 9000);
      return;
    }

    // Join the chat room
    socket?.emit(JOIN_CHAT_EVENT, currentChat?._id);

    // Filter unread messages
    dispatch(setUnreadMessages({ chatId: currentChat?._id }));

    setMessages(response?.data);
  };

  const onMessageReceive = (data: any) => {
    // Always dispatch the received message to the Redux store
    dispatch(onMessageReceived({ data }));

    // Update the last message of the chat
    dispatch(updateChatLastMessage({ chatToUpdateId: data.chat, message: data }));

    // Only add to local state if it's for the current chat
    if (data.chat === currentChat?._id) {
      setMessages((prevMessages) => [...prevMessages, data]);
    }
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const sendChatMessage = async () => {
    if (!currentChat?._id || !socket) return;

    socket?.emit(STOP_TYPING_EVENT, currentChat?._id);

    // dispatch(setUnreadMessages({ chatId: currentChat?._id }));

    // Clear input fields
    setMessage("");
    setAttachmentFiles([]);

    await sendMessage({
      chatId: currentChat?._id as string,
      data: {
        content: message,
        attachments: attachmentFiles,
      },
    })
      .unwrap()
      .then((response) => {
        // Update local messages state
        setMessages((prevMessages) => [...prevMessages, response?.data]);

        // Explicitly dispatch to update the chat's last message
        dispatch(
          updateChatLastMessage({
            chatToUpdateId: currentChat?._id!,
            message: response?.data,
          })
        );
      })
      .catch((error: any) => {
        console.error(error);
        toast("Failed to send message", { type: "error" });
      });

    scrollToBottom();
  };

  // Sync local messages state with redux store whenever reduxChatMessages changes
  useEffect(() => {
    if (reduxChatMessages && reduxChatMessages.length > 0) {
      setMessages(reduxChatMessages);
    }
  }, [reduxChatMessages]);

  // Also sync with data from the query when it changes
  useEffect(() => {
    if (response?.data) {
      setMessages(response.data);
    }
  }, [response]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    sendChatMessage,
    handleOnMessageChange,
    setMessage,
    message,
    messages,
    loadingMessages,
    setAttachmentFiles,
    unreadMessages,
    getAllMessages,
    attachmentFiles,
    onMessageReceive,
    refetchMessages,
    bottomRef,
  };
};
