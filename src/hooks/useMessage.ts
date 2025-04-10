import { useAppDispatch } from "./../redux/redux.hooks";
import { useState } from "react";
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
  const { currentChat, unreadMessages } = useAppSelector((state: RootState) => state.chat);
  const dispatch = useAppDispatch();
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

    setMessages(data?.data);
  };

  const onMessageReceive = (data: any) => {
    dispatch(newMessage({ data }));

    // Move the chat to the top of the list
    // setChats((prevChats) => {
    //   const updatedChats = [...prevChats];
    //   const chatIndex = updatedChats.findIndex((chat) => chat._id === data.chat._id);
    //   if (chatIndex > 0) {
    //     const chatToMove = updatedChats[chatIndex];
    //     updatedChats.splice(chatIndex, 1);
    //     updatedChats.unshift(chatToMove);
    //   }
    //   return updatedChats;
    // });
  };

  const sendChatMessage = async () => {
    if (!currentChat?._id || !socket) return;

    socket?.emit(STOP_TYPING_EVENT, currentChat?._id);

    dispatch(setUnreadMessages({ chatId: currentChat?._id }));

    await sendMessage({
      chatId: currentChat?._id as string,
      data: {
        content: message,
        attachments: attachmentFiles,
      },
    })
      .unwrap()
      .then((response) => {
        setMessage("");
        setAttachmentFiles([]);
        _updateChatLastMessage(currentChat?._id || "", response.data);
      })
      .catch((error: any) => {
        console.error(error);
      });
  };

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
  };
};
