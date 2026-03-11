import { createContext, ReactNode, useRef, useState, useCallback, useEffect, useMemo } from 'react';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks.ts';
import { JOIN_CHAT_EVENT } from '../enums/index.ts';
import { RootState } from '../app/store.ts';
import { type EmojiClickData } from 'emoji-picker-react';
import messageSound from '../assets/audio/message-notification.mp3';
import reactionSound from '../assets/audio/send-message-notification.mp3';

import {
  onMessageReceived,
  updateChatLastMessage,
  setUnreadMessages,
  onChatMessageDelete,
  updateMessageReactions,
  replaceOptimisticMessage,
} from '../features/chats/chat.reducer.ts';
import { useDeleteChatMessageMutation } from '../features/chats/chat.slice.ts';
import { User } from '../types/auth.ts';
import { AudioManager } from '../utils/index.ts';
import { toast } from 'react-toastify';
import { useSocketContext } from '../hooks/useSocket.ts';
import { ChatListItemInterface, ChatMessageInterface } from '../types/chat.ts';
import { useNetwork } from '../hooks/useNetwork.ts';
import { fileToBase64, messageQueue } from '../utils/messageQueue.ts';
import { useMessageQueue } from '../hooks/useMessageQueue.ts';
import { useTyping } from '../hooks/useTyping.ts';
import { getFuzzyMatches } from '../utils/fuzzySearch.ts';
import { FileProgressMap, useSendMessage } from '../hooks/useSendMessage.ts';
import { captureVideoThumbnail } from '../utils/mediaUtils.ts';

type FileType = {
  files: File[] | null;
  type: 'document-file' | 'image-file';
};

