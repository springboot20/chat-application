import React, { useRef, useState } from "react";
import { Disclosure } from "@headlessui/react";
import { ChatModal } from "../components/modal/ChatModal.tsx";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "../utils/index.ts";
import { ChatListItemInterface } from "../types/chat.ts";
import { useSocketContext } from "../context/SocketContext.tsx";
import EmojiPicker from "emoji-picker-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faClose } from "@fortawesome/free-solid-svg-icons";
import { SearchInput } from "../components/panels/SearchInput.tsx";

export const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  const { socket } = useSocketContext();
  const typingTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userTyping, setUserTyping] = useState<boolean>(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[] | undefined>([]);
  const currentChat = useRef<ChatListItemInterface | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Disclosure as={"div"}>
      {({ open }) => (
        <React.Fragment>
          <ChatModal open={openChat} onSuccess={() => {}} onClose={() => setOpenChat(false)} />
          <div
            className={classNames(
              "w-full flex items-stretch h-screen flex-shrink-0",
              open ? "lg:justify-between" : ""
            )}
          >
            <div
              className={`fixed w-[25rem] bg-white dark:bg-gray-800 flex-1 border-r-[1.5px] border-r-gray-600/30 h-screen z-10 translate-x-0 hidden lg:block
              `}
            >
              <div className="flex flex-col items-center gap-8 h-full">
                <Disclosure.Button
                  className={"absolute right-0 bottom-9 h-14 w-14 rounded-full lg:hidden"}
                >
                  <span className="sr-only">Close panel</span>
                  <FontAwesomeIcon
                    icon={faClose}
                    className="h-7 w-7 stroke-[4] text-gray-500 dark:text-white"
                    aria-hidden={true}
                  />
                </Disclosure.Button>

                <div className="flex justify-between items-center w-full p-4 border-b-[1.5px] border-b-gray-600/30">
                  <div className="flex items-center">
                    <span className="text-xl block text-gray-600 font-medium dark:text-white">
                      Messages
                    </span>
                    <button className={"h-14 w-14 rounded-full"}>
                      <span className="sr-only">Open Messages</span>
                      <FontAwesomeIcon
                        icon={faCaretDown}
                        className="h-7 w-7 stroke-[4] text-gray-500 dark:text-white"
                        aria-hidden={true}
                      />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="block p-3 rounded-full bg-[#615EF0]"
                    onClick={() => setOpenChat((prev) => !prev)}
                  >
                    <span className="sr-only">plus icon</span>
                    <PlusIcon className="h-5 stroke-[4] text-white" aria-hidden={true} />
                  </button>
                </div>
                <div className="px-3 w-full">
                  <div className="w-full rounded-md border border-gray-400 flex items-center h-12 bg-gray-100/60">
                    <button
                      type="button"
                      className="px-2 py-2 flex items-center justify-center"
                      // onClick={handleFocus}
                    >
                      <MagnifyingGlassIcon className="h-7 text-gray-700" aria-hidden={true} />
                    </button>

                    <SearchInput
                      ref={inputRef}
                      placeholder="Search messages"
                      onChange={(e) => setLocalSearchQuery(e.target.value.toLowerCase())}
                      value={localSearchQuery}
                      className="flex-1 h-full bg-transparent focus:ring-0 focus:outline-none"
                    />
                  </div>
                  {/* {loadingChats ? (
                    <div className="w-full mx-auto flex items-center justify-center mt-5">
                      <Loading />
                    </div>
                  ) : (
                    [...chats]
                      .filter((chat) =>
                        localSearchQuery
                          ? getMessageObjectMetaData(chat, user!)
                              .title?.toLowerCase()
                              .includes(localSearchQuery)
                          : true
                      )
                      .map((chat) => (
                        <ChatItem
                          key={chat.name}
                          onClick={(chat) => {
                            if (currentChat.current?._id && currentChat.current?._id === chat._id)
                              return;

                            console.log(chat);
                            LocalStorage.set("currentChat", chat);
                            currentChat.current = chat;
                            setMessage("");
                            getAllChatMessages();
                          }}
                          chat={chat}
                          isActive={chat._id === currentChat.current?._id}
                          onChatMessageDelete={(chatId: string) => {
                            setChats((prev) => prev.filter((chat) => chat._id !== chatId));
                            if (currentChat.current?._id === chatId) {
                              currentChat.current = null;
                              LocalStorage.remove("currentChat");
                            }
                          }}
                          unreadMessageCount={
                            unreadMessages.filter((c) => c._id === chat._id).length
                          }
                        />
                      ))
                  )} */}
                </div>
              </div>
            </div>

            <Disclosure.Panel
              className={`fixed w-full sm:w-[25rem] bg-white dark:bg-gray-800 flex-1 border-r-[1.5px] border-r-gray-600/30 h-screen z-10 translate-x-0 lg:hidden
                ${open ? "translate-x-0 left-0" : "-translate-x-full"}
              `}
            >
              <div className="flex flex-col items-center gap-8 h-full">
                <div className="flex justify-between items-center w-full p-4 border-b-[1.5px] border-b-gray-600/30">
                  <div className="flex items-center">
                    <span className="text-xl block text-gray-600 font-medium dark:text-white">
                      Messages
                    </span>
                    <button className={"h-10 w-10 rounded-full"}>
                      <span className="sr-only">Open Messages</span>
                      <FontAwesomeIcon
                        icon={faCaretDown}
                        className="h-7 w-7 text-gray-500 dark:text-white"
                        aria-hidden={true}
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="block p-3 rounded-full bg-[#615EF0]"
                    onClick={() => setOpenChat((prev) => !prev)}
                  >
                    <span className="sr-only">plus icon</span>
                    <PlusIcon className="h-5 stroke-[4] text-white" aria-hidden={true} />
                  </button>
                </div>
                <div className="px-3 w-full">
                  <div className="w-full rounded-md border border-gray-400 flex items-center h-12 bg-gray-100/60">
                    <button
                      type="button"
                      className="px-2 py-2 flex items-center justify-center"
                      // onClick={handleFocus}
                    >
                      <MagnifyingGlassIcon className="h-7 text-gray-700" aria-hidden={true} />
                    </button>

                    <SearchInput
                      ref={inputRef}
                      placeholder="Search messages"
                      onChange={(e) => setLocalSearchQuery(e.target.value.toLowerCase())}
                      value={localSearchQuery}
                      className="flex-1 h-full bg-transparent focus:ring-0 focus:outline-none"
                    />
                  </div>
                  {/* {loadingChats ? (
                    <div className="w-full mx-auto flex items-center justify-center mt-5">
                      <Loading />
                    </div>
                  ) : (
                    [...chats]
                      .filter((chat) =>
                        localSearchQuery
                          ? getMessageObjectMetaData(chat, user!)
                              .title?.toLowerCase()
                              .includes(localSearchQuery)
                          : true
                      )
                      .map((chat) => (
                        <ChatItem
                          key={chat.name}
                          onClick={(chat) => {
                            if (currentChat.current?._id && currentChat.current?._id === chat._id)
                              return;

                            console.log(chat);
                            LocalStorage.set("currentChat", chat);
                            currentChat.current = chat;
                            setMessage("");
                            getAllChatMessages();
                          }}
                          chat={chat}
                          isActive={chat._id === currentChat.current?._id}
                          onChatMessageDelete={(chatId: string) => {
                            setChats((prev) => prev.filter((chat) => chat._id !== chatId));
                            if (currentChat.current?._id === chatId) {
                              currentChat.current = null;
                              LocalStorage.remove("currentChat");
                            }
                          }}
                          unreadMessageCount={
                            unreadMessages.filter((c) => c._id === chat._id).length
                          }
                        />
                      ))
                  )} */}
                </div>
              </div>
            </Disclosure.Panel>
            <main
              className={classNames(
                "w-full sticky min-h-screen right-0 overflow-hidden transition-all",
                "lg:left-[25rem] lg:w-[calc(100%-25rem)]"
                // open ? "lg:left-[25rem] lg:w-[calc(100%-25rem)]" : "left-0 w-full flex-1"
              )}
            >
              <div className="w-full flex flex-col justify-between h-full">
                <header
                  className={classNames(
                    "fixed top-0 right-0 p-[0.9rem] left-0 bg-white dark:bg-gray-800 border-b-[1.5px] border-b-gray-600/30 z-10 transition-all lg:left-[25rem]"
                    // open ? "lg:left-[25rem]" : ""
                  )}
                >
                  <div className="flex justify-between items-center h-full">
                    <div className="flex items-start space-x-4">
                      <span className="flex items-center justify-center h-12 w-12 rounded-full border cursor-pointer">
                        <UserIcon className="h-7 w-7 text-gray-600" />
                      </span>
                      <div className="">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                          Florencio Dorrance
                        </h3>
                        <p className="inline-flex items-center space-x-1.5">
                          <span className="h-3 w-3 rounded-full bg-green-400 animate-ping block"></span>
                          <span className="text-sm font-medium dark:text-white">Online</span>
                        </p>
                      </div>
                    </div>

                    <Disclosure.Button className="lg:hidden">
                      {open ? (
                        <FontAwesomeIcon
                          icon={faClose}
                          className="h-7 w-7 text-gray-500 dark:text-white"
                          aria-hidden={true}
                          strokeWidth={2.5}
                        />
                      ) : (
                        <Bars3Icon className="text-gray-800 h-10" />
                      )}
                    </Disclosure.Button>
                  </div>
                </header>
                <div className="relative gap-6 h-screen flex flex-col flex-grow overflow-hidden flex-shrink-0 mt-20 w-full">
                  <div className="flex flex-col flex-grow p-4 overflow-auto gap-10">
                    {/* {loadingMessages ? (
                      <div className="flex justify-center items-center h-[calc(100%-88px)]">
                        <Typing />
                      </div>
                    ) : (
                      <>
                        {isTyping ? <Typing /> : null}
                        {messages?.map((msg) => {
                          return (
                            <MessageItem
                              key={msg._id}
                              isOwnedMessage={msg.sender?._id === user?._id}
                              isGroupChatMessage={currentChat.current?.isGroupChat}
                              message={msg}
                            />
                          );
                        })}
                      </>
                    )} */}
                  </div>
                </div>
                <div className="sticky bottom-0 p-4 w-full gap-2 left-28 lg:left-[40rem] right-0 h-28 bg-white dark:bg-gray-800 z-10 border-t-[1.5px] border-b-[1.5px] border-gray-600/30">
                  <div className="h-full z-10 p-4 flex items-center justify-between mx-auto max-w-8xl">
                    <input
                      hidden
                      multiple
                      type="file"
                      id="files"
                      max={5}
                      onChange={(event) => {
                        if (event.target.files) {
                          setAttachmentFiles([...event.target.files]);
                        }
                      }}
                    />
                    <label htmlFor="files" className="mr-4">
                      <PaperClipIcon className="cursor-pointer w-10 h-10 fill-none stroke-gray-400 dark:stroke-white hover:stroke-gray-700 transition" />
                    </label>
                    <EmojiPicker open={false} />
                    <input
                      id="message-input"
                      type="text"
                      value={""}
                      onChange={() => {}}
                      // onKeyDown={(e) => {
                      //   if (e.key == "Enter") {
                      //     sendMessage();
                      //   }
                      // }}
                      className="relative block px-4 py-3.5 focus:outline-none hover:border-indigo-400 rounded-md border-gray-600/30 border-2 w-full"
                      placeholder="Type a message..."
                    />
                    <button
                      // disabled={!message && attachmentFiles!.length <= 0}
                      className="shadow-none"
                      // onClick={() => {
                      //   sendMessage();

                      //   console.log(message);
                      // }}
                    >
                      <PaperAirplaneIcon aria-hidden={true} className="h-12 text-violet-500" />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </React.Fragment>
      )}
    </Disclosure>
  );
};
