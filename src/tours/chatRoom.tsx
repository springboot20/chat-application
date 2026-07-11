import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Tour } from "nextstepjs";

export const chatRoomTour: Tour = {
  tour: "chat-room",

  steps: [
    {
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />,
      title: "Conversation",
      selector: "#messages",
      content: (
        <>
          This is where all messages in your conversation appear. Scroll to
          review previous messages, replies, shared files, reactions, and stay
          up to date with new messages as they arrive in real time.
        </>
      ),
      // side: "bottom",
      pointerPadding: 10,
      pointerRadius: 8,
    },

    {
      icon: <PaperAirplaneIcon className="w-8 h-8 text-green-500" />,
      title: "Compose a Message",
      selector: "#message-input",
      content: (
        <>
          Type your message here to start the conversation. Press{" "}
          <strong>Enter</strong> to send instantly, or use the send button if
          available. You can also mention participants, reply to messages, and
          share links that automatically generate rich previews.
        </>
      ),
      side: "top",
      pointerPadding: 10,
      pointerRadius: 8,
    },

    {
      icon: <PaperClipIcon className="w-8 h-8 text-orange-500" />,
      title: "Share Files & Media",
      selector: "#attachment-button",
      content: (
        <>
          Attach and send images, videos, documents, voice notes, and other
          files without leaving the conversation. Simply choose a file, preview
          it if needed, and send it directly to everyone in the chat.
        </>
      ),
      side: "top",
      pointerPadding: 10,
      pointerRadius: 8,
    },
  ],
};
