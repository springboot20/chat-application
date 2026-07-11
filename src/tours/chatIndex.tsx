import { InboxIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

export const chatIndexTour = {
  tour: "chat-index",
  steps: [
    {
      icon: <InboxIcon className="w-8 h-8 text-sky-500" />,
      title: "Recent Chats",
      selector: "#chat-list",
      content: <>All your conversations will appear here.</>,
      side: "center",
      pointerPadding: 10,
      pointerRadius: 8,
    },

    {
      icon: <PencilSquareIcon className="w-8 h-8 text-emerald-500" />,
      title: "Start a Conversation",
      selector: "#create-chat",
      content: <>Click here to start chatting with one of your contacts.</>,
      side: "left",
      pointerPadding: 10,
      pointerRadius: 8,
    },
  ],
};
