import { useRef, useState, useCallback } from 'react';

export const useRecordingLock = () => {
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [slideProgress, setSlideProgress] = useState({ x: 0, y: 0 });

  const LOCK_THRESHOLD = 80;
  const CANCEL_THRESHOLD = 100;

  const onStart = useCallback((x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    setIsLocked(false);
    setIsCancelled(false);
    setSlideProgress({ x: 0, y: 0 });
  }, []);

  const onMove = useCallback(
    (x: number, y: number) => {
      if (startY.current === null || startX.current === null) return;

      const deltaY = startY.current - y; // Positive = UP
      const deltaX = startX.current - x; // Positive = LEFT

      // ✅ Update progress for visual feedback
      setSlideProgress({ x: deltaX, y: deltaY });

      // Check for lock
      if (deltaY > LOCK_THRESHOLD && !isLocked) {
        setIsLocked(true);
      }

      // Check for cancel
      if (deltaX > CANCEL_THRESHOLD && !isCancelled) {
        setIsCancelled(true);
      }
    },
    [isLocked, isCancelled],
  );

  const onEnd = useCallback(() => {
    startY.current = null;
    startX.current = null;
    setSlideProgress({ x: 0, y: 0 });
  }, []);

  const reset = useCallback(() => {
    setIsLocked(false);
    setIsCancelled(false);
    setSlideProgress({ x: 0, y: 0 });
    startY.current = null;
    startX.current = null;
  }, []);

  return {
    isLocked,
    isCancelled,
    slideProgress, // ✅ Export for UI feedback
    onStart,
    onMove,
    onEnd,
    reset,
    LOCK_THRESHOLD,
    CANCEL_THRESHOLD,
  };
};
