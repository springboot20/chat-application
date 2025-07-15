import { useEffect, useCallback } from "react";
import { classNames } from "../../utils";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { MentionUserMenuComponent } from "../menu/MentionUserMenu";
import {
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { DocumentPreview } from "../file/DocumentPreview";
import { Disclosure } from "@headlessui/react";
import { ChatMessageInterface } from "../../types/chat";
import { User } from "../../types/auth";
import { FileSelection } from "../file/FileSelection";

type FileType = {
  files: File[] | null;
  type: "document-file" | "image-file";
};

interface MessageInputProps {
  reduxStateMessages: ChatMessageInterface[];
  isOwnedMessage: boolean;
  attachmentFiles: FileType;
  showReply: boolean;
  message: string;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
  documentInputRef: React.MutableRefObject<HTMLInputElement | null>;
  openEmoji: boolean;
  handleEmojiSelect: (emojiData: EmojiClickData, event: MouseEvent) => void;
  theme: string;
  showMentionUserMenu: boolean;
  handleSelectUser: (user: User) => void;
  users: User[];
  selectedUser: User;
  handleRemoveFile: (indexToRemove: number) => void;
  messageToReply: string;
  handleOpenAndCloseEmoji: () => void;
  handleSendMessage: () => void;
  handleShowMentionUserMenu: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleOnMessageChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleFileChange: (
    fileType: "document-file" | "image-file",
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleSetCloseReply: () => void;
}

const MessageInput = ({
  message,
  handleOnMessageChange,
  handleShowMentionUserMenu,
  handleEmojiSelect,
  handleFileChange,
  handleOpenAndCloseEmoji,
  handleRemoveFile,
  handleSelectUser,
  selectedUser,
  attachmentFiles,
  showReply,
  messageToReply,
  reduxStateMessages,
  isOwnedMessage,
  users,
  theme,
  textareaRef,
  handleSendMessage,
  imageInputRef,
  documentInputRef,
  showMentionUserMenu,
  handleSetCloseReply,
  openEmoji,
}: MessageInputProps) => {
  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Maximum height in pixels (about 5 lines)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [textareaRef]);

  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Optimized send message handler
  const handleSendMessageLocal = useCallback(() => {
    if (message.trim() || (attachmentFiles?.files && attachmentFiles.files.length > 0)) {
      handleSendMessage();
      // Reset textarea height after sending
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }, 0);
    }
  }, [message, attachmentFiles.files, handleSendMessage, textareaRef]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          // Allow new line with Shift+Enter
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleSendMessageLocal();
      }
    },
    [handleSendMessageLocal]
  );

  // Check if send button should be enabled
  const canSend = message.trim() || (attachmentFiles?.files && attachmentFiles.files.length > 0);

  return (
    <div
      className={classNames(
        "fixed bottom-0 gap-2 left-16 sm:left-20 lg:left-[30rem] right-0 bg-white dark:bg-black z-10 border-t-[1.5px] border-b-[1.5px] dark:border-white/10 border-gray-600/30 transition-all duration-200",
        (attachmentFiles.files && attachmentFiles?.files?.length) || showReply
          ? "h-auto"
          : "min-h-16"
      )}
    >
      {/* Emoji Picker */}
      {openEmoji && (
        <div className="bottom-24 absolute left-6 z-50">
          <EmojiPicker
            className="absolute min-w-[300px] sm:min-w-[500px]"
            searchPlaceHolder="search for emoji"
            theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(data, event) => handleEmojiSelect(data, event)}
          />
        </div>
      )}

      {/* Mention User Menu */}
      <MentionUserMenuComponent
        show={showMentionUserMenu}
        handleSelectUser={handleSelectUser}
        selectedUser={selectedUser}
        users={users}
      />

      {/* Reply Section */}
      {showReply && (
        <div className="dark:bg-black border-b dark:border-white/10 animate-in p-3 w-full">
          <div
            className={classNames(
              "dark:bg-white/5 border dark:border-white/5 relative before:content-[''] before:w-1 before:left-0 before:block before:absolute before:top-0 before:h-full px-3 py-1.5 overflow-hidden rounded-lg",
              isOwnedMessage ? "before:bg-[#615EF0]" : "before:bg-green-500"
            )}
          >
            <button
              type="button"
              onClick={handleSetCloseReply}
              className="rounded-full h-6 w-6 dark:bg-white/10 right-2 absolute top-2 flex items-center justify-center ring-1 dark:ring-black/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="dark:text-white h-4" strokeWidth={2} />
            </button>
            {(() => {
              const replyMessage = reduxStateMessages.find(
                (msg) => msg._id.toString() === messageToReply.toString()
              );

              return (
                <>
                  <span className="text-sm font-bold font-nunito dark:text-white mb-2 block">
                    {replyMessage?.sender?.username}
                  </span>
                  <p className="text-lg font-normal font-nunito dark:text-white pr-8">
                    {replyMessage?.content}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* File Attachments */}
      {attachmentFiles?.files && attachmentFiles.files.length > 0 && (
        <div className="grid gap-4 bg-white dark:bg-black grid-cols-5 p-4 justify-start">
          {attachmentFiles.files.map((file, i) => (
            <DocumentPreview
              key={`${file.name}-${i}`} // Better key
              index={i}
              onRemove={handleRemoveFile}
              file={file}
            />
          ))}
        </div>
      )}

      {/* Input Section */}
      <div className="flex items-end justify-between mx-auto max-w-8xl relative z-20 px-2 py-2 gap-2">
        {/* Emoji Button */}
        <button
          onClick={handleOpenAndCloseEmoji}
          className="cursor-pointer h-12 w-12 shrink-0 mb-1"
          type="button"
          title="Add emoji"
        >
          <span className="flex items-center justify-center h-full w-full dark:bg-transparent bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors">
            <FaceSmileIcon className="h-6 dark:text-white/60" />
          </span>
        </button>

        {/* File Attachment */}
        <Disclosure>
          {({ close, open }) => (
            <>
              <Disclosure.Button className="cursor-pointer h-12 w-12 shrink-0 mb-1">
                <span className="sr-only">Open file menu</span>
                <span className="flex items-center justify-center h-full w-full dark:bg-transparent bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors">
                  <PaperClipIcon className="cursor-pointer h-6 fill-none stroke-gray-400 dark:stroke-white hover:stroke-gray-700 dark:hover:stroke-gray-300 transition-colors" />
                </span>
              </Disclosure.Button>
              <FileSelection
                imageInputRef={imageInputRef}
                documentInputRef={documentInputRef}
                handleFileChange={handleFileChange}
                close={close}
                open={open}
              />
            </>
          )}
        </Disclosure>

        {/* Text Input */}
        <div className="flex-1 relative h-full">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => {
              handleOnMessageChange(event);
              handleShowMentionUserMenu(event);
            }}
            onKeyDown={handleKeyDown}
            className={classNames(
              "w-full p-2 resize-none focus:outline-none rounded-lg border dark:border-white/5 outline-none",
              "dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "min-h-[48px] overflow-y-auto",
              "transition-all duration-200",
              "text-sm placeholder:!mt-8"
            )}
            placeholder="Type a message... (Shift+Enter for new line)"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <button
          title="Send message"
          disabled={!canSend}
          className={classNames(
            "h-12 w-12 shrink-0 mb-1 rounded-lg flex items-center justify-center transition-all duration-200",
            canSend
              ? "bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          )}
          onClick={handleSendMessageLocal}
        >
          <PaperAirplaneIcon
            className={classNames(
              "h-5 w-5 transition-transform duration-200",
              canSend ? "text-white" : "text-gray-400 dark:text-gray-500"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
