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

export const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  const { socket } = useSocketContext();

  const typingTimeOutRef = useRef(null);
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

    if (typingTimeOutRef.current) {
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
  }, []);

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
            <MessagePanel open={open} setOpenChat={setOpenChat} />
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
