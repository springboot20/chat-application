import React from 'react';
import { PauseIcon, PlayIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { LiveWaveform } from './LiveWaveform';
import {
  ChevronLeftIcon,
  ChevronUpIcon,
  LockClosedIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useTransform, MotionValue } from 'framer-motion';

interface VoiceRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  audioLevel: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSend: () => void;
  stopRecording: () => void;
  hasRecording: boolean;
  isRecordingCancelled: boolean;
  uiState: 'idle' | 'recording' | 'locked' | 'cancelled';
  audioUrl?: string | null;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  isPaused,
  recordingTime,
  audioLevel,
  stopRecording,
  onPause,
  onResume,
  onCancel,
  onSend,
  uiState,
  x,
  y,
}) => {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ✅ Hooks MUST be at the top level
  const cancelOpacity = useTransform(x, [0, -40], [1, 0.4]);
  const cancelXOffset = useTransform(x, [0, -20], [0, -10]);
  const lockOpacity = useTransform(y, [0, -40], [1, 0.4]);
  const lockScale = useTransform(y, [0, -40], [1, 1.2]);
  const lockYOffset = useTransform(y, [0, -30], [0, -20]);

  if (uiState === 'idle') return null;

  return (
    <div className='relative flex items-center w-full h-16 bg-gray-50 dark:bg-[#111b21] rounded-full px-4 overflow-hidden'>
      {/* 1. RECORDING STATE UI (when holding) */}
      {uiState === 'recording' && (
        <>
          {/* Left: Indicator & Timer */}
          <div className='flex items-center gap-3 z-10'>
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className='h-2.5 w-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]'
            />
            <span className='text-sm font-medium tabular-nums text-gray-700 dark:text-gray-200'>
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Center: Slide to cancel */}
          <AnimatePresence>
            <motion.div
              style={{ opacity: cancelOpacity, x: cancelXOffset }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className='absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400 pointer-events-none'>
              <ChevronLeftIcon className='h-4 w-4 animate-bounce-x' />
              <span className='text-xs font-semibold uppercase tracking-wider'>
                Slide to cancel
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Right: Lock Indicator (Revealed from above) */}
          <div className='relative ml-auto flex items-center justify-end w-12 h-12'>
            <motion.div
              style={{
                opacity: lockOpacity,
                y: lockYOffset,
                scale: lockScale,
              }}
              className='absolute -top-32 flex flex-col items-center gap-1'>
              <ChevronUpIcon className='h-5 w-5 text-gray-400 animate-bounce' />
              <div className='bg-white dark:bg-[#202c33] p-2 rounded-full shadow-lg border dark:border-white/5'>
                <LockClosedIcon className='h-5 w-5 text-gray-500 dark:text-gray-400' />
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* 2. LOCKED STATE UI */}
      {uiState === 'locked' && (
        <motion.div
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className='absolute inset-0 flex items-center px-4 gap-4 bg-gray-50 dark:bg-[#111b21] z-[60]'>
          {/* Trash Icon */}
          <button
            type='button'
            onClick={onCancel}
            className='p-2 text-gray-500 hover:text-red-500 transition-colors shrink-0'
            title='Discard recording'>
            <TrashIcon className='h-6 w-6' />
          </button>

          {/* Center: Waveform & Timer */}
          <div className='flex-1 flex items-center gap-3 min-w-0'>
            <div className='flex-1 h-8 min-w-0'>
              <LiveWaveform isPaused={isPaused} audioLevel={audioLevel} isRecording={isRecording} />
            </div>
            <span className='text-sm font-medium tabular-nums text-gray-700 dark:text-gray-200 shrink-0'>
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Dynamic Actions: Play/Pause/Stop/Send */}
          <div className='flex items-center gap-2 shrink-0'>
            {/* Dynamic Action Button: Play/Pause */}
            <button
              type='button'
              onClick={isPaused ? onResume : onPause}
              className='p-2 bg-gray-100 dark:bg-zinc-800 rounded-full'>
              {isPaused ? (
                <PlayIcon className='h-5 w-5 text-white' />
              ) : (
                <PauseIcon className='h-5 w-5 text-red-500' />
              )}
            </button>

            {isRecording && (
              <button
                type='button'
                onClick={stopRecording}
                className='p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors'
                title='Stop recording'>
                <StopIcon className='h-5 w-5' />
              </button>
            )}

            {(isPaused || !isRecording) && (
              <button
                type='button'
                onClick={onSend}
                title='Send recording'
                className='p-2.5 bg-[#008069] text-white rounded-full hover:bg-[#00a884] shadow-md transition-all active:scale-90'>
                <PaperAirplaneIcon className='h-5 w-5' />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
