import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Disclosure } from "@headlessui/react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { useSocketContext } from "../hooks/useSocket";
import { useOnlineUsers } from "../hooks/useOnlineUsers";
import { useAppDispatch, useAppSelector } from "../redux/redux.hooks";
import { RootState } from "../app/store";
import { Navigation } from "../components/navigation/navigation";
import { MobileBottomNav } from "../components/navigation/MobileNavigation";
import { CreateOrViewStatusWindowPanel } from "../components/status/CreateOrViewStatusWindowPanel";
import {
  JOIN_CHAT_EVENT,
  LEAVE_CHAT_EVENT,
  MESSAGE_RECEIVED_EVENT,
  NEW_CHAT_EVENT,
  CHAT_MESSAGE_DELETE_EVENT,
  REACTION_RECEIVED_EVENT,
  NEW_GROUP_NAME,
  UPDATE_CHAT_LAST_MESSAGE_EVENT,
  MESSAGE_DELIVERED_EVENT,
  MESSAGE_SEEN_EVENT,
  USER_ONLINE_EVENT,
  USER_OFFLINE_EVENT,
  POLL_VOTE_UPDATED,
  STOP_TYPING_EVENT,
  TYPING_EVENT,
  NEW_STATUS_EVENT,
  STATUS_DELETED_EVENT,
} from "../enums/index";
import {
  markMessagesAsSeen,
  setCurrentChat,
  updateMessageDelivery,
  updatePollVote,
} from "../features/chats/chat.reducer";
import { useLogoutMutation } from "../features/auth/auth.slice";
import { ApiService } from "../app/services/api.service";
import { toast } from "react-toastify";
import { classNames } from "../utils";
import { ChatListItemInterface } from "../types/chat";
import { useTyping } from "../hooks/useTyping";
import { useMessage } from "../hooks/useMessage";
// import { useNetwork } from "../hooks/useNetwork";
import {
  StatusGroup,
  StatusStoriesApiSlice,
} from "../features/status/status.api.slice";
import { setSelectedStatusToView } from "../features/status/status.slice";
import { Settings } from "../pages/settings/Settings";

