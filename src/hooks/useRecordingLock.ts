import { useRef, useState, useCallback } from 'react';

export type RecorderUIState = 'idle' | 'recording' | 'locked' | 'cancelled';

export const useRecordingLock = (LOCK_THRESHOLD = 60, CANCEL_THRESHOLD = 100) => {
  const [uiState, setUIState] = useState<RecorderUIState>('idle');
  const startPos = useRef({ x: 0, y: 0 });

  // Refs to manipulate DOM directly for 60fps performance
  const micRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Track whether user is currently dragging
  const isDragging = useRef(false);

  const onStart = useCallback((x: number, y: number) => {
    startPos.current = { x, y };
    isDragging.current = true;
    setUIState('recording');
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const onMove = useCallback(
    (x: number, y: number) => {
      if (!isDragging.current) return;
      if (uiState === 'locked' || uiState === 'idle') return;

      const dx = x - startPos.current.x;
      const dy = y - startPos.current.y;

      // Direct DOM manipulation (No React State updates here!)
      if (micRef.current) {
        const translateX = Math.min(0, dx); // Only allow left swipe
        const translateY = Math.min(0, dy); // Only allow up swipe
        micRef.current.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.1)`;
      }

      // Visual feedback for Cancel/Lock (Opacity & Intensity)
      if (cancelRef.current) {
        const opacity = Math.max(0, 1 - Math.abs(dx) / CANCEL_THRESHOLD);
        cancelRef.current.style.opacity = opacity.toString();
      }

      // Logic Thresholds
      if (dx < -CANCEL_THRESHOLD) {
        setUIState('cancelled');
      } else if (dy < -LOCK_THRESHOLD) {
        setUIState('locked');
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      }
    },
    [uiState, CANCEL_THRESHOLD, LOCK_THRESHOLD],
  );

  // ✅ NEW: Called when pointer is released
  const onEnd = useCallback(() => {
    isDragging.current = false;

    // Reset visual transforms
    if (micRef.current) {
      micRef.current.style.transform = '';
    }
    if (cancelRef.current) {
      cancelRef.current.style.opacity = '1';
    }
    if (lockRef.current) {
      lockRef.current.style.opacity = '1';
    }
  }, []);

  const reset = useCallback(() => {
    setUIState('idle');
    isDragging.current = false;
    startPos.current = { x: 0, y: 0 };

    // Clean up any lingering transforms
    if (micRef.current) micRef.current.style.transform = '';
    if (cancelRef.current) cancelRef.current.style.opacity = '1';
    if (lockRef.current) lockRef.current.style.opacity = '1';
  }, []);

  return { uiState, onStart, onMove, reset, micRef, cancelRef, lockRef,onEnd };
};
