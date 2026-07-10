import { XMarkIcon, LinkIcon } from "@heroicons/react/24/outline";
import { LinkPreview } from "../../features/chats/chat.slice";
import { classNames } from "../../utils";

type Props = {
  preview: LinkPreview;
  onDismiss?: () => void;
};

export function LinkPreviewCard({ preview, onDismiss }: Props) {
  return (
    <div className="px-4 pt-2">
      <div
        className={classNames(
          "relative flex items-stretch rounded-lg border-[1.5px] overflow-hidden",
          "border-gray-300 dark:border-white/10",
          "bg-gray-50 dark:bg-[#1a1d21]",
        )}
      >
        {/* Thumbnail / fallback icon */}
        <div className="w-24 h-auto shrink-0 bg-gray-200 dark:bg-white/5 flex items-center justify-center">
          {preview.image ? (
            <img
              src={preview.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <LinkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-3 py-1.5">
          {preview.title && (
            <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
              {preview.title}
            </p>
          )}

          {preview.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              {preview.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-1">
            {preview.favicon ? (
              <img
                src={preview.favicon}
                alt=""
                className="w-3.5 h-3.5 shrink-0 rounded-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <LinkIcon className="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" />
            )}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate uppercase tracking-wide">
              {preview.siteName || preview.hostname}
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            title="Remove preview"
            className="absolute top-1 right-1 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <span className="sr-only">Remove link preview</span>
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
