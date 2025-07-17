import { useMemo, useState, useRef, useCallback } from "react";
// import { useAppSelector } from "../redux/redux.hooks";
// import { RootState } from "../app/store";

export const useTyping = () => {
  // const { currentChat } = useAppSelector((state: RootState) => state.chat);

  const typingTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userTyping, setUserTyping] = useState<boolean>(false);

  const handleStartTyping = useCallback((data: any) => {
    // console.log(chatId);

    // if (chatId === currentChat?._id) {
    //   setIsTyping(true);
    // }

    // return;

    console.log(data);
  }, []);

  const handleStopTyping = useCallback((data: any) => {
    console.log(data);
  }, []);

  return useMemo(
    () => ({
      handleStartTyping,
      handleStopTyping,
      typingTimeOutRef,
      isTyping,
      userTyping,
      setIsTyping,
      setUserTyping,
    }),
    [
      handleStartTyping,
      handleStopTyping,
      typingTimeOutRef,
      isTyping,
      userTyping,
      setIsTyping,
      setUserTyping,
    ]
  );
};
