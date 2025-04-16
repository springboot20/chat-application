import React, { Fragment, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  PaperAirplaneIcon,
  PaperClipIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "../utils/index.ts";
import { useSocketContext } from "../context/SocketContext.tsx";
// import EmojiPicker from "emoji-picker-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { MessageNavigation } from "../components/navigation/message-navigation.tsx";
import SideNavigation from "../components/navigation/side-navigation.tsx";
import { Link } from "react-router-dom";
import {
  JOIN_CHAT_EVENT,
  MESSAGE_RECEIVED_EVENT,
  NEW_CHAT_EVENT,
  STOP_TYPING_EVENT,
  TYPING_EVENT,
  LEAVE_CHAT_EVENT,
} from "../enums/index.ts";
import { useChat } from "../hooks/useChat.ts";
import { useTyping } from "../hooks/useTyping.ts";
import { useNetwork } from "../hooks/useNetwork.ts";
import { useMessage } from "../hooks/useMessage.ts";
import Typing from "../components/Typing.tsx";
import { MessageItem } from "../components/chat/MessageItem.tsx";
import { useLogoutMutation } from "../features/auth/auth.slice.ts";
import { useAppDispatch, useAppSelector } from "../redux/redux.hooks.ts";
import { RootState } from "../app/store.ts";
import { toast } from "react-toastify";
import { updateChatLastMessage, setCurrentChat } from "../features/chats/chat.reducer.ts";
import { useGetChatMessagesQuery, useSendMessageMutation } from "../features/chats/chat.slice.ts";

export const Chat = () => {
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);
  const { currentChat, chatMessages: reduxStateMessages } = useAppSelector(
    (state: RootState) => state.chat
  );
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const [sendMessage] = useSendMessageMutation();

  const { socket } = useSocketContext();
  const { onNewChat, _onChatLeave, chats } = useChat();
  const { isOnline } = useNetwork();

  const {
    data: _,
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useGetChatMessagesQuery(currentChat?._id ?? "", {
    skip: !currentChat?._id,
  });

  const {
    message,
    setAttachmentFiles,
    getAllMessages,
    handleOnMessageChange,
    attachmentFiles,
    onMessageReceive,
    bottomRef,
    setMessage,
  } = useMessage();

  const { handleStartTyping, isTyping, handleStopTyping } = useTyping();

  const sendChatMessage = async () => {
    if (!currentChat?._id || !socket) return;

    socket?.emit(STOP_TYPING_EVENT, currentChat?._id);

    // Clear input fields immediately for better UX
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
        // Update the Redux store
        dispatch(
          updateChatLastMessage({
            chatToUpdateId: currentChat._id!,
            message: response.data,
          })
        );
      })
      .catch((error: any) => {
        console.error(error);
        toast("Failed to send message", { type: "error" });
      });
  };

  useEffect(() => {
    // Run getChats only once when component mounts or socket changes
    if (currentChat?._id) {
      socket?.emit(JOIN_CHAT_EVENT, currentChat?._id);
      getAllMessages();
      refetchMessages()
    }
  }, [currentChat,refetchMessages, getAllMessages, socket]);

  useEffect(() => {
    if (!socket) return;

    socket?.on(TYPING_EVENT, handleStartTyping);
    socket?.on(STOP_TYPING_EVENT, handleStopTyping);
    socket?.on(MESSAGE_RECEIVED_EVENT, onMessageReceive);
    socket?.on(NEW_CHAT_EVENT, onNewChat);
    socket?.on(LEAVE_CHAT_EVENT, _onChatLeave);

    return () => {
      socket?.off(TYPING_EVENT, handleStartTyping);
      socket?.off(STOP_TYPING_EVENT, handleStopTyping);
      socket?.off(MESSAGE_RECEIVED_EVENT, onMessageReceive);
      socket?.off(NEW_CHAT_EVENT, onNewChat);
      socket?.off(LEAVE_CHAT_EVENT, _onChatLeave);
    };
  }, [
    socket,
    chats,
    handleStartTyping,
    handleStopTyping,
    onMessageReceive,
    onNewChat,
    _onChatLeave,
  ]);

  return (
    <Disclosure as={"div"}>
      {({ open }) => (
        <React.Fragment>
          <div
            className={classNames(
              "w-full flex items-stretch h-screen flex-shrink-0",
              open ? "lg:justify-between" : ""
            )}
          >
            <div className="">
              <SideNavigation />
              <MessageNavigation open={open}  />
            </div>
            <main
              className={classNames(
                "w-full sticky min-h-screen right-0 overflow-hidden transition-all",
                "left-20 lg:left-[30rem] lg:w-[calc(100%-30rem)]"
              )}
            >
              <div className=" flex flex-col justify-between h-full">
                {currentChat && currentChat._id ? (
                  <>
                    <header
                      className={classNames(
                        "fixed top-0 right-0 p-[0.9rem] left-20 bg-white dark:bg-gray-800 border-b-[1.5px] border-b-gray-600/30 z-10 transition-all lg:left-[30rem]"
                      )}
                    >
                      <div className="flex justify-between items-center h-full">
                        <div className="flex items-center gap-8">
                          <button
                            title="close chat"
                            className="flex items-center justify-center"
                            onClick={(event) => {
                              event.stopPropagation();

                              dispatch(setCurrentChat({ chat: null }));
                            }}
                          >
                            <ArrowLeftIcon className="h-8 w-8" />
                          </button>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                              Florencio Dorrance
                            </h3>
                            <p className="inline-flex items-center space-x-1.5">
                              <span
                                className={classNames(
                                  "h-3 w-3 rounded-full block",
                                  isOnline ? "bg-green-400 animate-ping" : "bg-red-500"
                                )}
                              ></span>
                              <span
                                className={classNames(
                                  "text-sm font-semibold",
                                  isOnline ? "text-green-600" : "text-red-400"
                                )}
                              >
                                {isOnline ? "online" : "offline"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAuthenticated ? (
                            <>
                              <Menu as="div" className="relative z-30">
                                <div>
                                  <Menu.Button className="flex dark:text-white text-gray-900">
                                    <span className="sr-only">Open auth menu</span>
                                    <span className="flex items-center justify-center h-12 w-12 rounded-full border cursor-pointer dark:border-2">
                                      <UserIcon className="h-7 w-7 text-gray-600 dark:text-white" />
                                    </span>
                                  </Menu.Button>
                                </div>
                                <Transition
                                  as={Fragment}
                                  enter="transition ease-out duration-100"
                                  enterFrom="transform opacity-0 scale-95"
                                  enterTo="transform opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="transform opacity-100 scale-100"
                                  leaveTo="transform opacity-0 scale-95"
                                >
                                  <Menu.Items className="absolute right-0 z-30 mt-4 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={async () => {
                                            await logout()
                                              .unwrap()
                                              .then((response) => {
                                                toast(response?.data?.message, { type: "success" });
                                              })
                                              .catch((error: any) => {
                                                toast(error?.data?.message, { type: "error" });
                                              });
                                          }}
                                          className={classNames(
                                            active ? "bg-gray-100" : "",
                                            "flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800 font-medium"
                                          )}
                                        >
                                          <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              clipRule="evenodd"
                                              d="M10.0002 3.33325C9.63198 3.33325 9.33351 3.63173 9.33351 3.99992V8.66658C9.33351 9.03477 9.63198 9.33325 10.0002 9.33325C10.3684 9.33325 10.6668 9.03477 10.6668 8.66658V3.99992C10.6668 3.63173 10.3684 3.33325 10.0002 3.33325ZM7.75481 5.15601C7.57736 4.83362 7.17313 4.71436 6.85193 4.88963C6.30381 5.18873 5.79855 5.56625 5.3492 6.0156C2.7632 8.6016 2.77739 12.8085 5.38089 15.412C7.98438 18.0155 12.1913 18.0297 14.7773 15.4437C17.3633 12.8577 17.3491 8.65079 14.7456 6.0473C14.3186 5.62027 13.8421 5.25686 13.3271 4.96269C13.0076 4.78016 12.6023 4.89024 12.4219 5.20858C12.2415 5.52691 12.3543 5.93294 12.6739 6.11548C13.0855 6.35062 13.4667 6.64134 13.8091 6.98377C15.8919 9.06656 15.9033 12.4321 13.8345 14.5009C11.7657 16.5697 8.40015 16.5583 6.31736 14.4755C4.23456 12.3927 4.22321 9.02721 6.292 6.95841C6.65231 6.5981 7.05643 6.29616 7.49451 6.0571C7.81571 5.88183 7.93225 5.4784 7.75481 5.15601Z"
                                              fill="black"
                                            />
                                            <mask
                                              id="mask0_329_12040"
                                              maskUnits="userSpaceOnUse"
                                              x="3"
                                              y="3"
                                              width="14"
                                              height="15"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M10.0002 3.33325C9.63198 3.33325 9.33351 3.63173 9.33351 3.99992V8.66658C9.33351 9.03477 9.63198 9.33325 10.0002 9.33325C10.3684 9.33325 10.6668 9.03477 10.6668 8.66658V3.99992C10.6668 3.63173 10.3684 3.33325 10.0002 3.33325ZM7.75481 5.15601C7.57736 4.83362 7.17313 4.71436 6.85193 4.88963C6.30381 5.18873 5.79855 5.56625 5.3492 6.0156C2.7632 8.6016 2.77739 12.8085 5.38089 15.412C7.98438 18.0155 12.1913 18.0297 14.7773 15.4437C17.3633 12.8577 17.3491 8.65079 14.7456 6.0473C14.3186 5.62027 13.8421 5.25686 13.3271 4.96269C13.0076 4.78016 12.6023 4.89024 12.4219 5.20858C12.2415 5.52691 12.3543 5.93294 12.6739 6.11548C13.0855 6.35062 13.4667 6.64134 13.8091 6.98377C15.8919 9.06656 15.9033 12.4321 13.8345 14.5009C11.7657 16.5697 8.40015 16.5583 6.31736 14.4755C4.23456 12.3927 4.22321 9.02721 6.292 6.95841C6.65231 6.5981 7.05643 6.29616 7.49451 6.0571C7.81571 5.88183 7.93225 5.4784 7.75481 5.15601Z"
                                                fill="white"
                                              />
                                            </mask>
                                            <g mask="url(#mask0_329_12040)">
                                              <rect width="20" height="20" fill="#2C2738" />
                                            </g>
                                          </svg>
                                          <span>Log Out</span>
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          to="/settings"
                                          className={classNames(
                                            active ? "bg-gray-100" : "",
                                            "flex items-center gap-2 px-4 py-2 text-sm text-gray-800 font-medium w-full"
                                          )}
                                        >
                                          <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              clipRule="evenodd"
                                              d="M3.08068 6.65342C2.95174 6.9196 2.83822 7.19324 2.7408 7.47311C2.52691 8.08756 2.78771 8.76665 3.35789 9.07997C3.69208 9.26361 3.90308 9.61278 3.90308 10.0003C3.90308 10.3877 3.69208 10.7369 3.35789 10.9206C2.78771 11.2339 2.52691 11.913 2.7408 12.5274C2.83822 12.8073 2.95174 13.0809 3.08068 13.3471C3.36415 13.9323 4.02834 14.2276 4.6527 14.0462C5.01883 13.9398 5.41487 14.0375 5.68883 14.3114C5.9628 14.5854 6.0605 14.9815 5.9541 15.3476C5.77267 15.9719 6.06803 16.6361 6.65318 16.9196C6.91936 17.0485 7.193 17.1621 7.47287 17.2595C8.08731 17.4734 8.7664 17.2126 9.07973 16.6424C9.26337 16.3082 9.61253 16.0972 10 16.0972C10.3875 16.0972 10.7367 16.3082 10.9203 16.6424C11.2336 17.2126 11.9127 17.4734 12.5272 17.2595C12.807 17.1621 13.0807 17.0485 13.3469 16.9196C13.932 16.6361 14.2274 15.9719 14.0459 15.3476C13.9395 14.9815 14.0372 14.5854 14.3112 14.3114C14.5852 14.0375 14.9812 13.9398 15.3473 14.0462C15.9717 14.2276 16.6359 13.9323 16.9194 13.3471C17.0483 13.0809 17.1618 12.8073 17.2592 12.5274C17.4731 11.913 17.2123 11.2339 16.6421 10.9206C16.308 10.7369 16.097 10.3877 16.097 10.0003C16.097 9.61278 16.308 9.26361 16.6421 9.07997C17.2123 8.76665 17.4731 8.08756 17.2592 7.47311C17.1618 7.19324 17.0483 6.9196 16.9194 6.65342C16.6359 6.06827 15.9717 5.77291 15.3473 5.95435C14.9812 6.06074 14.5852 5.96304 14.3112 5.68908C14.0372 5.41512 13.9395 5.01907 14.0459 4.65295C14.2274 4.02858 13.932 3.36439 13.3469 3.08093C13.0807 2.95198 12.807 2.83846 12.5272 2.74104C11.9127 2.52715 11.2336 2.78795 10.9203 3.35814C10.7367 3.69232 10.3875 3.90333 10 3.90333C9.61253 3.90333 9.26337 3.69232 9.07973 3.35814C8.7664 2.78795 8.08731 2.52715 7.47287 2.74104C7.193 2.83846 6.91936 2.95198 6.65318 3.08093C6.06803 3.36439 5.77267 4.02858 5.9541 4.65295C6.0605 5.01907 5.9628 5.41512 5.68883 5.68908C5.41487 5.96304 5.01883 6.06074 4.6527 5.95435C4.02834 5.77291 3.36415 6.06827 3.08068 6.65342ZM5.23642 10.0003C5.23642 9.10001 4.73696 8.31641 4.00002 7.91145C4.08078 7.67945 4.17461 7.45358 4.28063 7.23471C5.08801 7.46933 5.99514 7.26839 6.63164 6.63189C7.26815 5.99538 7.46909 5.08825 7.23447 4.28088C7.45334 4.17485 7.67921 4.08102 7.9112 4.00026C8.31616 4.7372 9.09976 5.23666 10 5.23666C10.9003 5.23666 11.6839 4.7372 12.0888 4.00026C12.3208 4.08102 12.5467 4.17485 12.7656 4.28088C12.5309 5.08825 12.7319 5.99538 13.3684 6.63189C14.0049 7.26839 14.912 7.46933 15.7194 7.23471C15.8254 7.45358 15.9193 7.67945 16 7.91145C15.2631 8.31641 14.7636 9.10001 14.7636 10.0003C14.7636 10.9005 15.2631 11.6841 16 12.0891C15.9193 12.3211 15.8254 12.5469 15.7194 12.7658C14.912 12.5312 14.0049 12.7321 13.3684 13.3686C12.7319 14.0051 12.5309 14.9123 12.7656 15.7196C12.5467 15.8257 12.3208 15.9195 12.0888 16.0003C11.6839 15.2633 10.9003 14.7639 10 14.7639C9.09976 14.7639 8.31616 15.2633 7.9112 16.0003C7.67921 15.9195 7.45334 15.8257 7.23447 15.7196C7.46909 14.9123 7.26815 14.0051 6.63164 13.3686C5.99514 12.7321 5.08801 12.5312 4.28063 12.7658C4.17461 12.5469 4.08078 12.3211 4.00002 12.0891C4.73696 11.6841 5.23642 10.9005 5.23642 10.0003ZM11.3334 10.0003C11.3334 10.7366 10.7364 11.3336 10 11.3336C9.26364 11.3336 8.66669 10.7366 8.66669 10.0003C8.66669 9.26388 9.26364 8.66693 10 8.66693C10.7364 8.66693 11.3334 9.26388 11.3334 10.0003Z"
                                              fill="black"
                                            />
                                            <mask
                                              id="mask0_329_12039"
                                              maskUnits="userSpaceOnUse"
                                              x="2"
                                              y="2"
                                              width="16"
                                              height="16"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M3.08068 6.65342C2.95174 6.9196 2.83822 7.19324 2.7408 7.47311C2.52691 8.08756 2.78771 8.76665 3.35789 9.07997C3.69208 9.26361 3.90308 9.61278 3.90308 10.0003C3.90308 10.3877 3.69208 10.7369 3.35789 10.9206C2.78771 11.2339 2.52691 11.913 2.7408 12.5274C2.83822 12.8073 2.95174 13.0809 3.08068 13.3471C3.36415 13.9323 4.02834 14.2276 4.6527 14.0462C5.01883 13.9398 5.41487 14.0375 5.68883 14.3114C5.9628 14.5854 6.0605 14.9815 5.9541 15.3476C5.77267 15.9719 6.06803 16.6361 6.65318 16.9196C6.91936 17.0485 7.193 17.1621 7.47287 17.2595C8.08731 17.4734 8.7664 17.2126 9.07973 16.6424C9.26337 16.3082 9.61253 16.0972 10 16.0972C10.3875 16.0972 10.7367 16.3082 10.9203 16.6424C11.2336 17.2126 11.9127 17.4734 12.5272 17.2595C12.807 17.1621 13.0807 17.0485 13.3469 16.9196C13.932 16.6361 14.2274 15.9719 14.0459 15.3476C13.9395 14.9815 14.0372 14.5854 14.3112 14.3114C14.5852 14.0375 14.9812 13.9398 15.3473 14.0462C15.9717 14.2276 16.6359 13.9323 16.9194 13.3471C17.0483 13.0809 17.1618 12.8073 17.2592 12.5274C17.4731 11.913 17.2123 11.2339 16.6421 10.9206C16.308 10.7369 16.097 10.3877 16.097 10.0003C16.097 9.61278 16.308 9.26361 16.6421 9.07997C17.2123 8.76665 17.4731 8.08756 17.2592 7.47311C17.1618 7.19324 17.0483 6.9196 16.9194 6.65342C16.6359 6.06827 15.9717 5.77291 15.3473 5.95435C14.9812 6.06074 14.5852 5.96304 14.3112 5.68908C14.0372 5.41512 13.9395 5.01907 14.0459 4.65295C14.2274 4.02858 13.932 3.36439 13.3469 3.08093C13.0807 2.95198 12.807 2.83846 12.5272 2.74104C11.9127 2.52715 11.2336 2.78795 10.9203 3.35814C10.7367 3.69232 10.3875 3.90333 10 3.90333C9.61253 3.90333 9.26337 3.69232 9.07973 3.35814C8.7664 2.78795 8.08731 2.52715 7.47287 2.74104C7.193 2.83846 6.91936 2.95198 6.65318 3.08093C6.06803 3.36439 5.77267 4.02858 5.9541 4.65295C6.0605 5.01907 5.9628 5.41512 5.68883 5.68908C5.41487 5.96304 5.01883 6.06074 4.6527 5.95435C4.02834 5.77291 3.36415 6.06827 3.08068 6.65342ZM5.23642 10.0003C5.23642 9.10001 4.73696 8.31641 4.00002 7.91145C4.08078 7.67945 4.17461 7.45358 4.28063 7.23471C5.08801 7.46933 5.99514 7.26839 6.63164 6.63189C7.26815 5.99538 7.46909 5.08825 7.23447 4.28088C7.45334 4.17485 7.67921 4.08102 7.9112 4.00026C8.31616 4.7372 9.09976 5.23666 10 5.23666C10.9003 5.23666 11.6839 4.7372 12.0888 4.00026C12.3208 4.08102 12.5467 4.17485 12.7656 4.28088C12.5309 5.08825 12.7319 5.99538 13.3684 6.63189C14.0049 7.26839 14.912 7.46933 15.7194 7.23471C15.8254 7.45358 15.9193 7.67945 16 7.91145C15.2631 8.31641 14.7636 9.10001 14.7636 10.0003C14.7636 10.9005 15.2631 11.6841 16 12.0891C15.9193 12.3211 15.8254 12.5469 15.7194 12.7658C14.912 12.5312 14.0049 12.7321 13.3684 13.3686C12.7319 14.0051 12.5309 14.9123 12.7656 15.7196C12.5467 15.8257 12.3208 15.9195 12.0888 16.0003C11.6839 15.2633 10.9003 14.7639 10 14.7639C9.09976 14.7639 8.31616 15.2633 7.9112 16.0003C7.67921 15.9195 7.45334 15.8257 7.23447 15.7196C7.46909 14.9123 7.26815 14.0051 6.63164 13.3686C5.99514 12.7321 5.08801 12.5312 4.28063 12.7658C4.17461 12.5469 4.08078 12.3211 4.00002 12.0891C4.73696 11.6841 5.23642 10.9005 5.23642 10.0003ZM11.3334 10.0003C11.3334 10.7366 10.7364 11.3336 10 11.3336C9.26364 11.3336 8.66669 10.7366 8.66669 10.0003C8.66669 9.26388 9.26364 8.66693 10 8.66693C10.7364 8.66693 11.3334 9.26388 11.3334 10.0003Z"
                                                fill="white"
                                              />
                                            </mask>
                                            <g mask="url(#mask0_329_12039)">
                                              <rect width="20" height="20" fill="#2C2738" />
                                            </g>
                                          </svg>

                                          <span>Settings</span>
                                        </Link>
                                      )}
                                    </Menu.Item>
                                  </Menu.Items>
                                </Transition>
                              </Menu>

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
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Link to="/login">Login</Link> / <Link to="/register">Register</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </header>

                    <div className="relative left-20 lg:left-0 lg:w-full right-0 gap-6 h-screen flex flex-col flex-grow overflow-y-auto mt-20 w-[calc(100%-5rem)] pb-28">
                      <div className="flex flex-col flex-grow px-5 overflow-y-auto gap-10">
                        {loadingMessages ? (
                          <div className="flex justify-center items-center min-h-[calc(100%-5rem)]">
                            <Typing />
                          </div>
                        ) : (
                          <>
                            {isTyping && <Typing />}
                            <div ref={bottomRef} className="flex flex-col gap-6 h-full">
                              {reduxStateMessages && reduxStateMessages.length > 0 ? (
                                React.Children.toArray(
                                  reduxStateMessages?.map((msg) => {
                                    return (
                                      <MessageItem
                                        isOwnedMessage={msg.sender?._id === user?._id}
                                        isGroupChatMessage={currentChat?.isGroupChat}
                                        message={msg}
                                      />
                                    );
                                  })
                                )
                              ) : (
                                <div className="flex justify-center items-center h-full">
                                  <p className="text-gray-500">
                                    No messages yet. Start a conversation!
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="fixed bottom-0 p-4 gap-2 left-20 lg:left-[30rem] right-0 h-28 bg-white dark:bg-gray-800 z-10 border-t-[1.5px] border-b-[1.5px] border-gray-600/30">
                        <div className="h-full z-10 p-4 flex items-center justify-between mx-auto max-w-8xl">
                          <fieldset className="flex items-center">
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
                          </fieldset>
                          <input
                            id="message-input"
                            type="text"
                            value={message}
                            onChange={(event) => handleOnMessageChange(event)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                sendChatMessage();
                              }
                            }}
                            className="relative block px-4 py-3.5 focus:outline-none hover:border-indigo-400 rounded-md border-gray-600/30 border-2 w-full"
                            placeholder="Type a message..."
                          />
                          <button
                            title="send message"
                            disabled={!message && attachmentFiles!.length <= 0}
                            className="shadow-none"
                            onClick={() => {
                              sendChatMessage();
                            }}
                          >
                            <PaperAirplaneIcon
                              aria-hidden={true}
                              className="h-12 text-violet-500"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    No chat selected
                  </div>
                )}
              </div>
            </main>
          </div>
        </React.Fragment>
      )}
    </Disclosure>
  );
};
