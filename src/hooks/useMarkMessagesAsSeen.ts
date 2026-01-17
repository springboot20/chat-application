import { useEffect, useRef, useCallback } from 'react';
import { useMarkMessagesAsSeenMutation } from '../features/chats/chat.slice';
import { useSocketContext } from './useSocket';
import { useNetwork } from './useNetwork';
import { useOnlineUsers } from './useOnlineUsers';

interface UseMarkMessagesAsSeenOptions {
  chatId?: string;
  currentUserId?: string;
  otherParticipantId?: string; // For 1-on-1 chats
  enabled?: boolean;
}

export const useMarkMessagesAsSeen = ({
  chatId,
  currentUserId,
  otherParticipantId,
  enabled = true,
}: UseMarkMessagesAsSeenOptions) => {
  const { socket } = useSocketContext();
  const { isOnline: hasInternet } = useNetwork(); // My internet connection
  const { isUserOnline } = useOnlineUsers(); // Other users' online status
  const [markAsSeenApi] = useMarkMessagesAsSeenMutation();

  const hasMarkedRef = useRef(false);
  const isVisibleRef = useRef(true);

  // Check if we should mark messages as seen
  const shouldMarkAsSeen = useCallback(() => {
    if (!enabled || !hasInternet || !chatId) return false;

    // For group chats or if we don't know the other participant, just mark
    if (!otherParticipantId) return true;

    // For 1-on-1 chats, check if the other user is online
    // Only mark as seen if BOTH users are online (WhatsApp-style)
    return isUserOnline(otherParticipantId);
  }, [enabled, hasInternet, chatId, otherParticipantId, isUserOnline]);

  const markAsSeen = useCallback(async () => {
    if (!shouldMarkAsSeen() || hasMarkedRef.current || !isVisibleRef.current) {
      console.log('⏸️ Skip marking as seen:', {
        shouldMark: shouldMarkAsSeen(),
        hasMarked: hasMarkedRef.current,
        isVisible: isVisibleRef.current,
      });
      return;
    }

    try {
      await markAsSeenApi(chatId!).unwrap();
      hasMarkedRef.current = true;
    } catch (error) {
      console.error('Failed to mark messages as seen:', error);
    }
  }, [chatId, shouldMarkAsSeen, markAsSeenApi]);

  // Mark as seen when chat opens or conditions change
  useEffect(() => {
    if (chatId && enabled) {
      hasMarkedRef.current = false; // Reset for new chat
      markAsSeen();
    }
  }, [chatId, enabled, markAsSeen]);

  // Mark as seen when other user comes online
  useEffect(() => {
    if (!otherParticipantId || !chatId) return;

    if (isUserOnline(otherParticipantId) && !hasMarkedRef.current && isVisibleRef.current) {
      markAsSeen();
    }
  }, [isUserOnline, otherParticipantId, chatId, markAsSeen]);

  // Mark as seen when new message arrives (if conditions are met)
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: any) => {
      if (message.chat === chatId && message.sender._id !== currentUserId) {
        hasMarkedRef.current = false; // Reset flag

        if (isVisibleRef.current && shouldMarkAsSeen()) {
          markAsSeen();
        }
      }
    };

    socket.on('newMessageReceived', handleNewMessage);

    return () => {
      socket.off('newMessageReceived', handleNewMessage);
    };
  }, [socket, chatId, currentUserId, shouldMarkAsSeen, markAsSeen]);

  // Track visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      if (isVisibleRef.current && !hasMarkedRef.current && shouldMarkAsSeen()) {
        console.log('👁️ Tab became visible, marking as seen');
        markAsSeen();
      }
    };

    const handleFocus = () => {
      isVisibleRef.current = true;
      if (!hasMarkedRef.current && shouldMarkAsSeen()) {
        console.log('🎯 Window focused, marking as seen');
        markAsSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [markAsSeen, shouldMarkAsSeen]);

  return { markAsSeen };
};
