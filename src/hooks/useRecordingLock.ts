import { useRef, useState } from 'react';

export const useRecordingLock = () => {
  const startY = useRef<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const LOCK_THRESHOLD = 60;

  const onStart = (y: number) => {
    startY.current = y;
    setIsLocked(false);
  };

  const onMove = (y: number) => {
    if (startY.current === null || isLocked) return;
    if (startY.current - y > LOCK_THRESHOLD) {
      setIsLocked(true);
    }
  };

  const onEnd = () => {
    startY.current = null;
  };

  return { isLocked, onStart, onMove, onEnd };
};
