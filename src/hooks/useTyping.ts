import { useMemo, useState, useRef } from "react";
import { useChat } from "./useChat";

export const useTyping = () => {
  const { currentChat } = useChat();

  const typingTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userTyping, setUserTyping] = useState<boolean>(false);

  const handleStartTyping = (chatId: string) => {
    if (chatId !== currentChat.current?._id) return;

    setIsTyping(true);
  };

  const handleStopTyping = (chatId: string) => {
    if (chatId !== currentChat.current?._id) return;

    setIsTyping(false);
  };

  return useMemo(
    () => ({
      handleStartTyping,
      handleStopTyping,
      typingTimeOutRef,
      isTyping,
      userTyping,
      setIsTyping,
    }),
    [handleStartTyping, handleStopTyping, typingTimeOutRef, isTyping, userTyping, setIsTyping]
  );
};
