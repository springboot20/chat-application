import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  HomeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Step, Tour } from "nextstepjs";
import { desktopSelectors, mobileSelectors } from "./selector";

export function createSharedNavigationTour(isMobile: boolean): Tour {
  const selectors = isMobile ? mobileSelectors : desktopSelectors;

  const steps: Tour["steps"] = [
    {
      icon: <HomeIcon className="w-8 h-8 text-blue-500" />,
      title: isMobile ? "Bottom Navigation" : "Welcome to Your Workspace",

      selector: selectors.navigation,

      content: isMobile ? (
        <>
          This navigation bar gives you quick access to the most important parts
          of the app. Use it to switch between your chats, status updates and
          settings from anywhere.
        </>
      ) : (
        <>
          This sidebar is your main navigation hub. From here, you can access
          your chats, manage your profile, adjust your settings, and navigate
          through every major feature of the application without losing your
          current conversation.
        </>
      ),

      side: (isMobile ? "top" : "right") as Step["side"],
      pointerPadding: 10,
      pointerRadius: 8,
    },

    {
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-500" />,

      title: "Your Conversations",

      selector: selectors.chats,

      content: (
        <>
          This is where you'll find all of your conversations. Open any chat to
          continue messaging, quickly switch between contacts, and always pick
          up right where you left off.
        </>
      ),

      side: (isMobile ? "top-left" : "right") as Step["side"],
      pointerPadding: 10,
      pointerRadius: 8,
    },
    {
      icon: <BellIcon className="w-8 h-8 text-amber-500" />,

      title: "Status Updates",

      selector: selectors.status,

      content: (
        <>
          Stay updated with the latest activities from your contacts. View
          recent status updates, share your own moments, and quickly catch up on
          what your friends, family, or teammates have posted.
        </>
      ),

      side: (isMobile ? "top" : "right") as Step["side"],
      pointerPadding: 10,
      pointerRadius: 8,
    },
  ];

  // Desktop-only steps
  if (!isMobile) {
    steps.push(
      {
        icon: <UserCircleIcon className="w-8 h-8 text-purple-500" />,
        title: "Your Profile",
        selector: selectors?.profile,
        content: (
          <>
            Open your profile to update your avatar, display name, about
            section, and other account information. It's your personal space
            within the application.
          </>
        ),

        side: "bottom-left",
        pointerPadding: 10,
        pointerRadius: 8,
      },
      {
        icon: <CogIcon className="w-8 h-8 text-indigo-500" />,
        title: "Application Settings",
        selector: selectors.settings,
        content: (
          <>
            Customize the application to match your preferences. Manage your
            appearance, notifications, privacy settings, and other options to
            personalize your experience.
          </>
        ),

        side: "bottom-left",
        pointerPadding: 10,
        pointerRadius: 8,
      },
    );
  }

  // Mobile-only settings
  if (isMobile) {
    steps.push({
      icon: <CogIcon className="w-8 h-8 text-indigo-500" />,

      title: "Settings",

      selector: selectors.settings,

      content: (
        <>
          Tap here whenever you want to manage your account, change your
          preferences, adjust notifications, or customize how the app works.
        </>
      ),

      side: "top-right",
      pointerPadding: 10,
      pointerRadius: 8,
    });
  }

  return {
    tour: "shared-navigation",
    steps,
  };
}