export const ChatLayout: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const [logout] = useLogoutMutation();
  const { socket } = useSocketContext();
  const { selectedStatusToView } = useAppSelector(
    (state: RootState) => state.statusStories,
  );
  const { chats, currentChat, onNewChat, _onChatLeave, onGroupChatRename } =
    useChat();
  const messageHook = useMessage();
  // const { isOnline: hasInternet } = useNetwork();

  const [activeTab, setActiveTab] = useState<
    "chat_messages" | "status" | "settings"
  >("chat_messages");
  const { handleUserOnline, handleUserOffline } = useOnlineUsers();

  const { handleStartTyping, handleStopTyping } = useTyping({
    currentChat: currentChat!,
    user,
  });

  const {
    onReactionUpdate,
    onUpdateChatLastMessage,
    onChatMessageDeleted,
    onMessageReceive,
  } = useMemo(() => messageHook, [messageHook]);

  useEffect(() => {
    if (!socket || !currentChat?._id) return;

    socket.emit(JOIN_CHAT_EVENT, { chatId: currentChat._id });

    return () => {
      socket.emit(LEAVE_CHAT_EVENT, { chatId: currentChat._id });
    };
  }, [socket, currentChat?._id]);

  // Update active tab based on path if needed
  useEffect(() => {
    if (location.pathname.startsWith("/status")) {
      setActiveTab("status");
    } else if (location.pathname.startsWith("/settings")) {
      setActiveTab("settings");
    } else {
      setActiveTab("chat_messages");
    }
  }, [location.pathname]);

  // Sync URL chatId with Redux currentChat
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find((c: any) => c._id === chatId);

      if (chat && currentChat?._id !== chatId) {
        dispatch(setCurrentChat({ chat }));
      }
    } else if (!chatId && currentChat) {
      // Optional: Clear current chat if we are at /chat
      dispatch(
        setCurrentChat({ chat: undefined as unknown as ChatListItemInterface }),
      );
    }
  }, [chatId, chats, currentChat, dispatch]);

  const currentChatIdRef = useRef<string | undefined>(currentChat?._id);
  useEffect(() => {
    currentChatIdRef.current = currentChat?._id;
  }, [currentChat?._id]);

  const handlePollVoteUpdated = useCallback(
    (payload: { messageId: string; options: any[] }) => {
      const chatId = currentChatIdRef.current;
      if (!chatId) return;
      dispatch(
        updatePollVote({
          messageId: payload.messageId,
          chatId,
          options: payload.options,
        }),
      );
    },
    [dispatch],
  );

  const handleNewStatus = useCallback(
    (status: any) => {
      const posterId =
        typeof status.postedBy === "object"
          ? status.postedBy._id
          : status.postedBy;

      dispatch(
        StatusStoriesApiSlice.util.updateQueryData(
          "getStatusFeed",
          undefined,
          (draft) => {
            if (!draft.data) return;

            const userGroup = draft.data.find(
              (group) => group._id === posterId,
            );

            if (userGroup) {
              userGroup.items.unshift(status);
              userGroup.lastUpdated = status.createdAt;
            } else {
              draft.data.unshift({
                _id: posterId,
                items: [status],
                lastUpdated: status.createdAt,
                user:
                  typeof status.postedBy === "object"
                    ? status.postedBy
                    : ({} as any),
              });
            }
          },
        ),
      );
    },
    [dispatch],
  );

  const handleStatusDeleted = useCallback(
    (payload: { statusId: string; postedBy: string }) => {
      const { statusId, postedBy } = payload;

      dispatch(
        StatusStoriesApiSlice.util.updateQueryData(
          "getStatusFeed",
          undefined,
          (draft) => {
            if (!draft.data) return;
            draft.data = draft.data
              .map((group) => ({
                ...group,
                items: group.items.filter((status) => status._id !== statusId),
              }))
              .filter((group) => group.items.length > 0);
          },
        ),
      );

      dispatch(
        StatusStoriesApiSlice.util.updateQueryData(
          "getUserStatuses",
          undefined,
          (draft) => {
            if (draft.data && draft.data._id === postedBy) {
              draft.data.items = draft.data.items.filter(
                (status) => status._id !== statusId,
              );
            }
          },
        ),
      );

      if (selectedStatusToView && selectedStatusToView._id === postedBy) {
        const remainingItems = selectedStatusToView.items.filter(
          (s: StatusGroup) => s._id !== statusId,
        );

        if (remainingItems.length === 0) {
          dispatch(setSelectedStatusToView({ selectedStatusToView: null }));
        } else {
          dispatch(
            setSelectedStatusToView({
              selectedStatusToView: {
                ...selectedStatusToView,
                items: remainingItems,
              },
            }),
          );
        }
      }
    },
    [dispatch, selectedStatusToView],
  );

  // Global socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on(USER_ONLINE_EVENT, handleUserOnline);
    socket.on(USER_OFFLINE_EVENT, handleUserOffline);
    socket?.on(UPDATE_CHAT_LAST_MESSAGE_EVENT, onUpdateChatLastMessage);
    socket?.on(MESSAGE_RECEIVED_EVENT, onMessageReceive);
    socket.on(POLL_VOTE_UPDATED, handlePollVoteUpdated);
    socket?.on(STOP_TYPING_EVENT, handleStopTyping);
    socket?.on(TYPING_EVENT, handleStartTyping);
    socket?.on(REACTION_RECEIVED_EVENT, onReactionUpdate);
    socket?.on(CHAT_MESSAGE_DELETE_EVENT, onChatMessageDeleted);
    socket?.on(NEW_CHAT_EVENT, onNewChat);
    socket?.on(LEAVE_CHAT_EVENT, _onChatLeave);
    socket?.on(NEW_GROUP_NAME, onGroupChatRename);
    socket?.on(MESSAGE_DELIVERED_EVENT, (payload) =>
      dispatch(updateMessageDelivery(payload)),
    );
    socket?.on(MESSAGE_SEEN_EVENT, (payload) =>
      dispatch(markMessagesAsSeen(payload)),
    );
    socket.on(NEW_STATUS_EVENT, handleNewStatus);
    socket.on(STATUS_DELETED_EVENT, handleStatusDeleted);

    return () => {
      socket.off(USER_ONLINE_EVENT, handleUserOnline);
      socket.off(USER_OFFLINE_EVENT, handleUserOffline);
      socket?.off(TYPING_EVENT, handleStartTyping);
      socket?.off(STOP_TYPING_EVENT, handleStopTyping);
      socket?.off(MESSAGE_RECEIVED_EVENT, onMessageReceive);
      socket.off(POLL_VOTE_UPDATED, handlePollVoteUpdated);
      socket?.off(REACTION_RECEIVED_EVENT, onReactionUpdate);
      socket?.off(NEW_CHAT_EVENT, onNewChat);
      socket?.off(CHAT_MESSAGE_DELETE_EVENT, onChatMessageDeleted);
      socket?.off(LEAVE_CHAT_EVENT, _onChatLeave);
      socket?.off(NEW_GROUP_NAME, onGroupChatRename);
      socket?.off(UPDATE_CHAT_LAST_MESSAGE_EVENT, onUpdateChatLastMessage);
      socket?.off(MESSAGE_DELIVERED_EVENT, (payload) =>
        dispatch(updateMessageDelivery(payload)),
      );
      socket?.off(MESSAGE_SEEN_EVENT, (payload) =>
        dispatch(markMessagesAsSeen(payload)),
      );
      socket.off(NEW_STATUS_EVENT, handleNewStatus);
      socket.off(STATUS_DELETED_EVENT, handleStatusDeleted);
    };
  }, [
    dispatch,
    socket,
    onGroupChatRename,
    onMessageReceive,
    onNewChat,
    _onChatLeave,
    onChatMessageDeleted,
    onReactionUpdate,
    handleStartTyping,
    handleStopTyping,
    onUpdateChatLastMessage,
    handleUserOnline,
    handleUserOffline,
    handlePollVoteUpdated,
    handleNewStatus,
    handleStatusDeleted,
  ]);

  const handleLogout = async () => {
    try {
      dispatch(ApiService.util.resetApiState());
      await logout().unwrap();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Local session cleared.");
    } finally {
      navigate("/login");
    }
  };

  // useEffect(() => {
  //   if (!hasInternet) {
  //     toast.warning("You are offline. Messages will be queued.", {
  //       toastId: "offline-warning",
  //     });
  //   } else {
  //     toast.dismiss("offline-warning");
  //   }
  // }, [hasInternet]);

  return (
    <Disclosure as={Fragment}>
      {({ open, close }) => (
        <div
          className={classNames(
            "w-full flex items-stretch h-screen flex-shrink-0 overflow-x-hidden",
          )}
        >
          <Navigation
            open={open}
            close={close}
            activeTab={activeTab}
            currentChat={currentChat!}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />

          <main className={classNames("flex-grow transition-all")}>
            <div
              className={classNames(
                "relative flex flex-col justify-between h-full bg-white dark:bg-black",
              )}
            >
              {activeTab === "status" ? (
                <div className="h-full overflow-hidden">
                  <CreateOrViewStatusWindowPanel />
                </div>
              ) : activeTab === "settings" ? (
                // Nothing to show behind the Settings dialog overlay on mobile
                <div className="h-full lg:hidden" />
              ) : (
                <Outlet />
              )}
            </div>
          </main>

          {activeTab === "settings" && (
            <Settings
              open={true}
              onClose={() => setActiveTab("chat_messages")}
              onLogout={handleLogout}
            />
          )}

          {!currentChat && (
            <MobileBottomNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      )}
    </Disclosure>
  );
};
