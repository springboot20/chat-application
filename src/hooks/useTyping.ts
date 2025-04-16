import { useMemo, useState, useRef } from "react";
import { useAppSelector } from "../redux/redux.hooks";
import { RootState } from "../app/store";

export const useTyping = () => {
  const { currentChat } = useAppSelector((state: RootState) => state.chat);

  const typingTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userTyping, setUserTyping] = useState<boolean>(false);

  const handleStartTyping = (chatId: string) => {
    if (chatId !== currentChat?._id) return;

    setIsTyping(true);
  };

  const handleStopTyping = (chatId: string) => {
    if (chatId !== currentChat?._id) return;

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
					setUserTyping
    }),
    [handleStartTyping, handleStopTyping, typingTimeOutRef, isTyping, userTyping, setIsTyping]
  );
};
