import { useAppDispatch } from "./../redux/redux.hooks";
import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext.tsx";
import { useChat } from "./useChat.ts";
import { useTyping } from "./useTyping.ts";
import { JOIN_CHAT_EVENT, STOP_TYPING_EVENT, TYPING_EVENT } from "../enums/index.ts";
import { toast } from "react-toastify";
import { RootState } from "../app/store.ts";
import { useAppSelector } from "../redux/redux.hooks.ts";
import { useGetChatMessagesQuery, useSendMessageMutation } from "../features/chats/chat.slice.ts";
import { newMessage, setUnreadMessages } from "../features/chats/chat.reducer.ts";
import { ChatMessageInterface } from "../types/chat.ts";
export const useMessage = () => {
  // const { chatId } = useParams();

  const { _updateChatLastMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const {
    currentChat,
    unreadMessages,
    chatMessages: reduxChatMessages,
  } = useAppSelector((state: RootState) => state.chat);
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((state: RootState) => state.auth.user?._id);
  const {
    data,
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

    if (data?.data) {
      setMessages(data.data);
    }
  };

  const onMessageReceive = (data: any) => {
    dispatch(newMessage({ data }));

    setMessages((prevMessages) => [...prevMessages, data]);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendChatMessage = async () => {
    if (!currentChat?._id || !socket) return;

    socket?.emit(STOP_TYPING_EVENT, currentChat?._id);

    dispatch(setUnreadMessages({ chatId: currentChat?._id }));

    // Create a temporary message object to show immediately
    const tempMessage: Partial<ChatMessageInterface> = {
      content: message,
      sender: { _id: currentUserId } as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chatId: currentChat?._id,
      _id: `temp-${Date.now()}`, // Temporary ID until we get the real one from server
      // For attachments, you might want to show a preview or loading state
    };

    // Add temp message to local state immediately
    setMessages((prevMessages) => [...prevMessages, tempMessage as ChatMessageInterface]);

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
        // Replace temp message with real message from the server
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg._id === tempMessage._id ? response.data : msg))
        );

        _updateChatLastMessage(currentChat?._id || "", response.data);
      })
      .catch((error: any) => {
        console.error(error);
        // Remove temp message if sending failed
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== tempMessage._id));
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
    if (data?.data) {
      setMessages(data.data);
    }
  }, [data]);

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
