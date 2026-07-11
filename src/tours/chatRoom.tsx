import {
  ChatBubbleLeftRightIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Tour } from "nextstepjs";

export const createChatRoomTour = (isMobile: boolean): Tour => {
  return {
    tour: "chat-room",

    steps: [
      {
        title: "Chat Workspace",

        selector: "#chat-room",

        icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />,

        content: (
          <>
            Welcome to your conversation workspace. Everything related to this
            conversation happens here—from viewing messages and shared files to
            sending text, media, voice notes, and interacting with the other
            participant in real time.
          </>
        ),

        side: isMobile ? undefined : "left",

        pointerPadding: 10,
        pointerRadius: 8,
      },
      {
        title: "Conversation Details",

        selector: "#chat-header",

        icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-500" />,

        content: (
          <>
            This header displays information about the current conversation,
            including the participant's name, availability, and quick actions.
            From here you can access additional options for this chat whenever
            they are available.
          </>
        ),

        side: "bottom",

        pointerPadding: 10,
        pointerRadius: 8,
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />,
        title: "Conversation",
        selector: "#messages",
        content: (
          <>
            This is where your conversation comes to life. View sent and
            received messages, replies, reactions, shared files, and stay
            updated as new messages arrive instantly in real time.
          </>
        ),
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <PaperAirplaneIcon className="w-8 h-8 text-green-500" />,
        title: "Message Box",
        selector: "#message-input",
        content: (
          <>
            Type your message here to start the conversation. You can send plain
            text, paste links, reply to messages, mention participants, and much
            more without leaving the chat.
          </>
        ),
        side: "top",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <PaperClipIcon className="w-8 h-8 text-orange-500" />,
        title: "Attachments",
        selector: "#attachment-button",
        content: (
          <>
            Share more than just text. Send images, videos, documents, audio
            files, contacts, locations, and other supported attachments directly
            within the conversation.
          </>
        ),
        side: isMobile ? "top-left" : "top",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <FaceSmileIcon className="w-8 h-8 text-yellow-500" />,
        title: "Emoji Picker",
        selector: "#emoji-picker",
        content: (
          <>
            Express yourself with emojis. Open the emoji picker to quickly add
            reactions and emotions to your messages before sending them.
          </>
        ),
        side: "top-left",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <MicrophoneIcon className="w-8 h-8 text-red-500" />,
        title: "Voice Messages",
        selector: "#voice-button",
        content: (
          <>
            Prefer speaking instead of typing? Record and send voice messages to
            communicate naturally with your contacts. Your recordings are sent
            directly into the conversation.
          </>
        ),
        side: "top-right",
        pointerPadding: 10,
        pointerRadius: 8,
      },

      {
        icon: <PaperAirplaneIcon className="w-8 h-8 text-indigo-500" />,
        title: "Send Message",
        selector: "#send-button",
        content: (
          <>
            When your message is ready, tap the send button to deliver it
            instantly. Your message will appear in the conversation and be
            delivered to everyone in the chat in real time.
          </>
        ),
        side: "top-right",
        pointerPadding: 10,
        pointerRadius: 8,
      },
    ],
  };
};
