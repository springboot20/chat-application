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
import { Disclosure } from '@headlessui/react';
import { Attachment, ChatListItemInterface, ChatMessageInterface } from '../../types/chat';
import { FileSelection } from '../file/FileSelection';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { toast } from 'react-toastify';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { useNetwork } from '../../hooks/useNetwork';
import { messageQueue } from '../../utils/messageQueue';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import { onMessageReceived, replaceOptimisticMessage } from '../../features/chats/chat.reducer';
import { useRecordingLock } from '../../hooks/useRecordingLock';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useMessage } from '../../hooks/useMessage';
import { PollingMessageModal } from '../modal/PollingModal';
import { useSendMessage } from '../../hooks/useSendMessage';
import { FileUploadPreview } from '../file/FIleUploadPreview';

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
  const { sendMessage, fileProgress, overallProgress } = useSendMessage();

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
      });

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
          'fixed bottom-0 left-0 lg:left-[30rem] right-0 bg-white dark:bg-black z-10 border-t dark:border-white/10 transition-all duration-200',
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

                  const attachmentFile = replyMessage?.attachments?.[0] as Attachment;

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
                            {attachmentFile.fileType === 'image' && (
                              <PhotoIcon className='h-3.5 w-3.5' />
                            )}
                            {attachmentFile.fileType === 'video' && (
                              <VideoCameraIcon className='h-3.5 w-3.5' />
                            )}
                            {attachmentFile.fileType === 'voice' && (
                              <MicrophoneIcon className='h-3.5 w-3.5' />
                            )}
                            {(attachmentFile.fileType === 'document' ||
                              !attachmentFile.fileType) && <DocumentIcon className='h-3.5 w-3.5' />}
                            <span className='text-xs truncate'>
                              {attachmentFile.fileType === 'image'
                                ? 'Photo'
                                : attachmentFile.fileType === 'video'
                                  ? 'Video'
                                  : attachmentFile.fileType === 'voice'
                                    ? 'Voice message'
                                    : attachmentFile.fileName || 'Document'}
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
                const firstAttachment = replyMessage?.attachments?.[0] as Attachment;

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
          <FileUploadPreview
            attachmentFiles={attachmentFiles.files}
            handleRemoveFile={handleRemoveFile}
            fileProgress={fileProgress}
            overallProgress={overallProgress}
          />
        )}

        {/* Input Section */}
        <div className='max-w-8xl mx-auto px-4 py-3'>
          <div
            className={classNames(
              'flex flex-col rounded-lg border-[1.5px] transition-all duration-200 overflow-hidden',
              'dark:border-white/10 border-gray-300 focus-within:border-indigo-500 dark:focus-within:border-indigo-400',
              'bg-gray-50 dark:bg-[#1a1d21]',
            )}>
            {/* Text Input Area */}
            <div className='flex items-start px-2 pt-2'>
              {showTextInput && (
                <div className='flex-1 max-h-[120px] lg:max-h-[300px] overflow-y-auto input-scrollbar transition-all duration-200'>
                  <textarea
                    title='message input'
                    ref={textareaRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentChat.participants.length > 2 ? '#' + currentChat.participants.map((p) => p.username).join(', ') : currentChat.participants.find((p) => p._id !== user?._id)?.username || 'Chat'}`}
                    className={classNames(
                      'w-full p-2 resize-none focus:outline-none bg-transparent',
                      'dark:text-white text-gray-900',
                      'placeholder-gray-400 dark:placeholder-gray-500',
                      'text-[15px] leading-relaxed min-h-[40px]',
                    )}
                    rows={1}
                  />
                </div>
              )}

              {/* Voice Recorder (Full overlay within the input box area if needed, or inline) */}
              {showVoiceRecorder && (
                <div className='flex-1 min-h-[40px] flex items-center px-2 animate-in fade-in slide-in-from-bottom-2 duration-200'>
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
            </div>

            {/* Bottom Toolbar */}
            <div className='flex items-center justify-between px-2 py-1.5 border-t dark:border-white/5 bg-gray-100/50 dark:bg-black/20'>
              <div className='flex items-center gap-1'>
                {/* File Attachment */}
                <Disclosure>
                  {({ close, open }) => (
                    <>
                      <Disclosure.Button className='p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400'>
                        <span className='sr-only'>Open file menu</span>
                        <PaperClipIcon className='h-5 w-5' />
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

                {/* Emoji Button */}
                <button
                  onClick={handleOpenAndCloseEmoji}
                  className='p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400'
                  type='button'
                  title='Add emoji'>
                  <FaceSmileIcon className='h-5 w-5' />
                </button>

                {/* Polling/Other shortcuts could go here */}
              </div>

              <div className='flex items-center gap-2'>
                {/* Voice Recorder Trigger (Floating/Hover styles like Slack) */}
                <AnimatePresence mode='wait'>
                  {shouldShowMicButton && (
                    <motion.div
                      key='mic-container'
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}>
                      <motion.button
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
                        className={classNames(
                          'p-2 rounded-md transition-colors duration-200 touch-none',
                          uiState === 'locked'
                            ? 'bg-green-500 text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10',
                        )}
                        title='Hold to record'>
                        <MicrophoneIcon className='h-5 w-5' />
                      </motion.button>
                    </motion.div>
                  )}

                  {shouldShowSendButton && (
                    <motion.button
                      key='send-button'
                      title='Send message'
                      type='button'
                      disabled={!canSendMessage}
                      onClick={handleSendMessageLocal}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={classNames(
                        'p-2 rounded-md transition-all duration-200 shadow-sm flex items-center justify-center',
                        canSendMessage
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed',
                      )}>
                      <PaperAirplaneIcon className='h-4 w-4' />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default MessageInput;
