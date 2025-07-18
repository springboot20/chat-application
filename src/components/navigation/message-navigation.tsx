import { Disclosure } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faClose } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useEffect, useMemo, memo, useRef, useState } from "react";
import { ChevronLeftIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ChatModal } from "../modal/ChatModal.tsx";
import { SearchInput } from "../panels/SearchInput.tsx";
import { ChatItem } from "../chat/ChatItem.tsx";
import { Loading } from "../Loading.tsx";
import { classNames, getMessageObjectMetaData } from "../../utils/index.ts";
import { ChatListItemInterface, ChatMessageInterface } from "../../types/chat.ts";
import { User } from "../../types/auth.ts";
import { useAppDispatch } from "../../redux/redux.hooks.ts";
import { onChatDelete, setCurrentChat } from "../../features/chats/chat.reducer.ts";

export const MessageNavigation: React.FC<{
  open: boolean;
  close: () => any;
  user: User | null;
  currentChat: ChatListItemInterface;
  chats: ChatListItemInterface[];
  isLoadingChats: boolean;
  unreadMessages: ChatMessageInterface[];
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  getAllMessages: () => void;
  refetchChats: () => any;
}> = memo(
  ({
    open,
    close,
    currentChat,
    chats,
    isLoadingChats,
    unreadMessages,
    user,
    setMessage,
    getAllMessages,
    refetchChats,
  }) => {
    const [itemDeleted, setItemDeleted] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
    const [openChat, setOpenChat] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const dispatch = useAppDispatch();

    useEffect(() => {
      if (itemDeleted) {
        // refetch();
        setItemDeleted(false);
      }
    }, [itemDeleted]);

    const handleChatSelect = useCallback(
      (chat: ChatListItemInterface) => {
        if (currentChat && currentChat?._id === chat?._id) return;

        dispatch(setCurrentChat({ chat }));
        setMessage("");
        getAllMessages();

        close();
      },
      [close, currentChat, dispatch, getAllMessages, setMessage]
    );

    const handleChatDelete = useCallback(
      (chatId: string) => {
        setItemDeleted(true);
        dispatch(onChatDelete({ chatId }));
      },
      [dispatch]
    );

    // Consistent logic for calculating unread messages
    const getUnreadCount = useCallback(
      (chatId: string) => {
        return unreadMessages?.filter((msg) => msg?.chat === chatId)?.length || 0;
      },
      [unreadMessages]
    );

    const filteredChats = useMemo(
      () =>
        chats?.filter((chat) =>
          localSearchQuery
            ? getMessageObjectMetaData(chat, user!).title?.toLowerCase().includes(localSearchQuery)
            : true
        ) || [],
      [chats, localSearchQuery, user]
    );

    const handleCloseChat = useCallback(() => {
      setOpenChat(false);
    }, []);

    const handleClickOutside = useCallback(
      (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (!target.closest(".mobile-navigation") && !target.closest(".group-navigation")) {
          close();
        }
      },
      [close]
    );

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [handleClickOutside]);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 1000);
      return () => clearTimeout(timer);
    }, []);

    console.log("Rerendering MessageNavigation");

    return (
      <>
        <ChatModal open={openChat} onClose={handleCloseChat} onSuccess={() => refetchChats()} />
        <div
          className={`fixed left-20 w-[25rem] bg-white dark:bg-black flex-1 border-r-[1.5px] border-r-gray-600/30 h-screen translate-x-0 hidden lg:block
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
            <div className="flex justify-between items-center w-full p-3 border-b-[1.5px] border-b-gray-600/30">
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
              <div className="w-full rounded-md border border-gray-400 flex items-center h-12 bg-gray-100/60 dark:bg-black dark:ring-1 dark:ring-white/10">
                <button
                  title="search icon"
                  type="button"
                  className="px-2 py-2 flex items-center justify-center"
                >
                  <MagnifyingGlassIcon
                    className="h-7 text-gray-700 dark:text-white"
                    aria-hidden={true}
                  />
                </button>

                <SearchInput
                  ref={inputRef}
                  placeholder="Search messages"
                  onChange={(e) => {
                    setLocalSearchQuery(e.target.value.toLowerCase());
                    setIsSearching(true);
                  }}
                  onBlur={() => setIsSearching(false)}
                  value={localSearchQuery}
                  className="flex-1 h-full bg-transparent focus:ring-0 focus:outline-none dark:text-white dark:placeholder:text-white/60"
                />
              </div>
              {isLoadingChats || isSearching ? (
                <div className="w-full mx-auto flex items-center justify-center mt-5">
                  <Loading />
                </div>
              ) : filteredChats.length > 0 ? (
                <div className="mt-3 flex flex-col">
                  {React.Children.toArray(
                    filteredChats.map((chat) => (
                      <ChatItem
                        key={`chat-item-${chat?._id}`}
                        chat={chat}
                        isActive={chat?._id === currentChat?._id}
                        user={user}
                        onClick={handleChatSelect}
                        onChatDelete={handleChatDelete}
                        close={close}
                        unreadCount={getUnreadCount(chat._id)}
                        refetchChats={refetchChats}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center">
                  <Loading />
                  <p className="font-nunito font-normal dark:text-white text-center mt-3">
                    no chat found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Disclosure.Panel
          className={classNames(
            "fixed w-full sm:w-[25rem] bg-white dark:bg-black dark:border-r-white/15 flex-1 border-r-[1.5px] border-r-gray-600/30 h-screen z-30 translate-x-0 lg:hidden",
            "mobile-navigation",
            open ? "translate-x-0 left-0" : "-translate-x-full"
          )}
        >
          <Disclosure.Button
            className={
              "absolute right-7 flex items-center justify-center bottom-10 bg-[#615EF0] h-8 w-8 rounded-full lg:hidden"
            }
          >
            <span className="sr-only">Close panel</span>
            <ChevronLeftIcon className="h-5 w-5 text-white" aria-hidden={true} strokeWidth={3} />
          </Disclosure.Button>

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
              <div className="w-full rounded-md border border-gray-400 flex items-center h-12 bg-gray-100/60 dark:bg-black dark:ring-1 dark:ring-white/10">
                <button
                  title="search icon"
                  type="button"
                  className="px-2 py-2 flex items-center justify-center"
                >
                  <MagnifyingGlassIcon className="h-7 text-gray-700" aria-hidden={true} />
                </button>

                <SearchInput
                  ref={inputRef}
                  placeholder="Search messages"
                  onChange={(e) => setLocalSearchQuery(e.target.value.toLowerCase())}
                  value={localSearchQuery}
                  className="flex-1 h-full bg-transparent focus:ring-0 focus:outline-none dark:text-white dark:placeholder:text-white/60"
                />
              </div>
              {isLoadingChats || isSearching ? (
                <div className="w-full mx-auto flex items-center justify-center mt-5">
                  <Loading />
                </div>
              ) : filteredChats ? (
                <div className="mt-3 flex flex-col">
                  {React.Children.toArray(
                    filteredChats.map((chat) => (
                      <ChatItem
                        key={`chat-item-${chat._id}`}
                        chat={chat}
                        isActive={chat?._id === currentChat?._id}
                        user={user}
                        onClick={handleChatSelect}
                        onChatDelete={handleChatDelete}
                        unreadCount={getUnreadCount(chat._id)}
                        refetchChats={refetchChats}
                        close={close}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center">
                  <Loading />
                  <p className="font-nunito font-normal dark:text-white text-center mt-3">
                    no chat found
                  </p>
                </div>
              )}
            </div>
          </div>
        </Disclosure.Panel>
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      prevProps.open === nextProps.open &&
      prevProps.refetchChats === nextProps.refetchChats &&
      prevProps.currentChat?._id === nextProps.currentChat?._id &&
      prevProps.chats.length === nextProps.chats.length &&
      prevProps.isLoadingChats === nextProps.isLoadingChats &&
      prevProps.unreadMessages.length === nextProps.unreadMessages.length
    );
  }
);
