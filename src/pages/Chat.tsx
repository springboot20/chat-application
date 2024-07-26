import React, { useEffect, useRef, useState } from "react";
import { MessagePanel } from "../components/panels/MessagePanel.tsx";
import { Disclosure } from "@headlessui/react";
import { ChatModal } from "../components/modal/ChatModal.tsx";
import { Bars3Icon, UserIcon } from "@heroicons/react/24/outline";
import { MessageInputNavigation } from "../components/navigation/MessageInputNavigation.tsx";
import { classNames, LocalStorage, requestHandler } from "../utils/index.ts";
import { ChatListItemInterface, ChatMessageInterface } from "../types/chat.ts";
import { useSocketContext } from "../context/SocketContext.tsx";
import { createMessage, getAllChats, getMessages } from "../api/index.ts";
import { toast } from "react-toastify";


const CONNECTED_EVENT = "connected";
const DISCONNECT_EVENT = "disconnect";
const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";

export const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  const { socket } = useSocketContext();

  const typingTimeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userTyping, setUserTyping] = useState<boolean>(false);

  const [LoadingChats, setLoadingChats] = useState<boolean>(false);
  const [LoadingMessages, setLoadingMessages] = useState<boolean>(false);

  const [attachmentFiles, setAttachmentFiles] = useState<File[] | undefined>(
    []
  );
  const currentChat = useRef<ChatListItemInterface | null>(null);

  const [message, setMessage] = useState<string>("");

  const [chats, setChats] = useState<ChatListItemInterface[]>([]);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  const [unreadMessages, setUnReadMessages] = useState<ChatMessageInterface[]>(
    []
  );


  const getChats = () => {
    requestHandler({
      api: async () => await getAllChats(),
      setLoading: setLoadingChats,
      onSuccess: (res) => {
        setChats(res);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const updatedLastMessage = (
    chatToUpateId: string,
    message: ChatMessageInterface
  ) => {
    const chatToUpate = chats.find((chat) => chat._id === chatToUpateId)!;

    chatToUpate.lastMessage = message;
    chatToUpate.updatedAt = message.updatedAt;

    setChats([chatToUpate, ...chats.filter((c) => c._id !== chatToUpateId)]);
  };

  const sendMessage = () => {
    if (!currentChat.current?._id === !socket) return;

    // Emit a STOP_TYPING_EVENT to inform other users/participants that typing has stopped
    socket!.emit(STOP_TYPING_EVENT, currentChat.current?._id);

    requestHandler({
      api: async () =>
        await createMessage(currentChat?.current?._id ?? "", {
          content: message,
          attachments: attachmentFiles,
        }),
      setLoading: null,
      onSuccess: (res) => {
        setMessage("");
        setAttachmentFiles([]);
        setMessages((prev) => [res.data, ...prev]);
        updatedLastMessage(currentChat.current?._id!, res.data);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!socket || !isConnected) return;

    if (!userTyping) {
      setUserTyping(true);
    }

    if (typingTimeOutRef.current !== null) {
      clearTimeout(typingTimeOutRef.current);
    }

    const timerLength = 3000;
    if (typingTimeOutRef.current) {
      typingTimeOutRef.current = setTimeout(() => {
        setUserTyping(false);
      }, timerLength);
    }
  };

  const handleMessageReceived = (message: ChatMessageInterface) => {
    if (message._id !== currentChat.current?._id) {
      setUnReadMessages((prev) => [message, ...prev]);
    } else {
      setMessages((prev) => [message, ...prev]);
    }

    updatedLastMessage(currentChat.current?._id!, message);
  };

  const getAllChatMessages = () => {
    if (!currentChat.current?._id === !socket) return;

    if (!socket) return toast.error("Socket not available");

    setUnReadMessages(
      unreadMessages.filter(
        (message) => message._id !== currentChat.current?._id
      )
    );

    requestHandler({
      api: async () => await getMessages(currentChat.current?._id!),
      setLoading: setLoadingMessages,
      onSuccess: (res) => {
        setMessages(res.data ?? []);
      },
      onError: (error, toast) => {
        toast(error);
      },
    });
  };

  useEffect(() => {
    getChats();

    const currentChatFromStorge = LocalStorage.get("current-chat");

    if (currentChatFromStorge) {
      currentChat.current = currentChatFromStorge;

      getAllChatMessages();
    }

    // Cleanup the timeout when the component unmounts
    return () => {
      if (typingTimeOutRef.current) {
        clearTimeout(typingTimeOutRef.current);
      }
    }

  }, []);

  const onConnect = () => {
    setIsConnected(true);
  };

  const onDisconnect = () => {
    setIsConnected(false);
  };

  useEffect(() => {
    if (!socket) return;

  
    socket.on(CONNECTED_EVENT, onConnect);

    socket.on(DISCONNECT_EVENT, onDisconnect);

    // socket.on(TYPING_EVENT, handleOnSocketTyping);

    // socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);

    socket.on(MESSAGE_RECEIVED_EVENT, handleMessageReceived);

    // socket.on(NEW_CHAT_EVENT, onNewChat);
    
    // socket.on(LEAVE_CHAT_EVENT, onChatLeave);
    
    // socket.on(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);

    
    return () => {
      
      socket.off(CONNECTED_EVENT, onConnect);
      socket.off(DISCONNECT_EVENT, onDisconnect);
      // socket.off(TYPING_EVENT, handleOnSocketTyping);
      // socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
      socket.off(MESSAGE_RECEIVED_EVENT, handleMessageReceived);
      // socket.off(NEW_CHAT_EVENT, onNewChat);
      // socket.off(LEAVE_CHAT_EVENT, onChatLeave);
      // socket.off(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
    };

    // Note:
    // The `chats` array is used in the `onMessageReceived` function.
    // We need the latest state value of `chats`. If we don't pass `chats` in the dependency array,
    // the `onMessageReceived` will consider the initial value of the `chats` array, which is empty.
    // This will not cause infinite renders because the functions in the socket are getting mounted and not executed.
    // So, even if some socket callbacks are updating the `chats` state, it's not
    // updating on each `useEffect` call but on each socket call.
  }, [socket, chats]);


  console.log(messages)

  return (
    <Disclosure as={"div"}>
      {({ open }) => (
        <React.Fragment>
          <ChatModal open={openChat} onClose={() => setOpenChat(false)} />
          <div
            className={classNames(
              "w-full flex items-stretch h-screen flex-shrink-0",
              open ? "lg:justify-between" : ""
            )}
          >
            <MessagePanel
              setMessage={setMessage}
              setChats={setChats}
              getAllChatMessages={getAllChatMessages}
              unreadMessages={unreadMessages}
              chats={chats}
              currentChat={currentChat}
              loadingChats={LoadingChats}
              open={open}
              setOpenChat={setOpenChat} />
            <main
              className={classNames(
                "w-full sticky min-h-screen right-0 overflow-hidden transition-all",
                open
                  ? "lg:left-[35rem] lg:w-[calc(100%-35rem)] "
                  : "left-0 w-full flex-1"
              )}
            >
              <div className="w-full flex flex-col justify-between h-full">
                <header
                  className={classNames(
                    "fixed top-0 right-0 p-[0.9rem] left-0 bg-white dark:bg-gray-800 border-b-[1.5px] border-b-gray-600/30 z-10 transition-all",
                    open ? "lg:left-[35rem]" : ""
                  )}
                >
                  <div className="flex justify-between items-center h-full">
                    <div className="flex items-center gap-5">
                      <Disclosure.Button>
                        <Bars3Icon className="text-gray-800 h-10" />
                      </Disclosure.Button>

                      <div className="flex items-start space-x-4">
                        <span className="flex items-center justify-center h-12 w-12 rounded-lg dark:bg-white cursor-pointer">
                          <UserIcon className="h-10 w-10 text-gray-600" />
                        </span>
                        <div className="">
                          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                            Florencio Dorrance
                          </h3>
                          <p className="inline-flex items-center space-x-4">
                            <span className="h-3 w-3 rounded-full bg-green-400 block"></span>
                            <span className="text-xl font-medium dark:text-white">
                              Online
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </header>
                <div className="relative gap-6 h-screen flex flex-col flex-grow overflow-hidden flex-shrink-0 mt-20 w-full">
                  <div className="flex flex-col flex-grow p-4 overflow-auto gap-10">
                    <div className="flex w-full mt-2 gap-2 md:max-w-xl lg:max-w-3xl">
                      <span className="block h-20 w-20 p-4 bg-white shadow rounded-md"></span>
                      <div className="bg-[#A79BE1B2] w-full rounded-2xl p-4 lg:py-8 lg:px-12"></div>
                    </div>

                    <div className="justify-end flex w-full mt-2 gap-2 md:max-w-xl ml-auto lg:max-w-3xl">
                      <div className="bg-[#A79BE1B2] w-full rounded-2xl p-4 lg:py-8 lg:px-12"></div>
                      <span className="block h-20 w-20 p-4 bg-white shadow rounded-md"></span>
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 p-4 w-full gap-2 left-28 lg:left-[40rem] right-0 h-28 bg-white dark:bg-gray-800 z-10 border-t-[1.5px] border-b-[1.5px] border-gray-600/30">
                  <MessageInputNavigation
                    setAttachmentFiles={setAttachmentFiles}
                    handleMessageInput={handleMessageInput}
                    sendMessage={sendMessage}
                    message={message}
                    attachedFiles={attachmentFiles}
                  />
                </div>
              </div>
            </main>
          </div>
        </React.Fragment>
      )}
    </Disclosure>
  );
};
