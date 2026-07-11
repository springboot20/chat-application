import {
  InboxIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { Tour } from "nextstepjs";

export const createChatIndexTour = (isMobile: boolean) => {
  console.log(isMobile);
  
  const steps: Tour = {
    tour: "chat-index",

    steps: [
      {
        icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />,
        title: "Your Chat Hub",
        selector: "#chat-navigation",
        content: (
          <>
            Welcome to your conversation hub. From here, you can search existing
            chats, browse your recent conversations, or start a brand-new chat
            with any of your contacts. Everything you need to manage your
            conversations is located in this panel.
          </>
        ),
        side: "right",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <PencilSquareIcon className="w-8 h-8 text-emerald-500" />,
        title: "Start a New Chat",
        selector: "#create-chat",
        content: (
          <>
            Click here to begin a new conversation. Choose one of your contacts,
            and a new chat will be created instantly, ready for you to start
            messaging.
          </>
        ),
        side: "bottom",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <InboxIcon className="w-8 h-8 text-sky-500" />,
        title: "Recent Conversations",
        selector: "#chat-list",
        content: (
          <>
            Your recent conversations appear here, with the most recent activity
            shown first. Open any conversation to continue chatting, review
            shared media, or catch up on unread messages.
          </>
        ),
        side: "right",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <MagnifyingGlassIcon className="w-8 h-8 text-indigo-500" />,
        title: "Search Conversations",
        selector: "#search",
        content: (
          <>
            Quickly find any conversation by searching for a contact's name.
            Results update instantly as you type, helping you locate chats
            without scrolling through your conversation history.
          </>
        ),
        side: "bottom",
        pointerPadding: 10,
        pointerRadius: 8,
      },
    ],
  };

  return steps;
};
