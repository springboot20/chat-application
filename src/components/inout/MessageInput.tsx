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
import { onMessageReceived, replaceOptimisticMessage } from '../../features/chats/chat.reducer';
import { useRecordingLock } from '../../hooks/useRecordingLock';
import { motion, AnimatePresence } from 'framer-motion';

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
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecording,
    audioDuration,
    isRecordingCancelled,
    stopRecording,
  } = useVoiceRecorder();

  const {
    uiState,
    onStart,
    onMove,
    onEnd,
    reset: resetLock,
    micRef,
    cancelRef,
    lockRef,
  } = useRecordingLock();

  const { isOnline } = useNetwork();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [sendMessage] = useSendMessageMutation();

  // ✅ CRITICAL FIX: Track if we're in a drag gesture to prevent premature UI hiding
  const [isDraggingMic, setIsDraggingMic] = useState(false);

  // Compute UI visibility states
  const isActivelyRecording = uiState === 'recording' || uiState === 'locked';
  const hasReviewableAudio = !!audioUrl && !isRecordingCancelled;

  const showVoiceRecorder = isActivelyRecording || hasReviewableAudio;
  const showTextInput = !isActivelyRecording && !hasReviewableAudio && !isDraggingMic;

  const hasTextContent = message.trim().length > 0;
  const hasFiles = attachmentFiles.files && attachmentFiles.files.length > 0;

  // ✅ FIXED: Keep mic button visible during drag gesture
  const shouldShowMicButton =
    !hasTextContent && !hasFiles && !hasReviewableAudio && (!isActivelyRecording || isDraggingMic); // Keep visible while dragging

  const shouldShowSendButton =
    (hasTextContent || hasFiles) && !isActivelyRecording && !isDraggingMic;
  const canSendMessage = hasTextContent || hasFiles;

  const handleSendVoiceMessage = async () => {
    console.log(audioBlob);

    if (!audioBlob || !currentChat?._id) return;

    const tempId = `temp-${Date.now()}`;
    const localAudioUrl = URL.createObjectURL(audioBlob);

    const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
      type: 'audio/webm;codecs=opus',
    });

    const optimisticMessage = {
      _id: tempId,
      content: '',
      sender: user!,
      chat: currentChat._id,
      attachments: [
        {
          url: localAudioUrl,
          localPath: localAudioUrl,
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

    dispatch(onMessageReceived({ data: optimisticMessage as unknown as ChatMessageInterface }));

    try {
      resetRecording();
      resetLock();

      if (!isOnline) {
        messageQueue.add({
          chatId: currentChat._id,
          content: '',
          attachments: [voiceFile],
          mentions: [],
        });
        toast.info('Offline. Message queued.');
        return;
      }

      const response = await sendMessage({
        chatId: currentChat._id,
        data: {
          content: '',
          attachments: [voiceFile],
          mentions: [],
          audioDuration: audioDuration.toString(),
        },
      }).unwrap();

      dispatch(
        replaceOptimisticMessage({
          chatId: currentChat._id,
          tempId: tempId,
          realMessage: response.data,
        }),
      );
    } catch (error) {
      console.error('Failed to send:', error);
      toast.error('Failed to send voice message');
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [textareaRef]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  useEffect(() => {
    if (!isRecording && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isRecording, textareaRef]);

  const handleSendMessageLocal = useCallback(() => {
    if (canSendMessage) {
      handleSendMessage();

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 0);
    }
  }, [canSendMessage, handleSendMessage, textareaRef]);

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

  // ✅ FIXED: Proper drag gesture lifecycle management
  const handleMicPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    setIsDraggingMic(true); // Mark as dragging
    resetLock();
    onStart(e.clientX, e.clientY);
    startRecording();
  };

  const handleMicPointerMove = (e: React.PointerEvent) => {
    if (uiState === 'recording' || isDraggingMic) {
      onMove(e.clientX, e.clientY);
    }
  };

  const handleMicPointerUp = () => {
    setIsDraggingMic(false); // Drag gesture complete
    onEnd(); // Reset transforms

    // Handle state transitions AFTER drag completes
    if (uiState === 'cancelled') {
      cancelRecording();
      resetLock();
    } else if (uiState === 'recording') {
      // If released without locking, stop recording
      // (You might want different behavior here)
    }
    // If locked, do nothing - let user use the controls
  };

  // ✅ Auto-reset on cancel
  useEffect(() => {
    if (isRecordingCancelled) {
      resetLock();
      setIsDraggingMic(false);
    }
  }, [isRecordingCancelled, resetLock]);

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
        {/* Utility Buttons (Emoji & Attachment) */}
        {!isActivelyRecording && !hasReviewableAudio && !isDraggingMic && (
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

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <div className='flex-1 animate-in fade-in slide-in-from-bottom-4 duration-300'>
            <VoiceRecorder
              uiState={uiState}
              isRecording={isRecording}
              isPaused={isPaused}
              recordingTime={recordingTime}
              audioLevel={1}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onCancel={cancelRecording}
              onSend={handleSendVoiceMessage}
              hasRecording={!!audioUrl && !isRecordingCancelled}
              isRecordingCancelled={isRecordingCancelled}
              stopRecording={stopRecording}
              micRef={micRef}
              cancelRef={cancelRef}
              lockRef={lockRef}
            />
          </div>
        )}

        {/* Text Input */}
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

        {/* Action Buttons with Smooth Transitions */}
        <AnimatePresence mode='wait' initial={false}>
          {shouldShowMicButton && (
            <div className='relative w-12 h-12 shrink-0'>
              <motion.button
                key='mic-button'
                type='button'
                onPointerDown={handleMicPointerDown}
                onPointerMove={handleMicPointerMove}
                onPointerUp={handleMicPointerUp}
                onPointerCancel={handleMicPointerUp}
                initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
                transition={{
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className={classNames(
                  'absolute inset-0 p-3 rounded-full transition-colors duration-200',
                  uiState === 'locked'
                    ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                    : 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700',
                  'text-white shadow-lg touch-none',
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title='Hold to record voice message'>
                <MicrophoneIcon className='h-6 w-6' />
              </motion.button>
            </div>
          )}

          {shouldShowSendButton && (
            <div className='relative w-12 h-12 shrink-0'>
              <motion.button
                key='send-button'
                title='Send message'
                type='button'
                disabled={!canSendMessage}
                onClick={handleSendMessageLocal}
                initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
                transition={{
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className={classNames(
                  'absolute inset-0 p-3 rounded-full transition-colors duration-200 shadow-lg flex items-center justify-center',
                  canSendMessage
                    ? 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed',
                )}
                whileHover={canSendMessage ? { scale: 1.1 } : {}}
                whileTap={canSendMessage ? { scale: 0.95 } : {}}>
                <PaperAirplaneIcon className='h-5 w-5' />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessageInput;
