import { useState, useRef, useCallback } from 'react';
import { ChatListItemInterface } from '../types/chat';
import { User } from '../types/auth';
import { useSocketContext } from './useSocket';
import { STOP_TYPING_EVENT, TYPING_EVENT } from '../enums';

interface useTypingProps {
  currentChat: ChatListItemInterface;
  user: User | null;
}

interface TypingEventData {
  chatId: string;
  userId: string;
  username: string;
}

export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export const useTyping = ({ currentChat, user }: useTypingProps) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { socket } = useSocketContext();

  const isCurrentlyTypingRef = useRef(false);

  // Auto-cleanup stale typing indicators (if STOP_TYPING event is missed)
  const AUTO_STOP_TYPING_DELAY = 5000; // 5 seconds

  /**
   * Emit START_TYPING event
   * Only emits once per typing session
   */
  const emitStartTyping = useCallback(() => {
    if (!currentChat?._id || !socket || !user) return;

    if (!isCurrentlyTypingRef.current) {
      socket.emit(TYPING_EVENT, currentChat._id);
      isCurrentlyTypingRef.current = true;
    }
  }, [currentChat?._id, socket, user]);

  /**
   * Emit STOP_TYPING event
   */
  const emitStopTyping = useCallback(() => {
    if (!currentChat?._id || !socket || !user) return;

    if (isCurrentlyTypingRef.current) {
      // Emit a stop typing event to the server for the current chat
      socket.emit(STOP_TYPING_EVENT, currentChat?._id);

      // Reset the user's typing state
      isCurrentlyTypingRef.current = false;
    }
  }, [currentChat?._id, socket, user]);

  /**
   * Handles when a user starts typing
   * Adds them to the typing users list and sets up auto-cleanup
   */
  const handleStartTyping = useCallback(
    (data: TypingEventData) => {
      console.log('📨 Received START_TYPING event:', data);

      // Only process if it's for the current chat
      if (data.chatId !== currentChat?._id) {
        console.log('❌ Ignoring - different chat');
        return;
      }

      // ✅ Don't show typing indicator for current user
      if (data.userId === user?._id) {
        console.log('❌ Ignoring - current user typing');
        return;
      }

      const timestamp = Date.now();

      // Add user to typing users or update their timestamp
      setTypingUsers((prev) => {
        const existingUserIndex = prev.findIndex((u) => u.userId === data.userId);

        if (existingUserIndex >= 0) {
          // Update existing user's timestamp
          const updated = [...prev];
          updated[existingUserIndex] = {
            userId: data.userId,
            username: data.username,
            timestamp,
          };
          console.log('✅ Updated typing user:', data.username);
          return updated;
        } else {
          // Add new user
          console.log('✅ Added new typing user:', data.username);
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username,
              timestamp,
            },
          ];
        }
      });

      setIsTyping(true);

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to automatically stop typing indicator after delay
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers((prev) => {
          const now = Date.now();
          const filtered = prev.filter((u) => now - u.timestamp < AUTO_STOP_TYPING_DELAY);

          if (filtered.length === 0) {
            setIsTyping(false);
          }

          return filtered;
        });
      }, AUTO_STOP_TYPING_DELAY);
    },
    [currentChat?._id, user?._id]
  );

  /**
   * ✅ FIXED: Handles when a user stops typing
   */
  const handleStopTyping = useCallback(
    (data: TypingEventData) => {
      console.log('📨 Received STOP_TYPING event:', data);

      // Only process if it's for the current chat
      if (data.chatId !== currentChat?._id) {
        console.log('❌ Ignoring - different chat');
        return;
      }

      // Remove user from typing users
      setTypingUsers((prev) => {
        const newTypingUsers = prev.filter((u) => u.userId !== data.userId);

        console.log(
          `✅ Removed typing user: ${data.username}, remaining: ${newTypingUsers.length}`
        );

        // If no users are typing, hide the typing indicator
        if (newTypingUsers.length === 0) {
          setIsTyping(false);

          // Clear timeout since no one is typing
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }

        return newTypingUsers;
      });
    },
    [currentChat?._id]
  );

  /**
   * Get formatted string of who is typing
   */
  const getTypingText = useCallback(() => {
    const count = typingUsers.length;

    if (count === 0) return '';

    if (count === 1) {
      return `${typingUsers[0].username} is typing...`;
    }

    if (count === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    }

    const others = count - 2;
    return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${others} other${
      others > 1 ? 's' : ''
    } are typing...`;
  }, [typingUsers]);

  /**
   * Reset typing state when chat changes or component unmounts
   */
  const resetTypingState = useCallback(() => {
    setIsTyping(false);
    setTypingUsers([]);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  return {
    handleStartTyping,
    handleStopTyping,
    resetTypingState,
    typingTimeoutRef,
    isTyping,
    typingUsers,
    setIsTyping,
    setTypingUsers,
    emitStartTyping,
    emitStopTyping,
    isCurrentlyTypingRef,
    AUTO_STOP_TYPING_DELAY,
    getTypingText,
  };
};
