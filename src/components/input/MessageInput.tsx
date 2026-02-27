import { useEffect, useCallback, useState, Fragment } from 'react';
import { classNames } from '../../utils';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { MentionUserMenuComponent } from '../menu/MentionUserMenu';
import {
  FaceSmileIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';
import { getDynamicUserColor } from '../../utils';
import { DocumentPreview } from '../file/DocumentPreview';
import { Disclosure } from '@headlessui/react';
import { ChatListItemInterface, ChatMessageInterface } from '../../types/chat';
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
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useMessage } from '../../hooks/useMessage';
import { PollingMessageModal } from '../modal/PollingModal';

interface MessageInputProps {
  reduxStateMessages: ChatMessageInterface[];
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  theme: string;
  currentChat: ChatListItemInterface;
  handleSendMessage: () => void;
}

const MessageInput = ({
  reduxStateMessages,
  theme,
  currentChat,
  textareaRef,
  handleSendMessage,
}: MessageInputProps) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    audioLevel, // Get real audio level
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
    imageInputRef,
    documentInputRef,
    showMentionUserMenu,
    handleSetCloseReply,
    openEmoji,
    filteredMentionUsers,
  } = useMessage();

  const {
    uiState,
    onStart,
    x,
    y,
    reset: resetLock,
    LOCK_THRESHOLD,
    CANCEL_THRESHOLD,
  } = useRecordingLock();

  const { isOnline } = useNetwork();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [sendMessage] = useSendMessageMutation();

  // ✅ CRITICAL FIX: Track if we're in a drag gesture to prevent premature UI hiding
  const [isDraggingMic, setIsDraggingMic] = useState(false);
  const [openPolling, setOpenPolling] = useState(false);

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
      // Set height to scrollHeight so it expands fully within the container
      textarea.style.height = `${textarea.scrollHeight}px`;
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

  // ✅ Drag gesture lifecycle management via MotionValues
  const handleMicDragStart = () => {
    onStart();
    startRecording();
    setIsDraggingMic(true);
  };

  const handleMicDragEnd = () => {
    setIsDraggingMic(false);

    // Check if we hit thresholds before resetting
    if (uiState === 'cancelled') {
      cancelRecording();
    } else if (uiState === 'recording') {
      // WhatsApp behavior: Release in neutral zone = Stop and Send
      stopRecording();
      // Need a slight delay to ensure blob is ready
      setTimeout(() => {
        handleSendVoiceMessage();
      }, 50);
    }

    // Snap back to origin
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
  };

  // ✅ Auto-reset on cancel
  useEffect(() => {
    if (isRecordingCancelled) {
      resetLock();
      setIsDraggingMic(false);
    }
  }, [isRecordingCancelled, resetLock]);

  return (
    <Fragment>
      <PollingMessageModal open={openPolling} close={() => setOpenPolling(false)} />

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
          users={filteredMentionUsers}
        />

        {/* Reply Section */}
        {showReply && (
          <div className='dark:bg-[#111b21] bg-[#f0f2f5] border-b dark:border-white/5 animate-in p-2 w-full'>
            <div
              className={classNames(
                'dark:bg-[#202c33] bg-white relative border-l-4 overflow-hidden rounded-lg flex',
              )}
              style={{
                borderLeftColor: getDynamicUserColor(
                  reduxStateMessages.find((msg) => msg._id === messageToReply)?.sender?._id || '',
                  theme === 'dark',
                ),
              }}>
              <div className='flex-1 p-2 min-w-0'>
                {(() => {
                  const replyMessage = reduxStateMessages.find(
                    (msg) => msg._id.toString() === messageToReply.toString(),
                  );

                  const senderColor = getDynamicUserColor(
                    replyMessage?.sender?._id || '',
                    theme === 'dark',
                  );

                  return (
                    <div className='flex flex-col'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold truncate' style={{ color: senderColor }}>
                          {replyMessage?.sender?.username}
                        </span>
                        <button
                          type='button'
                          title='close'
                          onClick={handleSetCloseReply}
                          className='rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ml-2'>
                          <XMarkIcon className='dark:text-white/60 text-gray-400 h-4 w-4' />
                        </button>
                      </div>

                      <div className='flex items-center gap-1.5 mt-0.5 text-gray-500 dark:text-gray-400'>
                        {replyMessage?.attachments && replyMessage.attachments.length > 0 ? (
                          <>
                            {replyMessage.attachments[0].fileType === 'image' && (
                              <PhotoIcon className='h-3.5 w-3.5' />
                            )}
                            {replyMessage.attachments[0].fileType === 'video' && (
                              <VideoCameraIcon className='h-3.5 w-3.5' />
                            )}
                            {replyMessage.attachments[0].fileType === 'voice' && (
                              <MicrophoneIcon className='h-3.5 w-3.5' />
                            )}
                            {(replyMessage.attachments[0].fileType === 'document' ||
                              !replyMessage.attachments[0].fileType) && (
                              <DocumentIcon className='h-3.5 w-3.5' />
                            )}
                            <span className='text-xs truncate'>
                              {replyMessage.attachments[0].fileType === 'image'
                                ? 'Photo'
                                : replyMessage.attachments[0].fileType === 'video'
                                  ? 'Video'
                                  : replyMessage.attachments[0].fileType === 'voice'
                                    ? 'Voice message'
                                    : replyMessage.attachments[0].fileName || 'Document'}
                            </span>
                          </>
                        ) : replyMessage?.contentType === 'polling' ? (
                          <>
                            <Bars3BottomLeftIcon className='h-3.5 w-3.5' />
                            <span className='text-xs truncate'>
                              Poll: {replyMessage.polling?.questionTitle}
                            </span>
                          </>
                        ) : (
                          <p className='text-xs truncate pr-4'>{replyMessage?.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right preview thumbnail for media (Optional, but matches WhatsApp Desktop) */}
              {(() => {
                const replyMessage = reduxStateMessages.find(
                  (msg) => msg._id.toString() === messageToReply.toString(),
                );
                const firstAttachment = replyMessage?.attachments?.[0];

                if (firstAttachment?.url && firstAttachment.fileType === 'image') {
                  return (
                    <div className='w-16 h-16 shrink-0'>
                      <img
                        src={firstAttachment.url}
                        alt='Reply preview'
                        className='w-full h-full object-cover'
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* File Attachments */}
        {attachmentFiles?.files && attachmentFiles.files.length > 0 && (
          <div className='flex items-center flex-wrap gap-4 bg-white dark:bg-black p-4 justify-start'>
            {attachmentFiles.files.map((file, i) => (
              <div key={`${file.name}-${i}`} className='size-24 rounded-lg overflow-hidden'>
                <DocumentPreview
                  index={i}
                  onRemove={handleRemoveFile}
                  file={file}
                  variant='square'
                />
              </div>
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
                      handleOpenPolling={setOpenPolling}
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
                audioLevel={audioLevel}
                onPause={pauseRecording}
                onResume={resumeRecording}
                onCancel={cancelRecording}
                onSend={handleSendVoiceMessage}
                hasRecording={!!audioUrl && !isRecordingCancelled}
                isRecordingCancelled={isRecordingCancelled}
                stopRecording={stopRecording}
                x={x}
                y={y}
                audioUrl={audioUrl}
              />
            </div>
          )}

          {/* Text Input */}
          {showTextInput && (
            <div className='flex-1 max-h-[120px] lg:max-h-[200px] overflow-y-auto input-scrollbar transition-all duration-200'>
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
                  'overflow-y-hidden transition-all',
                  'text-sm leading-relaxed lg:min-h-[48px]',
                )}
                rows={1}
              />
            </div>
          )}

          {/* Action Buttons with Smooth Transitions */}
          <AnimatePresence mode='wait' initial={false}>
            {shouldShowMicButton && (
              <div className='relative w-12 h-12 shrink-0'>
                <motion.button
                  key='mic-button'
                  type='button'
                  drag
                  dragConstraints={{
                    top: -LOCK_THRESHOLD - 60,
                    left: -CANCEL_THRESHOLD - 60,
                    right: 40,
                    bottom: 40,
                  }}
                  dragElastic={0.15}
                  onDragStart={handleMicDragStart}
                  onDragEnd={handleMicDragEnd}
                  style={{ x, y }}
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
    </Fragment>
  );
};

export default MessageInput;
