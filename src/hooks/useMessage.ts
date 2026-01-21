/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAppDispatch } from './../redux/redux.hooks';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { JOIN_CHAT_EVENT } from '../enums/index.ts';
import { RootState } from '../app/store.ts';
import { useAppSelector } from '../redux/redux.hooks.ts';
import { type EmojiClickData } from 'emoji-picker-react';
import messageSound from '../assets/audio/message-notification.mp3';
import reactionSound from '../assets/audio/send-message-notification.mp3';

import {
  onMessageReceived,
  updateChatLastMessage,
  setUnreadMessages,
  onChatMessageDelete,
  updateMessageReactions,
} from '../features/chats/chat.reducer.ts';
import {
  useDeleteChatMessageMutation,
  useGetAvailableUsersQuery,
  useReplyToMessageMutation,
  useSendMessageMutation,
} from '../features/chats/chat.slice.ts';
import { User } from '../types/auth.ts';
import { AudioManager } from '../utils/index.ts';
import { toast } from 'react-toastify';
import { useSocketContext } from './useSocket.ts';
import { ChatListItemInterface, ChatMessageInterface } from '../types/chat.ts';
import { useNetwork } from './useNetwork.ts';
import { messageQueue } from '../utils/messageQueue.ts';
import { useTyping } from './useTyping.ts';
import { getFuzzyMatches } from '../utils/fuzzySearch.ts';
// import { toast } from "react-toastify";

type FileType = {
  files: File[] | null;
  type: 'document-file' | 'image-file';
};

