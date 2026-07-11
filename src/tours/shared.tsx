import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { Tour } from "nextstepjs";

export const sharedNavigationTour: Tour = {
  tour: "shared-navigation",
  steps: [
    {
      icon: <HomeIcon className="w-8 h-8 text-blue-500" />,
      title: "Welcome to Your Workspace",
      selector: "#sidebar",
      content: (
        <>
          This sidebar is your main navigation hub. From here, you can access
          your chats, manage your profile, adjust your settings, and navigate
          through every major feature of the application without losing your
          current conversation.
        </>
      ),
      side: "right",
      pointerPadding: 6,
      pointerRadius: 8,
    },

    {
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-500" />,
      title: "Your Conversations",
      selector: "#chat-navigation",
      content: (
        <>
          This section displays all your conversations, including direct
          messages and group chats. Select any conversation to continue where
          you left off or quickly switch between active chats.
        </>
      ),
      side: "right",
      pointerPadding: 10,
      pointerRadius: 8,
    },

    {
      icon: <UserCircleIcon className="w-8 h-8 text-purple-500" />,
      title: "Your Profile",
      selector: "#profile-menu",
      content: (
        <>
          Access your personal profile to update your avatar, username, status,
          and other account information. This is also where you can review your
          account details.
        </>
      ),
      side: "bottom-left",
      pointerPadding: 10,
      pointerRadius: 8,
    },

    {
      icon: <CogIcon className="w-8 h-8 text-indigo-500" aria-hidden="true" />,
      title: "Application Settings",
      selector: "#settings",
      content: (
        <>
          Customize how the application works for you. Adjust appearance,
          notifications, privacy preferences, and other settings to personalize
          your experience.
        </>
      ),
      side: "bottom-left",
      pointerPadding: 10,
      pointerRadius: 8,
    },
  ],
};
