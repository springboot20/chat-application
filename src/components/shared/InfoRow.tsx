import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../utils";

// ✅ WhatsApp-style simple list row
export const InfoRow = ({
  icon,
  label,
  sublabel,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
  >
    <span
      className={classNames(
        "shrink-0",
        danger ? "text-red-500" : "text-gray-500 dark:text-gray-400",
      )}
    >
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span
        className={classNames(
          "block text-sm font-medium",
          danger ? "text-red-500" : "text-gray-900 dark:text-white",
        )}
      >
        {label}
      </span>
      {sublabel && (
        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
          {sublabel}
        </span>
      )}
    </span>
    {onClick && (
      <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
    )}
  </button>
);