type MessageContextValue = {
  message: string;
  openEmoji: boolean;
  attachmentFiles: FileType;
  unreadMessages: ChatMessageInterface[];
  showMentionUserMenu: boolean;
  showReply: boolean;
  messageToReply: string;
  showScrollButton: boolean;
  filteredMentionUsers: User[];
  selectedUser: User;
  videoThumbnails: { [fileName: string]: string };

  fileProgress: FileProgressMap;
  overallProgress: number;
  isLoading: boolean;

  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  bottomRef: React.MutableRefObject<HTMLDivElement | null>;
  setOpenEmoji: React.Dispatch<React.SetStateAction<boolean>>;
  messageInputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  documentInputRef: React.MutableRefObject<HTMLInputElement | null>;
  messageItemRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;

  scrollToBottom: () => void;
  handleOpenAndCloseEmoji: () => void;
  getAllMessages: () => Promise<void>;
  handleRemoveFile: (indexToRemove: number) => void;
  onMessageReceive: (data: any) => void;
  onChatMessageDeleted: (data: any) => void;
  handleEmojiSimpleSelect: (emojiData: EmojiClickData, event: MouseEvent) => void;
  handleEmojiSelect: (emojiData: EmojiClickData, event: MouseEvent) => void;
  setAttachmentFiles: React.Dispatch<React.SetStateAction<FileType>>;
  handleSelectUser: (selectedUser: User) => void;
  sendChatMessage: () => Promise<void>;
  onReactionUpdate: (data: any) => void;
  handleOnMessageChange: (evt: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onUpdateChatLastMessage: (updatedChat: ChatListItemInterface) => void;
  handleDeleteChatMessage: (messageId: string) => Promise<void>;
  handleReplyToChatMessage: () => Promise<void>;
  handleFileChange: (
    fileType: 'document-file' | 'image-file',
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleShowMentionUserMenu: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSetOpenReply: (messageId: string) => void;

  handleSetCloseReply: () => void;
  processMentionsContent: (
    message: string,
    availableUsers: User[],
  ) => {
    content: string;
    mentions: {
      userId: string;
      username: string;
      position: number;
    }[];
  };
};

export const MessageContext = createContext<MessageContextValue>({} as MessageContextValue);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { currentChat, unreadMessages } = useAppSelector((state: RootState) => state.chat);
  const { user: currentUser } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState<string>('');
  const { socket } = useSocketContext();
  const [attachmentFiles, setAttachmentFiles] = useState<FileType>({
    files: null,
    type: 'document-file',
  });
  const [videoThumbnails, setVideoThumbnails] = useState<{ [fileName: string]: string }>({});
  const [showMentionUserMenu, setShowMentionUserMenu] = useState<boolean>(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showReply, setShowReply] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messageItemRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedUser, setSelectedUser] = useState<User>({} as User);

  // const [sendMessage] = useSendMessageMutation();

  const { sendMessage, fileProgress, overallProgress, isLoading } = useSendMessage();

  const [deleteChatMessage] = useDeleteChatMessageMutation();

  const [messageToReply, setMessageToReply] = useState('');
  const messageAudioManagerRef = useRef<AudioManager | null>(null);
  const reactionAudioManagerRef = useRef<AudioManager | null>(null);

  const { emitStopTyping, typingTimeoutRef } = useTyping({
    currentChat: currentChat!,
    user: currentUser!,
  });

  const [isAudioReady, setIsAudioReady] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const { isOnline } = useNetwork();

  // Use refs for stable callback dependencies
  const currentChatRef = useRef(currentChat);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useMessageQueue();

  // Initialize audio manager
  useEffect(() => {
    messageAudioManagerRef.current = new AudioManager(messageSound);
    reactionAudioManagerRef.current = new AudioManager(reactionSound);

    // Add event listeners for user interaction to initialize audio
    const handleUserInteraction = async () => {
      if (messageAudioManagerRef.current && reactionAudioManagerRef.current && !isAudioReady) {
        await messageAudioManagerRef.current.initializeAudio();
        await reactionAudioManagerRef.current.initializeAudio();
        setIsAudioReady(true);

        // Remove listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [isAudioReady]);

  // Play sound function
  const playMessageSound = useCallback(async () => {
    if (messageAudioManagerRef.current) {
      await messageAudioManagerRef.current.playSound();
    }
  }, []);

  const handleSelectUser = useCallback(
    (userToSelect: User) => {
      const input = messageInputRef.current;
      if (!input) return;

      const cursorPosition = input.selectionStart;
      const textBeforeCursor = message.substring(0, cursorPosition);
      const textAfterCursor = message.substring(cursorPosition);

      // We need to find the trigger '@' which is:
      // either at the start of the string or preceded by a space
      // and is followed by our current query
      const wordsBefore = textBeforeCursor.split(' ');
      const lastWord = wordsBefore[wordsBefore.length - 1];

      if (lastWord.startsWith('@')) {
        wordsBefore[wordsBefore.length - 1] = `@${userToSelect.username} `;
        const newTextBefore = wordsBefore.join(' ');
        const newMessage = newTextBefore + textAfterCursor;

        setMessage(newMessage);
        setShowMentionUserMenu(false);
        setSelectedUser(userToSelect);
        setMentionQuery(''); // Reset query

        // Senior Tip: Refocus and place cursor AFTER the new mention
        setTimeout(() => {
          const newPos = newTextBefore.length;
          input.setSelectionRange(newPos, newPos);
          input.focus();
        }, 0);
      }
    },
    [message, setMessage],
  );

  const handleShowMentionUserMenu = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const value = event.target.value;
    const cursorPosition = event.target.selectionStart;

    // Split text into words to find the current word being typed
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(' ');
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@')) {
      // The query is everything after the first '@' in the current word
      const query = currentWord.substring(1);
      setMentionQuery(query);
      setShowMentionUserMenu(true);
    } else {
      setShowMentionUserMenu(false);
      setMentionQuery('');
    }
  }, []);

  const checkScrollPosition = useCallback(() => {
    if (bottomRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = bottomRef.current;
      const threshold = 100; // tolerance in pixels

      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceToBottom < threshold;

      // Update the state for the UI button
      setShowScrollButton(!nearBottom);
    }
  }, []);

  const filteredMentionUsers = useMemo(() => {
    return getFuzzyMatches(mentionQuery, currentChat?.participants || []);
  }, [mentionQuery, currentChat]);

  // Add scroll listener
  useEffect(() => {
    const container = bottomRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const handleFileChange = useCallback(
    (fileType: 'document-file' | 'image-file', event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const files = target.files;

      if (files && files.length) {
        const fileArray = Array.from(files);

        // Generate thumbnails for video files
        fileArray.forEach(async (file) => {
          if (file.type.startsWith('video/')) {
            try {
              const thumbnail = await captureVideoThumbnail(file);
              setVideoThumbnails((prev) => ({ ...prev, [file.name]: thumbnail }));
            } catch (err) {
              console.error('Thumbnail generation failed:', err);
            }
          }
        });

        setAttachmentFiles((prev) => {
          // If the previous files are null, initialize with an empty array
          const updatedFiles =
            prev.files && prev.type === fileType ? [...prev.files, ...fileArray] : fileArray;
          const newState = {
            type: fileType,
            files: updatedFiles,
          };
          return newState;
        });
      }

      target.value = '';
    },
    [],
  );

  const [openEmoji, setOpenEmoji] = useState<boolean>(false);

  const handleOpenAndCloseEmoji = () => setOpenEmoji(!openEmoji);

  const insertEmoji = useCallback(
    (emojiData: EmojiClickData) => {
      const input = messageInputRef.current;

      if (!input) {
        // Fallback: add to end if no input ref
        setMessage((prev) => prev + emojiData.emoji);
        return;
      }

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emojiData.emoji + message.slice(end);
      setMessage(newMessage);

      setTimeout(() => {
        const newCursorPos = start + emojiData?.emoji.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
      }, 0);

      setOpenEmoji(false);
    },
    [message],
  );

  const handleEmojiSelect = useCallback(
    (emojiData: EmojiClickData, event: MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      insertEmoji(emojiData);
      setOpenEmoji(false);
    },
    [insertEmoji],
  );

  const handleEmojiSimpleSelect = useCallback((emojiData: EmojiClickData, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setMessage((prev) => {
      const newMessage = prev + emojiData.emoji;

      return newMessage;
    });
    setOpenEmoji(false);
  }, []);

  const handleOnMessageChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = evt.target.value;
    setMessage(value);
  };

  const getAllMessages = useCallback(async () => {
    // Early return checks
    if (!socket) {
      console.log('No socket connection, cannot get reduxStateMessages');
      return;
    }

    const chatId = currentChatRef.current?._id;
    if (!chatId) {
      console.log('No chat selected, cannot get reduxStateMessages');
      return;
    }

    // Join the chat room
    socket?.emit(JOIN_CHAT_EVENT, chatId);

    // Filter unread reduxStateMessages
    dispatch(setUnreadMessages({ chatId }));
  }, [dispatch, socket]);

  const onUpdateChatLastMessage = (updatedChat: ChatListItemInterface) => {
    // Update the last message of the chat
    dispatch(
      updateChatLastMessage({ chatToUpdateId: updatedChat._id, message: updatedChat.lastMessage }),
    );
  };

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTo({
        top: bottomRef.current.scrollHeight,
        behavior: 'smooth',
      });
      // isAtBottomRef.current = true;
    }
  }, []);

  const onMessageReceive = (data: any) => {
    dispatch(onMessageReceived({ data }));
    dispatch(updateChatLastMessage({ chatToUpdateId: data.chat, message: data }));

    const isCurrentChat = data.chat === currentChat?._id;
    const isFromCurrentUser = data.sender._id === currentUser?._id;

    // ✅ SMART SCROLL:
    // Only scroll to bottom if the user is already near the bottom
    // OR if the user themselves sent the message.
    if (isCurrentChat && isFromCurrentUser) {
      // Wrap in setTimeout to ensure the DOM has updated with the new message height
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }

    if (isCurrentChat && !isFromCurrentUser) {
      playMessageSound();
    }
  };

  const onChatMessageDeleted = (data: any) => {
    dispatch(onChatMessageDelete({ messageId: data._id, message: data }));
  };

  const handleDeleteChatMessage = useCallback(
    async (messageId: string) => {
      const chatId = currentChatRef.current?._id;
      if (!chatId) return;

      await deleteChatMessage({
        chatId,
        messageId,
      })
        .unwrap()
        .then((response) => {
          dispatch(
            updateChatLastMessage({
              chatToUpdateId: chatId,
              message: response.data,
            }),
          );
          playMessageSound();
        })
        .catch((error: any) => {
          console.error(error);
        });
    },
    [deleteChatMessage, dispatch, playMessageSound],
  );

  const processMentionsContent = (message: string, availableUsers: User[]) => {
    // regex updated to handle @ in usernames
    // it looks for @ followed by characters until it hits a space or end of string
    // then it verifies if that "word" matches a known username
    const mentionRegex = /(?:^|\s)@([^\s]+)/g;
    const mentions: Array<{
      userId: string;
      username: string;
      position: number;
    }> = [];

    let match: any;

    while ((match = mentionRegex.exec(message)) !== null) {
      const fullMatch = match[0]; // e.g., " @john@dev"
      const rawUsername = match[1]; // e.g., "john@dev"

      // Calculate the exact start position of the '@' character
      const atIndex = match.index + (fullMatch.startsWith(' ') ? 1 : 0);

      const mentionedUser = availableUsers.find(
        (user) => user.username.toLowerCase() === rawUsername.toLowerCase(),
      );

      if (mentionedUser) {
        mentions.push({
          userId: mentionedUser._id,
          username: mentionedUser.username,
          position: atIndex,
        });
      }
    }

    return {
      content: message,
      mentions: mentions,
    };
  };

  const handleReplyToChatMessage = useCallback(async () => {
    const chat = currentChatRef.current;
    if (!chat?._id || !socket) return;

    const processedMessage = processMentionsContent(message, chat.participants);

    const payload = {
      chatId: chat._id,
      messageId: messageToReply,
      data: {
        content: processedMessage.content,
        attachments: attachmentFiles.files,
        mentions: processedMessage.mentions,
      },
    };

    await sendMessage(payload)
      .then((response) => {
        // Update the Redux store
        console.log(response);

        scrollToBottom();

        setMessage(''); // Move here
        setAttachmentFiles({ files: null, type: 'document-file' }); // Move here
        setShowReply(false); // Close reply UI after sending
        setMessageToReply(''); // Reset messageToReply

        // Play sound when message is sent
        playMessageSound();
      })
      .catch((error: any) => {
        console.error(error);
        toast('Failed to send message', { type: 'error' });
      });
  }, [
    socket,
    message,
    messageToReply,
    attachmentFiles.files,
    scrollToBottom,
    playMessageSound,
    sendMessage,
  ]);

  const onReactionUpdate = useCallback(
    (data: any) => {
      console.log(data);

      // Update only the reactions for the specific message
      dispatch(updateMessageReactions(data));
    },
    [dispatch],
  );

  const handleRemoveFile = (indexToRemove: number) => {
    if (attachmentFiles?.files) {
      const fileToRemove = attachmentFiles.files[indexToRemove];
      const updatedFiles = attachmentFiles.files.filter((_, index) => index !== indexToRemove);

      if (fileToRemove && videoThumbnails[fileToRemove.name]) {
        setVideoThumbnails((prev) => {
          const next = { ...prev };
          delete next[fileToRemove.name];
          return next;
        });
      }

      setAttachmentFiles({
        ...attachmentFiles,
        files: updatedFiles.length > 0 ? updatedFiles : null,
      });
    }
  };

  const handleSetOpenReply = useCallback((messageId: string) => {
    setMessageToReply(messageId);
    setShowReply(true);
  }, []);

  const handleSetCloseReply = useCallback(() => {
    setShowReply(false);
    setMessageToReply('');
  }, []);

  const sendChatMessage = useCallback(async () => {
    const currentChat = currentChatRef.current;
    const currentUser = currentUserRef.current;
    if (!currentChat?._id || !socket) return;

    emitStopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const processedMessage = processMentionsContent(message, currentChat?.participants);

    // Clear input fields immediately for better UX
    const files = attachmentFiles.files;
    const tempId = 'temp-' + Date.now();

    const convertedFiles = await Promise.all(
      (files || [])?.map(async (file) => await fileToBase64(file)),
    );

    // Add optimistic UI update with "queued" status
    const tempMessage = {
      _id: tempId,
      content: processedMessage.content,
      sender: currentUser!,
      chat: currentChat._id,
      attachments: convertedFiles,
      status: 'queued', // Custom status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log({ tempMessage });

    try {
      dispatch(onMessageReceived({ data: tempMessage as unknown as ChatMessageInterface }));

      if (!isOnline) {
        messageQueue.add({
          chatId: currentChat._id,
          content: processedMessage.content,
          attachments: files || undefined,
          mentions: processedMessage.mentions,
        });

        toast.info('You are offline. Message will be sent when you reconnect.', {
          autoClose: 3000,
        });

        setTimeout(() => {
          setMessage('');
          setAttachmentFiles({} as any);
        }, 2000);
        return;
      }

      const response = await sendMessage({
        chatId: currentChat._id,
        data: {
          content: processedMessage.content,
          attachments: files,
          mentions: processedMessage.mentions,
        },
      });

      playMessageSound();
      scrollToBottom();

      dispatch(
        replaceOptimisticMessage({
          chatId: currentChat._id,
          tempId: tempId, // The 'temp-xxx' ID you created
          realMessage: response.data, // The actual message from server
        }),
      );

      setMessage('');
      setAttachmentFiles({} as any);
    } catch (error) {
      console.error('Failed to send:', error);
      toast.error('Failed to send message');
    }
  }, [
    socket,
    message,
    attachmentFiles.files,
    scrollToBottom,
    playMessageSound,
    sendMessage,
    emitStopTyping,
    dispatch,
    isOnline,
  ]);

  const value = useMemo(
    () => ({
      handleOnMessageChange,
      setMessage,
      message,
      setAttachmentFiles,
      unreadMessages,
      attachmentFiles,
      onMessageReceive,
      onChatMessageDeleted,
      bottomRef,
      getAllMessages,
      scrollToBottom, // Expose the scrollToBottom function
      setOpenEmoji,
      handleOpenAndCloseEmoji,
      messageInputRef,
      openEmoji,
      handleEmojiSelect,
      handleEmojiSimpleSelect,
      handleFileChange,
      imageInputRef,
      documentInputRef,
      handleRemoveFile,
      messageItemRef,
      handleShowMentionUserMenu,
      showMentionUserMenu,
      handleSelectUser,
      onReactionUpdate,
      onUpdateChatLastMessage,

      videoThumbnails,

      fileProgress,
      overallProgress,
      isLoading,

      // React Picker
      handleDeleteChatMessage,
      handleReplyToChatMessage,
      processMentionsContent,
      handleSetOpenReply,
      handleSetCloseReply,
      showReply,
      messageToReply,
      showScrollButton,
      sendChatMessage,
      filteredMentionUsers,
      selectedUser,
    }),
    [
      handleOnMessageChange,
      setMessage,
      message,
      setAttachmentFiles,
      unreadMessages,
      attachmentFiles,
      onMessageReceive,
      onChatMessageDeleted,
      bottomRef,
      getAllMessages,
      scrollToBottom, // Expose the scrollToBottom function
      setOpenEmoji,
      handleOpenAndCloseEmoji,
      messageInputRef,
      openEmoji,
      handleEmojiSelect,
      handleEmojiSimpleSelect,
      handleFileChange,
      imageInputRef,
      documentInputRef,
      handleRemoveFile,
      messageItemRef,
      handleShowMentionUserMenu,
      showMentionUserMenu,
      handleSelectUser,
      onReactionUpdate,
      onUpdateChatLastMessage,

      fileProgress,
      overallProgress,
      isLoading,

      // React Picker
      handleDeleteChatMessage,
      handleReplyToChatMessage,
      processMentionsContent,
      handleSetOpenReply,
      handleSetCloseReply,
      showReply,
      messageToReply,
      showScrollButton,
      sendChatMessage,
      filteredMentionUsers,
      selectedUser,

      videoThumbnails,
    ],
  );

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};
