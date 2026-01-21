import {
  DocumentTextIcon,
  PhotoIcon,
  MusicalNoteIcon,
  CheckIcon,
  ClockIcon,
  NoSymbolIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { ChatMessageInterface } from '../../types/chat';
import { classNames, formatMessageTime } from '../../utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DocumentPreview } from '../file/DocumentPreview';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { MessageMenuSelection } from '../menu/MessageMenu';
import { User } from '../../types/auth';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import { RootState } from '../../app/store';
import { FilePreviewModal } from '../modal/FilePreviewModal';
import { useReactToChatMessageMutation } from '../../features/chats/chat.slice';
import ReactionTooltip from '../modal/ReactionTooltip';
import { updateMessageReactions } from '../../features/chats/chat.reducer';
import { useNetwork } from '../../hooks/useNetwork';
import { toast } from 'react-toastify';

type Status = 'queued' | 'sent' | 'delivered' | 'seen';

const MessageStatusTick = ({
  status,
  isOwnedMessage,
}: {
  status: Status;
  isOwnedMessage: boolean;
}) => {
  const { isOnline: hasInternet } = useNetwork();

  if (!isOwnedMessage) return null;

  // ✅ Fix: Add return statement here
  if (!hasInternet && status === 'queued') {
    return (
      <span className='message-status'>
        <ClockIcon className='w-4 h-4 text-orange-400 animate-pulse' title='Queued (offline)' />
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span className='message-status'>
        <CheckIcon className='w-4 h-4 text-gray-400' />
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span className='message-status'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='h-4 w-4 text-gray-400'>
          <path d='M18 6 7 17l-5-5' />
          <path d='m22 10-7.5 7.5L13 16' />
        </svg>
      </span>
    );
  }

  if (status === 'seen') {
    return (
      <span className='message-status'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='h-4 w-4 text-blue-500'>
          {/* ✅ Changed to blue for seen */}
          <path d='M18 6 7 17l-5-5' />
          <path d='m22 10-7.5 7.5L13 16' />
        </svg>
      </span>
    );
  }

  return null;
};
interface MessageItemProps {
  isOwnedMessage?: boolean;
  isGroupChatMessage?: boolean;
  message: ChatMessageInterface;
  messageItemRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleDeleteChatMessage: (key: string) => void;
  theme: string;
  messageToReply: string;
  users: User[];
  handleSetOpenReply: (messageId: string) => void;
  highlightedMessageId?: string;
  onSetHighlightedMessage?: (messageId: string | undefined) => void;
  setIsOwnedMessage: (value: React.SetStateAction<boolean>) => void;

  otherParticipantId?: string;
}

type EmojiType = {
  _id: string;
  emoji: string;
  userIds: string[];
  users: {
    avatar?: { url?: string; localPath?: string; _id: string };
    _id: string;
    username: string;
  }[];
};

type ReactionStats = {
  totalReactions: number;
  uniqueEmojis: number;
  topReaction: CategorizedReaction | null;
  userHasReacted: boolean;
  categorizedReactions: CategorizedReaction[];
};

type CategorizedReaction = EmojiType & { count: number };

export const MessageItem: React.FC<MessageItemProps> = ({
  isOwnedMessage,
  messageItemRef,
  isGroupChatMessage,
  message,
  theme,
  handleDeleteChatMessage,
  users,
  handleSetOpenReply,
  onSetHighlightedMessage,
  highlightedMessageId,
  messageToReply,
  setIsOwnedMessage,

  containerRef: messagesContainerRef,
}) => {
  const [currentMessageImageIndex, setCurrentMessageImageIndex] = useState<number>(-1);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { currentChat } = useAppSelector((state: RootState) => state.chat);
  const [reactToMessage] = useReactToChatMessageMutation();
  const dispatch = useAppDispatch();

  const messageFiles = message.attachments || [];
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [reactionLocation, setReactionLocation] = useState<{
    left: number;
    top: number;
  }>({
    left: 0,
    top: 0,
  });
  const [doubleClickPosition, setDoubleClickPosition] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reactionRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReactionTooltip, setShowReactionTooltip] = useState(false);
  const { isOnline: hasInternet } = useNetwork();

  // Optimized menu positioning that works in all scenarios
  const calculateMenuPosition = useCallback((clickX: number, clickY: number) => {
    if (!menuRef.current || !containerRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const messageRect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const PADDING = 10; // Padding from edges

    let x = clickX;
    let y = clickY;

    // Horizontal positioning
    // Check if menu would overflow right edge
    if (x + menuRect.width + PADDING > viewportWidth) {
      // Position to the left of click
      x = x - menuRect.width;
    }

    // Ensure menu doesn't go off left edge
    if (x < PADDING) {
      x = PADDING;
    }

    // Vertical positioning
    // Check if menu would overflow bottom edge
    if (y + menuRect.height + PADDING > viewportHeight) {
      // Position above the click
      y = y - menuRect.height;
    }

    // Ensure menu doesn't go off top edge
    if (y < PADDING) {
      y = PADDING;
    }

    // Convert to position relative to the message container
    const relativeX = x - messageRect.left;
    const relativeY = y - messageRect.top;

    setMenuPosition({ x: relativeX, y: relativeY });
  }, []);

  // Optimized emoji picker positioning
  const calculatePickerPosition = useCallback(() => {
    if (
      !doubleClickPosition ||
      !containerRef.current ||
      !reactionRef.current ||
      !messagesContainerRef.current
    ) {
      return;
    }

    // Get the message element's bounding rect
    const messageRect = containerRef.current.getBoundingClientRect();
    const reactionRect = reactionRef.current.getBoundingClientRect();

    // Get the viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get scroll offsets
    const scrollX = messagesContainerRef.current.scrollWidth;
    const scrollY = messagesContainerRef.current.scrollHeight;

    // Constants for picker dimensions (you may need to adjust these)
    const MARGIN = 10;

    let x = doubleClickPosition.clientX;
    let y = doubleClickPosition.clientY;

    // Ensure picker stays within viewport bounds
    if (x + reactionRect.width > scrollX + viewportWidth) {
      x = scrollX + viewportWidth - reactionRect.width - MARGIN;
    }

    if (x < messageRect.left + scrollX) {
      x = messageRect.left + scrollX - MARGIN;
    }

    if (y + reactionRect.height > scrollY - viewportHeight) {
      y = scrollY + viewportHeight - reactionRect.height - MARGIN;
    }

    if (y < messageRect.top + scrollY) {
      y = messageRect.top + scrollY - MARGIN;
    }

    // Convert to position relative to the message element
    const relativeX = x - messageRect.left - scrollX;
    const relativeY = y - messageRect.top - scrollY;

    setReactionLocation({
      left: Math.min(0, Math.abs(relativeX)),
      top: Math.min(0, Math.abs(relativeY)),
    });
  }, [doubleClickPosition, messagesContainerRef]);

  const handleReactionPicker = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      // ✅ Check if user is online
      if (!hasInternet) {
        toast.warning('You are offline. Cannot react to messages.', {
          position: 'top-center',
          autoClose: 2000,
        });
        return;
      }

      // ✅ Check if message is queued
      if (message.status === 'queued') {
        toast.warning('Cannot react to queued messages.', {
          position: 'top-center',
          autoClose: 2000,
        });
        return;
      }

      setShowReactionPicker(true);

      setDoubleClickPosition({
        clientX: event.clientX,
        clientY: event.clientY,
      });

      // Calculate position after state update
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        calculatePickerPosition();
      });
    },
    [calculatePickerPosition, hasInternet, message.status],
  );

  const handleHideReactionPicker = useCallback(() => {
    setShowReactionPicker(false);
    setDoubleClickPosition(null);
  }, []);

  const handleSelectReactionEmoji = useCallback(
    async (key: string, emojiData: EmojiClickData, event: MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }

      if (!hasInternet) {
        toast.error('You are offline. Cannot react to messages.', {
          position: 'top-center',
          autoClose: 2000,
        });
        handleHideReactionPicker();
        return;
      }

      if (message.status === 'queued') {
        toast.error('Cannot react to queued messages.', {
          position: 'top-center',
          autoClose: 2000,
        });
        handleHideReactionPicker();
        return;
      }

      const currentReactions = message.reactions || [];

      // 🔹 Step 1: Check if user previously reacted with this SAME emoji
      const userPreviouslyUsedThisEmoji = currentReactions.some(
        (r) => r.emoji === emojiData.emoji && r.userIds?.includes(String(user?._id)),
      );

      // 🔹 Step 2: Remove user from ALL reactions first
      let optimisticReactions = currentReactions
        .map((r) => ({
          ...r,
          userIds: [...(r.userIds || [])].filter((id: string) => id !== String(user?._id)),
          users: [...(r.users || [])].filter((u: any) => u._id !== String(user?._id)),
        }))
        .filter((reaction) => reaction.userIds.length > 0);

      // 🔹 Step 3: Consolidate duplicate emojis
      const emojiMap = new Map<string, any>();

      for (const reaction of optimisticReactions) {
        if (emojiMap.has(reaction.emoji)) {
          const existing = emojiMap.get(reaction.emoji);
          // Merge userIds
          reaction.userIds.forEach((userId: string) => {
            if (!existing.userIds.includes(userId)) {
              existing.userIds.push(userId);
            }
          });
          // Merge users
          reaction.users?.forEach((user: any) => {
            if (!existing.users.some((u: any) => u._id === user._id)) {
              existing.users.push(user);
            }
          });
        } else {
          emojiMap.set(reaction.emoji, {
            ...reaction,
            userIds: [...reaction.userIds],
            users: [...(reaction.users || [])],
          });
        }
      }

      optimisticReactions = Array.from(emojiMap.values());

      // 🔹 Step 4: If NOT toggling off, add new reaction
      if (!userPreviouslyUsedThisEmoji) {
        const existingEmojiIndex = optimisticReactions.findIndex(
          (r) => r.emoji === emojiData.emoji,
        );

        if (existingEmojiIndex !== -1) {
          optimisticReactions[existingEmojiIndex].userIds.push(String(user?._id));
          optimisticReactions[existingEmojiIndex].users.push({
            _id: String(user?._id),
            username: String(user?.username),
            avatar: user?.avatar,
          });
        } else {
          optimisticReactions.push({
            _id: key,
            emoji: emojiData.emoji,
            userIds: [String(user?._id)],
            users: [
              {
                _id: String(user?._id),
                username: String(user?.username),
                avatar: user?.avatar,
              },
            ],
          });
        }
      }

      console.log('🎭 Optimistic reactions:', optimisticReactions);

      dispatch(
        updateMessageReactions({
          chatId: currentChat?._id || '',
          messageId: key,
          reactions: optimisticReactions,
        }),
      );

      try {
        const response = await reactToMessage({
          chatId: currentChat?._id || '',
          messageId: key,
          emoji: emojiData.emoji,
        }).unwrap();

        console.log('✅ Reaction response from server:', response);

        dispatch(
          updateMessageReactions({
            chatId: currentChat?._id || '',
            messageId: key,
            reactions: response.data.reactions || [],
          }),
        );
      } catch (error) {
        console.error('❌ Failed to send reaction:', error);

        toast.error('Failed to send reaction. Please try again.', {
          position: 'top-center',
          autoClose: 2000,
        });

        dispatch(
          updateMessageReactions({
            chatId: currentChat?._id || '',
            messageId: key,
            reactions: currentReactions,
          }),
        );
      }

      handleHideReactionPicker();
    },
    [
      hasInternet,
      message.status,
      message.reactions,
      dispatch,
      currentChat?._id,
      handleHideReactionPicker,
      user?._id,
      user?.username,
      user?.avatar,
      reactToMessage,
    ],
  );

  const handleReactionClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.EmojiPickerReact')) {
      setShowReactionPicker(false);
    }
  }, []);

  const handleReactionKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowReactionPicker(false);
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleReactionClickOutside);
    document.addEventListener('keydown', handleReactionKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleReactionClickOutside);
      document.removeEventListener('keydown', handleReactionKeyDown);
    };
  }, [handleReactionClickOutside, handleReactionKeyDown]);

  useEffect(() => {
    if (showReactionPicker && doubleClickPosition) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        calculatePickerPosition();
      });
    }
  }, [doubleClickPosition, showReactionPicker, calculatePickerPosition]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      setShowMenu(true);

      // Calculate position after menu renders
      requestAnimationFrame(() => {
        calculateMenuPosition(event.clientX, event.clientY);
      });
    },
    [calculateMenuPosition],
  );

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  useEffect(() => {
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
      };
    }
  }, [showMenu, handleClickOutside]);

  const handleNextImage = useCallback(() => {
    setCurrentMessageImageIndex((prev) => (prev + 1) % messageFiles.length);
  }, [messageFiles.length]);

  const handleImageChange = useCallback((index: number) => {
    setCurrentMessageImageIndex(index);
  }, []);

  const handlePreviousImage = useCallback(() => {
    setCurrentMessageImageIndex((prev) => (prev - 1 + messageFiles.length) % messageFiles.length);
  }, [messageFiles.length]);

  const handleCloseModal = useCallback(() => {
    setCurrentMessageImageIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (currentMessageImageIndex >= 0) {
        switch (e.key) {
          case 'Escape':
            handleCloseModal();
            break;
          case 'ArrowLeft':
            handlePreviousImage();
            break;
          case 'ArrowRight':
            handleNextImage();
            break;
        }
      }
    },
    [currentMessageImageIndex, handleCloseModal, handlePreviousImage, handleNextImage],
  );

  useEffect(() => {
    if (currentMessageImageIndex >= 0) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentMessageImageIndex, handleKeyDown]);

  useEffect(() => {
    if (highlightedMessageId === message._id) {
      setIsGlowing(true);
      const timer = setTimeout(() => {
        setIsGlowing(false);
        onSetHighlightedMessage?.(undefined);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, message._id, onSetHighlightedMessage]);

  useEffect(() => {
    if (messageToReply === message._id) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message._id, messageToReply]);

  useEffect(() => {
    setIsOwnedMessage(isOwnedMessage || message.sender?._id === user?._id);
  }, [isOwnedMessage, message.sender?._id, setIsOwnedMessage, user?._id]);

  const renderMessageWithMention = () => {
    const mentionRegex = /@([@\w\s]+?)(?=\s|$)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(message.content)) !== null) {
      const username = match[1];
      const mentionedUser = (users || [])?.find(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      );

      if (match.index > lastIndex) {
        parts.push(message.content.slice(lastIndex, match.index));
      }

      if (mentionedUser) {
        parts.push(
          <span
            key={`mention-${match.index}`}
            onClick={() => console.log(mentionedUser.username)}
            className={classNames(
              isOwnedMessage ? 'text-gray-800' : 'text-indigo-500',
              'hover:underline !font-bold font-nunito cursor-pointer',
            )}>
            @{mentionedUser.username}
          </span>,
        );
      } else {
        parts.push(
          <span
            key={`not-mention-${username}`}
            className={classNames(
              isOwnedMessage ? 'text-gray-800' : 'text-indigo-500',
              'hover:underline !font-bold font-nunito',
            )}>
            @{username}
          </span>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push(message.content.slice(lastIndex));
    }

    return parts.map((part, index) =>
      typeof part === 'string' ? <span key={index}>{part}</span> : part,
    );
  };

  const getGlowClass = () => {
    if (!isGlowing) return '';
    return isOwnedMessage ? 'animate-glow-purple' : 'animate-glow-green';
  };

  const categorizeReactions = (reactions: EmojiType[]) => {
    if (!reactions || !reactions.length) return [];

    const reactionMap = new Map<string, CategorizedReaction>();

    reactions?.forEach(({ emoji, userIds, ...rest }) => {
      if (reactionMap.has(emoji)) {
        const existing = reactionMap.get(emoji)!;
        reactionMap.set(emoji, {
          ...existing,
          userIds: userIds,
          count: userIds?.length,
        });
      } else {
        reactionMap.set(emoji, {
          emoji,
          userIds: userIds || [],
          count: userIds ? userIds?.length : 1,
          ...rest,
        });
      }
    });

    return Array.from(reactionMap.values())?.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });
  };

  const hasUserReacted = (reaction: CategorizedReaction, currentUserId: string): boolean => {
    return reaction?.userIds?.includes(currentUserId);
  };

  const renderReactionsWithDuplicate = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const categorizedReactions: CategorizedReaction[] = categorizeReactions(message.reactions);
    const totalReactions = categorizedReactions.reduce((sum, r) => sum + r.count, 0);

    return (
      <div
        className={classNames(
          'absolute z-10 -bottom-4 rounded-full px-2 py-1 justify-center flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity',
          isOwnedMessage
            ? 'bg-[#615EF0] right-3 dark:bg-[#615EF0] dark:text-white border-2 dark:border-black'
            : 'bg-green-500 dark:bg-green-200 dark:text-green-700 border-2 dark:border-black left-3',
        )}
        onClick={(e) => {
          e.stopPropagation();
          setShowReactionTooltip(true);
        }}>
        {categorizedReactions.slice(0, 3).map((reaction: CategorizedReaction, index: number) => (
          <span
            key={`${reaction.emoji}-${index}`}
            className={classNames(
              'text-xs transition-transform hover:scale-110 inline-block',
              hasUserReacted(reaction, user?._id || '') ? 'animate-pulse' : '',
            )}
            title={`${reaction.emoji} ${reaction.count} - ${reaction.users
              ?.map((u) => u.username)
              .join(', ')}`}>
            {reaction.emoji}
          </span>
        ))}
        <span className='text-xs font-medium ml-1'>{totalReactions}</span>
      </div>
    );
  };

  const getReactionStats = (): ReactionStats => {
    const categorizedReactions = categorizeReactions(message.reactions || []);
    const totalReactions = categorizedReactions.reduce(
      (sum: number, r: CategorizedReaction) => sum + r.count,
      0,
    );
    const userHasReacted: boolean = categorizedReactions.some((r: CategorizedReaction) =>
      hasUserReacted(r, user?._id || ''),
    );

    // Normalize reactions to ensure all required fields are present
    const normalizedReactions = categorizedReactions.map((reaction) => ({
      ...reaction,
      users:
        reaction.users?.map((u) => ({
          _id: u._id,
          username: u.username,
          avatar: {
            url: u.avatar?.url ?? '',
            localPath: u.avatar?.localPath ?? '',
            _id: u.avatar?._id ?? '',
          },
        })) || [],
    }));

    return {
      totalReactions,
      uniqueEmojis: normalizedReactions.length,
      topReaction: normalizedReactions[0] || null,
      userHasReacted,
      categorizedReactions: normalizedReactions,
    };
  };

  const getAttachmentType = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    const types = message.attachments.map((a) => {
      if (a.fileType === 'voice') return 'audio';
      if (a.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
      if (a.url?.match(/\.pdf$/i)) return 'pdf';
      if (a.url?.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i)) return 'document';
      return 'file';
    });

    // If multiple different types → mixed
    return new Set(types).size > 1 ? 'mixed' : types[0];
  };

  const renderAttachmentIcon = () => {
    const type = getAttachmentType();

    if (!type || message.isDeleted) return null;

    const baseClass = 'h-4 w-4 mr-2';

    switch (type) {
      case 'audio':
        return <MusicalNoteIcon className={baseClass} title='Audio message' />;

      case 'image':
        return <PhotoIcon className={baseClass} title='Image attachment' />;

      case 'pdf':
        return <DocumentTextIcon className={baseClass} title='PDF document' />;

      case 'document':
        return <DocumentTextIcon className={baseClass} title='Document attachment' />;

      case 'mixed':
        return <PaperClipIcon className={baseClass} title='Multiple attachments' />;

      default:
        return <PaperClipIcon className={baseClass} />;
    }
  };

  return (
    <>
      <FilePreviewModal
        open={
          messageFiles.length > 0 &&
          currentMessageImageIndex >= 0 &&
          currentMessageImageIndex < messageFiles.length
        }
        handleCloseModal={handleCloseModal}
        messageFiles={messageFiles}
        message={message}
        handleNextImage={handleNextImage}
        handlePreviousImage={handlePreviousImage}
        handleImageChange={handleImageChange}
        currentMessageImageIndex={currentMessageImageIndex}
      />

      <ReactionTooltip
        open={showReactionTooltip}
        onClose={() => setShowReactionTooltip(false)}
        stats={getReactionStats()!}
      />

      <div
        className={classNames(
          'flex items-start p-1.5 text-white text-base relative h-auto w-full gap-6',
          isOwnedMessage ? 'justify-end' : 'justify-start',
          getGlowClass(),
          isAnimating && (isOwnedMessage ? 'slide-right' : 'slide-left'),
          !hasInternet && 'opacity-70 cursor-not-allowed',
        )}
        ref={containerRef}
        onDoubleClick={handleReactionPicker}
        onContextMenu={handleContextMenu}>
        {showMenu && (
          <MessageMenuSelection
            open={showMenu}
            menuRef={menuRef}
            menuPosition={menuPosition}
            handleDeleteChatMessage={() => handleDeleteChatMessage(message._id)}
            closeMenu={handleCloseMenu}
            isMessageDeleted={message.isDeleted}
            handleSetOpenReply={() => handleSetOpenReply(message._id)}
          />
        )}

        {!message.isDeleted && showReactionPicker && (
          <div
            ref={reactionRef}
            className='absolute z-[100] animate-in fade-in-0 zoom-in-95 duration-200'
            style={{
              top: `${reactionLocation.top}px`,
              left: `${reactionLocation.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}>
            <div className='relative shadow-2xl rounded-lg overflow-hidden'>
              <EmojiPicker
                onReactionClick={(emoji, event) =>
                  handleSelectReactionEmoji(message._id, emoji, event)
                }
                reactionsDefaultOpen={true}
                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                searchDisabled={false}
                width={window.innerWidth < 768 ? Math.min(350, window.innerWidth - 20) : 350}
                height={window.innerWidth < 768 ? Math.min(400, window.innerHeight - 20) : 400}
                lazyLoadEmojis
              />
            </div>
          </div>
        )}

        {!message.isDeleted &&
          message.reactions &&
          message.reactions.length > 0 &&
          renderReactionsWithDuplicate()}

        <img
          src={message.sender?.avatar?.url || ''}
          alt={message.sender?.username}
          className={classNames(
            'h-10 w-10 object-cover rounded-full items-center justify-center flex flex-shrink-0 bg-white border-2',
            isOwnedMessage ? 'order-1' : 'order-2',
          )}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        <div
          id={`message-item-${message._id}`}
          className={classNames(
            'flex flex-col self-end w-auto p-2 relative max-w-md cursor-pointer',
            isOwnedMessage ? 'order-1' : 'order-2',
            isOwnedMessage
              ? "before:absolute before:content-[''] before:border-[#615EF0] before:-right-5 before:-z-10 before:top-0 before:border-t-[15px] before:border-b-[15px] before:border-b-transparent before:border-l-[25px] before:border-r-[25px] before:border-r-transparent bg-[#615EF0] rounded-xl rounded-tr-none"
              : "bg-green-500 before:absolute before:content-[''] before:-left-5 before:-z-10 before:top-0 before:border-b-[25px] before:border-t-transparent before:border-b-transparent before:border-r-[40px] before:border-green-500 rounded-xl rounded-tl-none",
          )}
          ref={(element) => {
            messageItemRef.current[message._id] = element;
          }}
          data-id={message._id}>
          {!isOwnedMessage && !isGroupChatMessage ? (
            <button title='open user profile' className='self-start'>
              <span className='text-gray-800 font-nunito font-bold text-sm'>
                ~{message.sender?.username}
              </span>
            </button>
          ) : (
            isOwnedMessage && (
              <span className='text-gray-800 font-nunito font-bold text-sm'>You</span>
            )
          )}

          <div className='relative'>
            {isGroupChatMessage && !isOwnedMessage && (
              <button title='open user profile' className='self-start'>
                <span
                  className={classNames(
                    'text-sm font-semibold mb-0.5',
                    ['text-gray-800', 'text-[#615EF0]'][message?.sender?.username?.length % 2],
                  )}>
                  ~{message.sender?.username}
                </span>
              </button>
            )}

            {message.replyId && (
              <div
                className={classNames(
                  "mb-2 p-2 rounded-lg overflow-hidden before:content-[''] before:w-1 before:left-0 before:block before:absolute before:top-0 before:h-full cursor-pointer relative",
                  isOwnedMessage
                    ? 'bg-indigo-300/50 before:bg-indigo-100'
                    : 'bg-green-100/50 before:bg-green-100',
                )}
                onClick={() => {
                  if (message.repliedMessage && message.replyId) {
                    onSetHighlightedMessage?.(message.replyId);
                    const element = messageItemRef.current[message.replyId];
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}>
                <p
                  className={classNames(
                    'text-xs font-semibold',
                    !isOwnedMessage ? 'dark:text-gray-700' : 'dark:text-gray-300',
                  )}>
                  Replying to {message.repliedMessage?.sender?.username}
                </p>
                {message.repliedMessage &&
                  (message.repliedMessage.isDeleted ? (
                    <p className='text-xs italic dark:text-gray-400'>Message deleted</p>
                  ) : (
                    <p
                      className={classNames(
                        'text-xs truncate',
                        !isOwnedMessage ? 'dark:text-gray-100' : 'dark:text-gray-200',
                      )}>
                      {message.repliedMessage.content || 'Attachment'}
                    </p>
                  ))}
              </div>
            )}

            {message?.attachments?.length > 0 && !message.isDeleted && (
              <div
                className={classNames(
                  'grid max-w-7xl gap-2',
                  message.attachments?.length === 1 ? 'grid-cols-1' : '',
                  message.attachments?.length === 2 ? 'grid-cols-2' : '',
                  message.attachments?.length >= 3 ? 'grid-cols-3' : '',
                  message.content ? 'mb-6' : '',
                )}>
                {message.attachments?.map((file, index) => {
                  return (
                    <DocumentPreview
                      key={`${file._id}-${file.fileType}`}
                      attachment={file}
                      index={index}
                      onClick={() => handleImageChange(index)}
                      isModal={false}
                      isOwnedMessage={Boolean(isOwnedMessage)}
                    />
                  );
                })}
              </div>
            )}

            {message.isDeleted ? (
              <div className='flex items-center'>
                <NoSymbolIcon className='text-red-500 h-6 mr-2' strokeWidth={2} />
                <p className='text-xsm sm:text-sm italic font-normal text-gray-800 break-words'>
                  {user?._id === message.sender?._id ? 'you' : message.sender?.username} deleted
                  this message
                </p>
              </div>
            ) : (
              message.content && (
                <p className='text-base font-normal text-white break-words'>
                  {renderMessageWithMention()}
                </p>
              )
            )}

            <div className='flex items-center justify-between'>
              <p
                className={classNames(
                  'mt-1.5 self-end text-xs inline-flex items-center dark:text-white',
                  isOwnedMessage ? 'text-zinc-50' : 'text-gray-800',
                )}>
                {message.attachments?.length > 0 && !message.isDeleted && renderAttachmentIcon()}
                {formatMessageTime(message.updatedAt)}
              </p>
              {!message.isDeleted && (
                <MessageStatusTick
                  status={message.status}
                  isOwnedMessage={Boolean(isOwnedMessage)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
