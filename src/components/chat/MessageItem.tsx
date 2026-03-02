import {
  ArrowUturnLeftIcon,
  CheckIcon,
  ClockIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { ChatMessageInterface } from '../../types/chat';
import { classNames, formatMessageTime, getDynamicUserColor } from '../../utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { DocumentPreview } from '../file/DocumentPreview';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { UserProfileModal } from '../modal/UserProfileModal';
import { User } from '../../types/auth';
import { MessageMenuSelection } from '../menu/MessageMenu';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import { RootState } from '../../app/store';
import { FilePreviewModal } from '../modal/FilePreviewModal';
import { useReactToChatMessageMutation } from '../../features/chats/chat.slice';
import ReactionTooltip from '../modal/ReactionTooltip';
import { updateMessageReactions } from '../../features/chats/chat.reducer';
import { useNetwork } from '../../hooks/useNetwork';
import { toast } from 'react-toastify';
import { useMessage } from '../../hooks/useMessage';
import { PollingVoteMessage } from './PollingVoteMessage';

type Status = 'queued' | 'sent' | 'delivered' | 'seen';

const MessageStatusTick = ({
  status,
  isOwnedMessage,
}: {
  status: Status;
  isOwnedMessage: boolean;
}) => {
  if (!isOwnedMessage) return null;

  const icons = {
    queued: <ClockIcon className='w-3 h-3 text-[#667781] dark:text-[#8696a0]' />,
    sent: <CheckIcon className='w-3 h-3 text-[#667781] dark:text-[#8696a0]' />,
    delivered: (
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
        className='h-4 w-4 text-[#667781] dark:text-[#8696a0]'>
        <path d='M18 6 7 17l-5-5' />
        <path d='m22 10-7.5 7.5L13 16' />
      </svg>
    ),
    seen: (
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
        className='h-4 w-4 text-[#53bdeb]'>
        <path d='M18 6 7 17l-5-5' />
        <path d='m22 10-7.5 7.5L13 16' />
      </svg>
    ),
  };
  return icons[status];
};

interface MessageItemProps {
  isOwnedMessage?: boolean;
  isGroupChatMessage?: boolean;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  theme: string;
  highlightedMessageId?: string;
  onSetHighlightedMessage?: (messageId: string | undefined) => void;
  message: ChatMessageInterface;
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
  isGroupChatMessage,
  theme,
  onSetHighlightedMessage,
  highlightedMessageId,
  message,
  containerRef: messagesContainerRef,
}) => {
  const [currentMessageImageIndex, setCurrentMessageImageIndex] = useState<number>(-1);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { currentChat } = useAppSelector((state: RootState) => state.chat);
  const [reactToMessage] = useReactToChatMessageMutation();
  const dispatch = useAppDispatch();
  const { handleDeleteChatMessage, handleSetOpenReply, messageToReply, messageItemRef } =
    useMessage();
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [showReactionTooltip, setShowReactionTooltip] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isOnline: hasInternet } = useNetwork();

  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeThreshold = 60;

  // ✅ Local derivation of ownership
  const isOwnedMessage = useMemo(
    () => message.sender?._id === user?._id,
    [message.sender?._id, user?._id],
  );

  // Dynamic transforms (Standardized to right swipe)
  const replyIconOpacity = useTransform(x, [0, swipeThreshold - 10], [0, 1]);
  const replyIconScale = useTransform(x, [0, swipeThreshold], [0.5, 1.2]);

  // Smoothly fade out the indicator when not dragging and x is 0
  const indicatorVisible = useTransform(x, (val) => (isDragging || Math.abs(val) > 0 ? 1 : 0));

  const handleDragEnd = useCallback(() => {
    const currentX = x.get();
    const thresholdMet = currentX >= swipeThreshold;

    if (thresholdMet && !message.isDeleted) {
      handleSetOpenReply(message._id);
    }

    animate(x, 0, {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    });
    setIsDragging(false);
  }, [message._id, handleSetOpenReply, x, isOwnedMessage, swipeThreshold]);

  const calculateMenuPosition = useCallback(
    (clickX: number, clickY: number) => {
      if (!menuRef.current || !messagesContainerRef.current) return;

      const menuRect = menuRef.current.getBoundingClientRect();
      const containerRect = messagesContainerRef.current.getBoundingClientRect();
      const PADDING = 10;

      let x = clickX;
      let y = clickY;

      if (x + menuRect.width + PADDING > containerRect.right) {
        x = containerRect.right - menuRect.width - PADDING;
      }

      if (x < containerRect.left + PADDING) {
        x = containerRect.left + PADDING;
      }

      if (y + menuRect.height + PADDING > containerRect.bottom) {
        y = containerRect.bottom - menuRect.height - PADDING;
      }

      if (y < containerRect.top + PADDING) {
        y = containerRect.top + PADDING;
      }

      setMenuPosition({ x, y });
    },
    [messagesContainerRef],
  );

  const calculatePickerPosition = useCallback(() => {
    if (
      !doubleClickPosition ||
      !containerRef.current ||
      !reactionRef.current ||
      !messagesContainerRef.current
    ) {
      return;
    }

    const messageRect = containerRef.current.getBoundingClientRect();
    const reactionRect = reactionRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scrollX = messagesContainerRef.current.scrollWidth;
    const scrollY = messagesContainerRef.current.scrollHeight;

    const MARGIN = 10;

    let x = doubleClickPosition.clientX;
    let y = doubleClickPosition.clientY;

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

      if (!hasInternet) {
        toast.warning('You are offline. Cannot react to messages.', {
          position: 'top-center',
          autoClose: 2000,
        });
        return;
      }
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
      requestAnimationFrame(() => {
        calculatePickerPosition();
      });
    },
    [calculatePickerPosition, hasInternet, message.status],
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        event.preventDefault();
        event.stopPropagation();
        setShowMenu(true);
        requestAnimationFrame(() => {
          calculateMenuPosition(event.clientX, event.clientY);
        });
      } else {
        handleReactionPicker(event);
      }
    },
    [calculateMenuPosition, handleReactionPicker],
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
      const userPreviouslyUsedThisEmoji = currentReactions.some(
        (r) => r.emoji === emojiData.emoji && r.userIds?.includes(String(user?._id)),
      );

      let optimisticReactions = currentReactions
        .map((r) => ({
          ...r,
          userIds: [...(r.userIds || [])].filter((id: string) => id !== String(user?._id)),
          users: [...(r.users || [])].filter((u: any) => u._id !== String(user?._id)),
        }))
        .filter((reaction) => reaction.userIds.length > 0);

      const emojiMap = new Map<string, any>();

      for (const reaction of optimisticReactions) {
        if (emojiMap.has(reaction.emoji)) {
          const existing = emojiMap.get(reaction.emoji);
          reaction.userIds.forEach((userId: string) => {
            if (!existing.userIds.includes(userId)) {
              existing.userIds.push(userId);
            }
          });
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

        dispatch(
          updateMessageReactions({
            chatId: currentChat?._id || '',
            messageId: key,
            reactions: response.data.reactions || [],
          }),
        );
      } catch (error) {
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
    setIsModalOpen(true);
  }, []);

  const handlePreviousImage = useCallback(() => {
    setCurrentMessageImageIndex((prev) => (prev - 1 + messageFiles.length) % messageFiles.length);
  }, [messageFiles.length]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAfterLeave = useCallback(() => {
    setCurrentMessageImageIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isModalOpen) {
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
    [isModalOpen, handleCloseModal, handlePreviousImage, handleNextImage],
  );

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, handleKeyDown]);

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

  if (messageToReply === message._id && !message.isDeleted) {
    // Trigger a brief swipe animation to give visual feedback (always swipe right)
    animate(x, swipeThreshold, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        setTimeout(() => {
          animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
        }, 200);
      },
    });
  }

  const handleOpenProfile = (targetUser: Partial<User>) => {
    setSelectedUser(targetUser);
    setShowProfileModal(true);
  };

  const renderMessageWithMention = () => {
    const { content, mentions } = message;
    if (!mentions || mentions.length === 0) return <span>{content}</span>;
    const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);
    const parts = [];
    let lastIndex = 0;

    sortedMentions.forEach((mention, index) => {
      if (mention.position > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>{content.substring(lastIndex, mention.position)}</span>,
        );
      }
      const mentionText = `@${mention.username}`;
      parts.push(
        <span
          key={`mention-${mention.userId}-${index}`}
          className={classNames(
            'font-bold cursor-pointer hover:underline transition-colors',
            'text-[#027eb5] dark:text-[#53bdeb]',
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (mention.userId) {
              handleOpenProfile({ _id: mention.userId, username: mention.username });
            }
          }}>
          {mentionText}
        </span>,
      );
      lastIndex = mention.position + mentionText.length;
    });

    if (lastIndex < content.length) {
      parts.push(<span key='text-end'>{content.substring(lastIndex)}</span>);
    }

    return parts;
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

  const categorizedReactionMemoized = useMemo(
    () => categorizeReactions(message.reactions || []),
    [message.reactions],
  );

  const getReactionStats = useCallback((): ReactionStats => {
    const totalReactions = categorizedReactionMemoized.reduce(
      (sum: number, r: CategorizedReaction) => sum + r.count,
      0,
    );

    const userHasReacted: boolean = categorizedReactionMemoized.some((r: CategorizedReaction) =>
      hasUserReacted(r, user?._id || ''),
    );

    const normalizedReactions = categorizedReactionMemoized.map((reaction) => ({
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
  }, [categorizedReactionMemoized, user?._id]);

  const stats = useMemo(() => getReactionStats(), [getReactionStats]);

  const renderReactionsWithDuplicate = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    const { categorizedReactions, totalReactions } = stats;
    return (
      <div
        className={classNames(
          'absolute z-10 -bottom-3 rounded-full px-2 py-1 justify-center flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity border shadow-sm',
          isOwnedMessage
            ? 'bg-white dark:bg-[#1f2c34] border-gray-200 dark:border-[#3b4a54] right-3'
            : 'bg-white dark:bg-[#1f2c34] border-gray-200 dark:border-[#3b4a54] left-3',
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
              // hasUserReacted(reaction, user?._id || '') ? 'animate-pulse' : '',
            )}
            title={`${reaction.emoji} ${reaction.count} - ${reaction.users
              ?.map((u) => u.username)
              .join(', ')}`}>
            {reaction.emoji}
          </span>
        ))}
        <span className='text-xs font-medium ml-1 text-[#667781] dark:text-[#8696a0]'>
          {totalReactions}
        </span>
      </div>
    );
  };

  const renderMediaGrid = () => {
    if (!message?.attachments || message.attachments.length === 0 || message.isDeleted) return null;

    const mediaAttachments = message.attachments.filter(
      (a) => a.fileType === 'image' || a.fileType === 'video' || !a.fileType,
    );
    const otherAttachments = message.attachments.filter(
      (a) => a.fileType === 'voice' || a.fileType === 'document',
    );

    const count = mediaAttachments.length;

    return (
      <div className='flex flex-col gap-2'>
        {count > 0 && (
          <div
            className={classNames(
              'grid gap-1 overflow-hidden rounded-lg mb-1',
              count === 1 ? 'grid-cols-1' : 'grid-cols-2',
            )}>
            {mediaAttachments.slice(0, 4).map((file, index) => {
              const isLast = index === 3 && count > 4;
              return (
                <div
                  key={`${file._id}-${index}`}
                  className={classNames(
                    'relative overflow-hidden',
                    count === 1 ? 'aspect-auto max-h-[350px] min-w-[200px]' : 'aspect-square',
                    count === 3 && index === 0 ? 'col-span-2 aspect-[2/1]' : '',
                  )}>
                  <DocumentPreview
                    attachment={file}
                    index={index}
                    onClick={() => handleImageChange(index)}
                    showOverlay={true}
                    isOwnedMessage={Boolean(isOwnedMessage)}
                    status={message.status}
                  />
                  {isLast && (
                    <div className='absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold z-30 pointer-events-none'>
                      +{count - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {otherAttachments.length > 0 && (
          <div className='flex flex-col gap-1 p-1'>
            {otherAttachments.map((file, index) => (
              <DocumentPreview
                key={`${file._id}-${index}`}
                attachment={file}
                index={mediaAttachments.length + index}
                showOverlay={true}
                isOwnedMessage={Boolean(isOwnedMessage)}
                status={message.status}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <FilePreviewModal
        open={isModalOpen}
        handleCloseModal={handleCloseModal}
        messageFiles={messageFiles}
        message={message}
        handleNextImage={handleNextImage}
        handlePreviousImage={handlePreviousImage}
        handleImageChange={handleImageChange}
        currentMessageImageIndex={currentMessageImageIndex}
        onAfterLeave={handleAfterLeave}
      />

      <ReactionTooltip
        open={showReactionTooltip}
        onClose={() => setShowReactionTooltip(false)}
        stats={stats}
      />

      <div
        className='relative w-full'
        ref={containerRef}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}>
        {/* Reply Icon Indicator (Revealed from behind) */}
        <motion.div
          style={{ opacity: indicatorVisible }}
          className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
          <motion.div
            style={{
              opacity: replyIconOpacity,
              scale: replyIconScale,
            }}
            className='bg-[#027eb5]/20 dark:bg-[#53bdeb]/20 p-2 rounded-full'>
            <ArrowUturnLeftIcon className='size-3.5 lg:size-5 text-[#027eb5] dark:text-[#53bdeb]' />
          </motion.div>
        </motion.div>

        {/* Draggable Message Content */}
        <motion.div
          drag={!message.isDeleted ? 'x' : false}
          dragConstraints={{ left: 0, right: swipeThreshold + 20 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={classNames(
            'flex items-start p-2 text-white text-base relative h-auto w-full gap-1.5',
            isOwnedMessage ? 'justify-end' : 'justify-start',
            getGlowClass(),
          )}>
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
              className='absolute z-[999] animate-in fade-in-0 zoom-in-95 duration-200'
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
                  onEmojiClick={(emoji, event) =>
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

          {currentChat.participants.length > 2 &&
            !isOwnedMessage &&
            (message.sender?.avatar?.url ? (
              <img
                src={message.sender?.avatar?.url}
                alt={message.sender?.username}
                className={classNames(
                  'size-10 object-cover rounded-full items-center justify-center flex flex-shrink-0 bg-white border-2',
                  isOwnedMessage ? 'order-2' : 'order-1',
                )}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  backgroundColor: getDynamicUserColor(message?.sender?._id, theme === 'dark'),
                }}
                className={classNames(
                  'flex justify-center items-center size-10 rounded-full shrink-0 capitalize font-nunito font-bold',
                  isOwnedMessage ? 'order-2' : 'order-1',
                )}>
                {message.sender?.username.split('')[0]}
              </div>
            ))}

          <motion.div
            id={`message-item-${message._id}`}
            className={classNames(
              'flex flex-col self-end w-auto relative cursor-pointer shadow-sm max-w-md transition-shadow active:shadow-md touch-pan-y',
              isOwnedMessage ? 'order-1' : 'order-2',
              isOwnedMessage
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-lg rounded-tr-none wa-tail-owned p-1'
                : 'bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none wa-tail-received border dark:border-none p-1',
            )}
            ref={(element) => {
              messageItemRef.current[message._id] = element;
            }}
            data-id={message._id}>
            {/* Group Chat Sender Name */}
            {isGroupChatMessage && !isOwnedMessage && (
              <button
                title='open user profile'
                className='self-start px-1.5'
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.sender) handleOpenProfile(message.sender);
                }}>
                <span
                  className='text-[12.5px] font-bold mb-0.5'
                  style={{
                    color: getDynamicUserColor(message.sender?._id || '', theme === 'dark'),
                  }}>
                  ~{message.sender?.username}
                </span>
              </button>
            )}

            {/* Reply Preview */}
            {message.replyId && (
              <div
                className={classNames(
                  "mb-1 px-2 py-1.5 rounded-md overflow-hidden before:content-[''] before:w-1 before:left-0 before:block before:absolute before:top-0 before:h-full cursor-pointer relative",
                  isOwnedMessage
                    ? 'bg-[#c1e8b9]/60 dark:bg-[#025a4c]/60 before:bg-[#06cf9c]'
                    : 'bg-[#f0f2f5]/80 dark:bg-[#1a2c33]/80 before:bg-[#06cf9c]',
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
                <p className='text-[11px] font-semibold text-[#06cf9c]'>
                  {message.repliedMessage?.sender?.username}
                </p>
                <p className='text-xs truncate text-[#111b21] dark:text-[#e9edef]'>
                  {message.repliedMessage?.content || 'Attachment'}
                </p>
              </div>
            )}

            {/* Media Grid / Attachments */}
            {renderMediaGrid()}

            {/* Message Content */}
            <div className='px-1.5 pb-1'>
              {message.isDeleted ? (
                <div className='flex items-center text-[#667781] dark:text-[#8696a0] italic py-1'>
                  <NoSymbolIcon className='h-4 w-4 mr-1.5' />
                  <span className='text-[13.5px]'>
                    {user?._id === message.sender?._id ? 'You' : message.sender?.username} deleted
                    this message
                  </span>
                </div>
              ) : (
                <>
                  {message.content && (
                    <p className='text-[14.2px] font-normal text-[#111b21] dark:text-[#e9edef] break-words leading-[19px] py-1 inline-block'>
                      {renderMessageWithMention()}
                    </p>
                  )}

                  {message.contentType === 'polling' && (
                    <PollingVoteMessage
                      message={message}
                      isOwnedMessage={Boolean(isOwnedMessage)}
                    />
                  )}
                </>
              )}

              {/* Inline Timestamp */}
              <div className='flex items-center justify-end gap-1 ml-auto'>
                <span className='text-[10px] text-[#667781] dark:text-[#8696a0]/80 whitespace-nowrap uppercase'>
                  {formatMessageTime(message.updatedAt)}
                </span>
                {!message.isDeleted && (
                  <MessageStatusTick
                    status={message.status}
                    isOwnedMessage={Boolean(isOwnedMessage)}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <UserProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
      />
    </>
  );
};
