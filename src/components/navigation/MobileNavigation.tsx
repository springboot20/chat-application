import {
  BellIcon,
  Cog8ToothIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "../../utils";

type Tab = "status" | "chat_messages" | "settings";

// This component appears at the bottom on mobile
export const MobileBottomNav: React.FC<{
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}> = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t dark:border-white/10 flex justify-around items-center h-16 lg:hidden z-50"
    >
      <button
        id="mobile-chat-navigation"
        onClick={() => setActiveTab("chat_messages")}
        className={classNames(
          "flex flex-col items-center",
          activeTab === "chat_messages" ? "text-indigo-500" : "text-gray-500",
        )}
      >
        <EnvelopeIcon className="h-6 w-6" />
        <span className="text-xs">Chats</span>
      </button>

      <button
        id="mobile-status-navigation"
        onClick={() => setActiveTab("status")}
        className={classNames(
          "flex flex-col items-center",
          activeTab === "status" ? "text-indigo-500" : "text-gray-500",
        )}
      >
        <BellIcon className="h-6 w-6" />
        <span className="text-xs">Status</span>
      </button>

      <button
        id="mobile-settings-navigation"
        onClick={() => setActiveTab("settings")}
        className={classNames(
          "flex flex-col items-center",
          activeTab === "settings" ? "text-indigo-500" : "text-gray-500",
        )}
      >
        <Cog8ToothIcon className="h-6 w-6" />
        <span className="text-xs">Settings</span>
      </button>
    </nav>
  );
};
