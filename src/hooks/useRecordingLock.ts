import { useState, useCallback, useEffect, useRef } from 'react';
import { useMotionValue } from 'framer-motion';

export type RecorderUIState = 'idle' | 'recording' | 'locked' | 'cancelled';

export const useRecordingLock = (LOCK_THRESHOLD = 60, CANCEL_THRESHOLD = 100) => {
  const [uiState, setUIState] = useState<RecorderUIState>('idle');
  const uiStateRef = useRef<RecorderUIState>('idle');

  // Update ref whenever state changes
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  // Motion values for high-performance dragging
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const onStart = useCallback(() => {
    x.set(0);
    y.set(0);
    setUIState('recording');
    if (navigator.vibrate) navigator.vibrate(10);
  }, [x, y]);

  // Sync state with motion values using listeners
  useEffect(() => {
    const unsubscribeX = x.on('change', (latestX) => {
      // Use ref to check current state without re-subscribing
      if (uiStateRef.current === 'recording' && latestX < -CANCEL_THRESHOLD) {
        setUIState('cancelled');
      }
    });

    const unsubscribeY = y.on('change', (latestY) => {
      if (uiStateRef.current === 'recording' && latestY < -LOCK_THRESHOLD) {
        setUIState('locked');
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      }
    });

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [x, y, CANCEL_THRESHOLD, LOCK_THRESHOLD]);

  const reset = useCallback(() => {
    setUIState('idle');
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { uiState, x, y, onStart, reset, LOCK_THRESHOLD, CANCEL_THRESHOLD };
};