export const useMessage = () => {
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
  const [showMentionUserMenu, setShowMentionUserMenu] = useState<boolean>(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showReply, setShowReply] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messageItemRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedUser, setSelectedUser] = useState<User>({} as User);

  const [sendMessage] = useSendMessageMutation();
  const [deleteChatMessage] = useDeleteChatMessageMutation();
  const [replyToChatMessage] = useReplyToMessageMutation();
  const { data: availableUsers } = useGetAvailableUsersQuery();

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
  const users = availableUsers?.data as User[];

  const { isOnline } = useNetwork();

  // Add visual indicator for queued messages
  const [queuedMessageIds, setQueuedMessageIds] = useState<string[]>([]);

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
    (selectedUser: User) => {
      const input = messageInputRef.current;
      if (!input) return;

      const cursorPosition = input.selectionStart;
      const textBeforeCursor = message.substring(0, cursorPosition);
      const textAfterCursor = message.substring(cursorPosition);

      // Find the last '@' before the cursor to replace the query string
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const newTextBefore = textBeforeCursor.substring(0, lastAtIndex);
        const completedMention = `@${selectedUser.username} `; // Added space for UX
        const newMessage = newTextBefore + completedMention + textAfterCursor;

        setMessage(newMessage);
        setShowMentionUserMenu(false);
        setSelectedUser(selectedUser);
        setMentionQuery(''); // Reset query

        // Senior Tip: Refocus and place cursor AFTER the new mention
        setTimeout(() => {
          const newPos = lastAtIndex + completedMention.length;
          input.setSelectionRange(newPos, newPos);
          input.focus();
        }, 0);
      }
    },
    [message],
  );

  const handleShowMentionUserMenu = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const value = event.target.value;
    const cursorPosition = event.target.selectionStart;

    // Look for the last '@' before the cursor
    const lastAtIndex = value.lastIndexOf('@', cursorPosition - 1);

    if (lastAtIndex !== -1) {
      // Extract the text between '@' and the cursor (e.g., "jhn")
      const query = value.substring(lastAtIndex + 1, cursorPosition);

      // Check if there's a space in the query (mentions usually stop at a space)
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionUserMenu(true);
        return;
      }
    }

    setShowMentionUserMenu(false);
    setMentionQuery('');
  }, []);

  const checkScrollPosition = () => {
    if (bottomRef.current) {
      const container = bottomRef.current;
      const threshold = 100; // pixels from bottom
      const isNearBottom =
        container?.scrollHeight - container?.scrollTop - container?.clientHeight < threshold;
      setShowScrollButton(!isNearBottom);
    }
  };

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
  }, []);

  const handleFileChange = useCallback(
    (fileType: 'document-file' | 'image-file', event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const files = target.files;

      if (files && files.length) {
        const fileArray = Array.from(files);

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

    if (!currentChat?._id) {
      console.log('No chat selected, cannot get reduxStateMessages');
      return;
    }

    // Join the chat room
    socket?.emit(JOIN_CHAT_EVENT, currentChat?._id);

    // Filter unread reduxStateMessages
    dispatch(setUnreadMessages({ chatId: currentChat!._id! }));
  }, [currentChat, dispatch, socket]);

  const onUpdateChatLastMessage = (updatedChat: ChatListItemInterface) => {
    // Update the last message of the chat
    dispatch(
      updateChatLastMessage({ chatToUpdateId: updatedChat._id, message: updatedChat.lastMessage }),
    );
  };

  const onMessageReceive = (data: any) => {
    // Always dispatch the received message to the Redux store
    dispatch(onMessageReceived({ data }));

    dispatch(updateChatLastMessage({ chatToUpdateId: data.chat, message: data }));

    // Determine when to play sound
    const isCurrentChat = data.chat === currentChat?._id;
    const isFromCurrentUser = data.sender._id === currentUser?._id;

    scrollToBottom();

    // Play sound for messages from other users in the current chat
    // Only play if:
    // 1. Message is in the currently active chat
    // 2. Message is NOT from the current user (don't play sound for your own messages)
    // 3. Sender is a valid participant (optional security check)
    if (isCurrentChat && !isFromCurrentUser) {
      playMessageSound();
    }
  };

  const onChatMessageDeleted = (data: any) => {
    dispatch(onChatMessageDelete({ messageId: data._id, message: data }));
  };

  const handleDeleteChatMessage = useCallback(
    async (messageId: string) => {
      await deleteChatMessage({
        chatId: currentChat?._id || '',
        messageId,
      })
        .unwrap()
        .then((response) => {
          dispatch(
            updateChatLastMessage({
              chatToUpdateId: currentChat?._id as string,
              message: response.data,
            }),
          );
          playMessageSound();
        })
        .catch((error: any) => {
          console.error(error);
        });
    },
    [deleteChatMessage, currentChat?._id, dispatch, playMessageSound],
  );

  const processMentionsContent = (message: string, availableUsers: User[]) => {
    const mentionRegex = /(?:^|\s)@([\w\d._]+)/g;
    const mentions: Array<{
      userId: string;
      username: string;
      position: number;
    }> = [];

    let match: any;

    while ((match = mentionRegex.exec(message)) !== null) {
      const fullMatch = match[0]; // e.g., " @john"
      const username = match[1]; // e.g., "john"

      // Calculate the exact start position of the '@' character
      const atIndex = match.index + (fullMatch.startsWith(' ') ? 1 : 0);

      const mentionedUser = availableUsers.find(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
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
    if (!currentChat?._id || !socket) return;

    const processedMessage = processMentionsContent(message, users);

    const payload = {
      chatId: currentChat?._id as string,
      messageId: messageToReply,
      data: {
        content: processedMessage.content,
        attachments: attachmentFiles.files,
        mentions: processedMessage.mentions,
      },
    };

    await replyToChatMessage(payload)
      .unwrap()
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
    currentChat?._id,
    socket,
    message,
    users,
    messageToReply,
    attachmentFiles.files,
    replyToChatMessage,
    playMessageSound,
  ]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
  };

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
      const updatedFiles = attachmentFiles.files.filter((_, index) => index !== indexToRemove);
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

  const sendChatMessage = async () => {
    if (!currentChat?._id || !socket) return;

    emitStopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const processedMessage = processMentionsContent(message, users);

    // Clear input fields immediately for better UX
    const files = attachmentFiles.files;

    setMessage('');
    setAttachmentFiles({} as any);

    // ✅ Check if user is offline
    if (!isOnline) {
      // Queue the message
      const queuedId = messageQueue.add({
        chatId: currentChat._id,
        content: processedMessage.content,
        attachments: files || undefined,
        mentions: processedMessage.mentions,
      });

      setQueuedMessageIds((prev) => [...prev, queuedId]);

      toast.info('You are offline. Message will be sent when you reconnect.', {
        autoClose: 3000,
      });

      // Add optimistic UI update with "queued" status
      const tempMessage = {
        _id: queuedId,
        content: processedMessage.content,
        sender: currentUser!,
        chat: currentChat._id,
        status: 'queued', // Custom status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(onMessageReceived({ data: tempMessage as unknown as ChatMessageInterface }));

      return;
    }

    // ✅ User is online - send normally
    await sendMessage({
      chatId: currentChat._id,
      data: {
        content: processedMessage.content,
        attachments: files,
        mentions: processedMessage.mentions,
      },
    })
      .unwrap()
      .then(() => {
        playMessageSound();
        scrollToBottom();
      })
      .catch((error: any) => {
        console.error(error);
        toast.error('Failed to send message');

        // Re-queue on failure
        messageQueue.add({
          chatId: currentChat._id,
          content: processedMessage.content,
          attachments: files || undefined,
          mentions: processedMessage.mentions,
        });
      });
  };

  return {
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
    queuedMessageIds,
    selectedUser,
  };
};
