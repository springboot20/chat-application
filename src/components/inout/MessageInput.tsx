import { useEffect, useCallback, useState } from 'react';
import { classNames } from '../../utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { MentionUserMenuComponent } from '../menu/MentionUserMenu';
import {
  FaceSmileIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DocumentPreview } from '../file/DocumentPreview';
import { Disclosure } from '@headlessui/react';
import { ChatListItemInterface, ChatMessageInterface } from '../../types/chat';
import { User } from '../../types/auth';
import { FileSelection } from '../file/FileSelection';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { toast } from 'react-toastify';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { useSendMessageMutation } from '../../features/chats/chat.slice';
import { useNetwork } from '../../hooks/useNetwork';
import { messageQueue } from '../../utils/messageQueue';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import { onMessageReceived } from '../../features/chats/chat.reducer';
import { useRecordingLock } from '../../hooks/useRecordingLock';

type FileType = {
  files: File[] | null;
  type: 'document-file' | 'image-file';
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
    fileType: 'document-file' | 'image-file',
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleSetCloseReply: () => void;
  currentChat: ChatListItemInterface;
  user: User;
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
  currentChat,
}: MessageInputProps) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecording,
    audioDuration,
    isRecordingCancelled,
  } = useVoiceRecorder();

  const { isLocked, onStart, onMove, onEnd, isCancelled, reset, slideProgress } =
    useRecordingLock();

  const { isOnline } = useNetwork();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setQueuedMessageIds] = useState<string[]>([]);
  const [sendMessage] = useSendMessageMutation();

  const triggerHaptic = (type: 'light' | 'success' | 'warning') => {
    if (!('vibrate' in navigator)) return;

    if (type === 'light') navigator.vibrate(10);
    if (type === 'success') navigator.vibrate([10, 30, 10]);
    if (type === 'warning') navigator.vibrate([50, 100, 50]);
  };

  // ✅ Optimized visibility logic
  const visibility = () => {
    const hasText = message.trim().length > 0;
    const hasFiles = !!attachmentFiles.files?.length;
    const hasRecording = !!audioUrl && !isRecordingCancelled; // Use audioUrl to detect "Review" mode
    const isActivelyRecording = isRecording && !isRecordingCancelled;

    return {
      // Show voice UI during recording OR while reviewing the clip
      showVoiceRecorder: isActivelyRecording || hasRecording,

      // Hide input if the user is busy with a voice message
      showTextInput: !isActivelyRecording && !hasRecording,

      // Mic button only if there is absolutely no other content
      showMicButton: !hasText && !hasFiles && !isActivelyRecording && !hasRecording,

      // Send button for text/files only
      showSendButton: (hasText || hasFiles) && !isActivelyRecording,

      showUtilityButtons: !isActivelyRecording && !hasRecording,
      canSend: hasText || hasFiles,
    };
  };

  const {
    showVoiceRecorder,
    showTextInput,
    showMicButton,
    showSendButton,
    showUtilityButtons,
    canSend,
  } = visibility();

  const handleSendVoiceMessage = async () => {
    if (!audioBlob || !currentChat?._id) return;

    try {
      const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: 'audio/webm;codecs=opus',
      });

      if (!isOnline) {
        const queuedId = messageQueue.add({
          chatId: currentChat._id,
          content: '',
          attachments: [voiceFile],
          mentions: [],
        });

        setQueuedMessageIds((prev) => [...prev, queuedId]);

        toast.info('You are offline. Message will be sent when you reconnect.', {
          autoClose: 3000,
        });

        const tempMessage = {
          _id: queuedId,
          content: '',
          sender: user!,
          chat: currentChat._id,
          attachments: [
            {
              url: URL.createObjectURL(voiceFile),
              localPath: '',
              fileType: 'voice',
              fileName: voiceFile.name,
              fileSize: voiceFile.size,
              duration: audioDuration,
            },
          ],
          status: 'queued',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dispatch(onMessageReceived({ data: tempMessage as unknown as ChatMessageInterface }));
        resetRecording();
        return;
      }

      await sendMessage({
        chatId: currentChat._id,
        data: {
          content: '',
          attachments: [voiceFile],
          mentions: [],
          audioDuration: audioDuration.toString(),
        },
      }).unwrap();

      resetRecording();
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [textareaRef]);

  useEffect(() => {
    if (isLocked) {
      triggerHaptic('success');
    }
  }, [isLocked]);

  useEffect(() => {
    if (isCancelled && isRecording) {
      cancelRecording(); // This stops the audio stream and resets state
      onEnd(); // Resets the lock hook coordinates
      triggerHaptic('warning');
    }
  }, [isCancelled, isRecording, cancelRecording, onEnd]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  useEffect(() => {
    if (!isRecording && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isRecording, textareaRef]);

  const handleSendMessageLocal = useCallback(() => {
    if (canSend) {
      handleSendMessage();

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 0);
    }
  }, [canSend, handleSendMessage, textareaRef]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleOnMessageChange(event);
    handleShowMentionUserMenu(event);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessageLocal();
      }
    },
    [handleSendMessageLocal],
  );

  const handleMicPress = useCallback(
    (clientX: number, clientY: number) => {
      reset(); // Clear previous recording states
      onStart(clientX, clientY);
      startRecording();
      triggerHaptic('light');
    },
    [reset, onStart, startRecording],
  );

  const handleMicRelease = useCallback(() => {
    onEnd();

    // Now check if cancelled AFTER gesture completes
    if (isCancelled) {
      cancelRecording();
      return;
    }

    if (!isLocked && isRecording) {
      stopRecording();
    }
  }, [isCancelled, isLocked, isRecording, onEnd, cancelRecording, stopRecording]);

  return (
    <div
      className={classNames(
        'fixed bottom-0 gap-2 left-0 lg:left-[30rem] right-0 bg-white dark:bg-black z-10 border-t-[1.5px] border-b-[1.5px] dark:border-white/10 border-gray-600/30 transition-all duration-200',
        (attachmentFiles.files && attachmentFiles?.files?.length) || showReply
          ? 'h-auto'
          : 'min-h-16',
      )}>
      {/* Emoji Picker */}
      {openEmoji && (
        <div className='bottom-24 absolute left-6 z-50'>
          <EmojiPicker
            className='absolute min-w-[300px] sm:min-w-[500px]'
            searchPlaceHolder='search for emoji'
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
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
        <div className='dark:bg-black border-b dark:border-white/10 animate-in p-3 w-full'>
          <div
            className={classNames(
              "dark:bg-white/5 border dark:border-white/5 relative before:content-[''] before:w-1 before:left-0 before:block before:absolute before:top-0 before:h-full px-3 py-1.5 overflow-hidden rounded-lg",
              isOwnedMessage ? 'before:bg-[#615EF0]' : 'before:bg-green-500',
            )}>
            <button
              type='button'
              title='close'
              onClick={handleSetCloseReply}
              className='rounded-full h-6 w-6 dark:bg-white/10 right-2 absolute top-2 flex items-center justify-center ring-1 dark:ring-black/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors'>
              <XMarkIcon className='dark:text-white h-4' strokeWidth={2} />
            </button>
            {(() => {
              const replyMessage = reduxStateMessages.find(
                (msg) => msg._id.toString() === messageToReply.toString(),
              );

              return (
                <>
                  <span className='text-sm font-bold font-nunito dark:text-white mb-2 block'>
                    {replyMessage?.sender?.username}
                  </span>
                  <p className='text-lg font-normal font-nunito dark:text-white pr-8'>
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
        <div className='grid gap-4 bg-white dark:bg-black grid-cols-5 p-4 justify-start'>
          {attachmentFiles.files.map((file, i) => (
            <DocumentPreview
              key={`${file.name}-${i}`}
              index={i}
              onRemove={handleRemoveFile}
              file={file}
            />
          ))}
        </div>
      )}

      {/* Input Section */}
      <div className='flex items-end justify-between mx-auto max-w-8xl relative z-20 px-2 py-2 gap-2'>
        {/* ✅ Utility Buttons (Emoji & Attachment) - Hidden when recording */}
        {showUtilityButtons && (
          <div className='flex items-center gap-4 animate-in fade-in duration-200'>
            {/* Emoji Button */}
            <button
              onClick={handleOpenAndCloseEmoji}
              className='cursor-pointer h-8 w-8 lg:h-12 lg:w-12 shrink-0 mb-1'
              type='button'
              title='Add emoji'>
              <span className='flex items-center justify-center h-full w-full dark:bg-transparent bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors'>
                <FaceSmileIcon className='h-6 dark:text-white/60' />
              </span>
            </button>

            {/* File Attachment */}
            <Disclosure>
              {({ close, open }) => (
                <>
                  <Disclosure.Button className='cursor-pointer h-8 w-8 lg:h-12 lg:w-12 shrink-0 mb-1'>
                    <span className='sr-only'>Open file menu</span>
                    <span className='flex items-center justify-center h-full w-full dark:bg-transparent bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors'>
                      <PaperClipIcon className='cursor-pointer h-6 fill-none stroke-gray-400 dark:stroke-white hover:stroke-gray-700 dark:hover:stroke-gray-300 transition-colors' />
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
          </div>
        )}

        {/* ✅ Voice Recorder - Shown when recording or has recorded audio */}
        {showVoiceRecorder && (
          <div className='flex-1 animate-in fade-in slide-in-from-bottom-4 duration-300 shrink-0'>
            <VoiceRecorder
              audioLevel={1}
              isRecording={isRecording}
              isPaused={isPaused}
              recordingTime={recordingTime}
              onStop={stopRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onCancel={cancelRecording}
              onSend={handleSendVoiceMessage}
              hasRecording={!!audioUrl}
              isRecordingCancelled={isRecordingCancelled}
              isLocked={isLocked}
              slideProgress={slideProgress}
              isCancelled={isCancelled}
            />
          </div>
        )}

        {/* ✅ Text Input - Shown when not recording */}
        {showTextInput && (
          <textarea
            title='message input'
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Type a message... (Shift+Enter for new line)'
            className={classNames(
              'w-full p-3 resize-none focus:outline-none rounded-lg border animate-in fade-in slide-in-from-bottom-2 duration-200',
              'dark:border-white/5 dark:bg-white/5 bg-gray-50',
              'dark:text-white text-gray-900',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'overflow-y-auto transition-all',
              'text-sm leading-relaxed lg:min-h-[48px] lg:max-h-[200px]',
            )}
            rows={1}
          />
        )}

        {/* ✅ Action Button - Either Mic or Send */}
        <div className='animate-in fade-in zoom-in-95 duration-200'>
          {showMicButton ? (
            <button
              type='button'
              onMouseDown={(e) => handleMicPress(e.clientX, e.clientY)}
              onMouseMove={(e) => onMove(e.clientX, e.clientY)}
              onMouseUp={handleMicRelease}
              onTouchStart={(e) => handleMicPress(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handleMicRelease}
              className={classNames(
                'p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95',
                isLocked
                  ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                  : 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700',
                'text-white shadow-lg',
              )}
              title='Hold to record voice message'>
              <MicrophoneIcon className='h-6 w-6' />
            </button>
          ) : (
            showSendButton && (
              <button
                title='Send message'
                type='button'
                disabled={!canSend}
                onClick={handleSendMessageLocal}
                className={classNames(
                  'p-3 rounded-full shrink-0 flex items-center justify-center transition-all duration-200 shadow-lg',
                  canSend
                    ? 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white hover:scale-110 active:scale-95'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed',
                )}>
                <PaperAirplaneIcon className='h-5 w-5' />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
