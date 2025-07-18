import { useState, useRef, useCallback } from "react";
import { ChatListItemInterface } from "../types/chat";
import { User } from "../types/auth";

interface useTypingProps {
  currentChat: ChatListItemInterface;
  user: User | null;
}

export const useTyping = ({ currentChat, user }: useTypingProps) => {
  const typingTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const handleStartTyping = useCallback(
    (data: any) => {
      console.log("Start typing data:", data);
      // Check if the typing event is for the current chat
      if (data.chatId === currentChat?._id) {
        // Don't show typing indicator for current user
        if (data.userId !== user?._id) {
          setIsTyping(true);

          // Add user to typing users if not already present
          setTypingUsers((prev) => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });

          // Clear any existing timeout
          if (typingTimeOutRef.current) {
            clearTimeout(typingTimeOutRef.current);
          }

          // Set timeout to automatically stop typing indicator after 3 seconds
          // typingTimeOutRef.current = setTimeout(() => {
          //   setIsTyping(false);
          //   setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
          // }, 3000);
        }
      }
    },
    [currentChat?._id, user?._id]
  );

  const handleStopTyping = useCallback(
    (data: any) => {
      console.log("Stop typing data:", data);

      // Check if the stop typing event is for the current chat
      if (data.chatId === currentChat?._id) {
        // Remove user from typing users
        setTypingUsers((prev) => {
          const newTypingUsers = prev.filter((id) => id !== data.userId);

          // If no users are typing, hide the typing indicator
          if (newTypingUsers.length === 0) {
            setIsTyping(false);
          }

          return newTypingUsers;
        });

        // Clear timeout if it exists
        if (typingTimeOutRef.current) {
          clearTimeout(typingTimeOutRef.current);
          typingTimeOutRef.current = null;
        }
      }
    },
    [currentChat?._id]
  );

  // Reset typing state when chat changes
  const resetTypingState = useCallback(() => {
    setIsTyping(false);
    setTypingUsers([]);
    if (typingTimeOutRef.current) {
      clearTimeout(typingTimeOutRef.current);
      typingTimeOutRef.current = null;
    }
  }, []);

  return {
    handleStartTyping,
    handleStopTyping,
    resetTypingState,
    typingTimeOutRef,
    isTyping,
    typingUsers,
    setIsTyping,
    setTypingUsers,
  };
};
