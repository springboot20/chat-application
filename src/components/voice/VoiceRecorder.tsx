import React from 'react';
import {
  StopIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/solid';
import { classNames } from '../../utils';
import { LiveWaveform } from './LiveWaveform';
import { ChevronLeftIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  isRecording: boolean;
  isRecordingCancelled: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioLevel: number;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSend: () => void;
  hasRecording: boolean;
  isLocked: boolean;
  isCancelled: boolean;

  slideProgress?: { x: number; y: number };
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  isPaused,
  recordingTime,
  audioLevel,
  onStop,
  onPause,
  onResume,
  onCancel,
  onSend,
  hasRecording,
  isRecordingCancelled,
  isLocked = false,
  isCancelled,
  slideProgress,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Calculate visual feedback intensity based on slide distance
  const getCancelIntensity = () => {
    if (!slideProgress) return 0;
    return Math.min(Math.abs(slideProgress.x) / 100, 1); // 0 to 1
  };

  const getLockProgress = () => {
    if (!slideProgress) return 0;
    return Math.min(Math.abs(slideProgress.y) / 80, 1); // 0 to 1
  };

  if (isRecording) {
    return isLocked ? (
      <div className='flex flex-col gap-2 bg-gray-100 dark:bg-white/5 rounded-2xl px-4 py-3 animate-in fade-in w-full'>
        {/* ✅ Live Waveform Visualizer */}
        <div className='w-full h-[70px] bg-gray-200 dark:bg-white/10 rounded-lg overflow-hidden'>
          <LiveWaveform audioLevel={audioLevel} isRecording={isRecording} isPaused={isPaused} />
        </div>

        {/* Controls */}
        <div className='flex items-center justify-between'>
          {/* Recording indicator and time */}
          <div className='flex items-center gap-2'>
            <span
              className={classNames(
                'h-3 w-3 rounded-full',
                isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse',
              )}
            />
            <span className='text-sm font-medium text-gray-700 dark:text-white'>
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Action buttons */}
          <div className='flex items-center gap-2'>
            {/* Pause/Resume */}
            <button
              type='button'
              onClick={isPaused ? onResume : onPause}
              className='p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors'
              title={isPaused ? 'Resume' : 'Pause'}>
              {isPaused ? (
                <PlayIcon className='h-5 w-5 text-gray-700 dark:text-white' />
              ) : (
                <PauseIcon className='h-5 w-5 text-gray-700 dark:text-white' />
              )}
            </button>

            {/* Stop */}
            <button
              type='button'
              onClick={onStop}
              className='p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors'
              title='Stop recording'>
              <StopIcon className='h-5 w-5' />
            </button>

            {/* Cancel */}
            <button
              type='button'
              onClick={onCancel}
              className='p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors'
              title='Cancel'>
              <XMarkIcon className='h-5 w-5 text-gray-700 dark:text-white' />
            </button>
          </div>
        </div>
      </div>
    ) : (
      /* Inside the Holding View (isRecording && !isLocked) block */

      // ✅ HOLDING/UNLOCKED STATE - Gesture-based UI
      <div className='flex items-center justify-between w-full bg-white dark:bg-black h-14 px-2 overflow-hidden relative'>
        <div className='flex items-center gap-3 font-nunito'>
          {/* ✅ FIXED: Trash icon with progressive feedback */}
          <motion.div
            animate={
              isCancelled
                ? {
                    scale: 1.3,
                    rotate: [0, -15, 15, -15, 0],
                    color: '#ef4444',
                  }
                : {
                    scale: 1 + getCancelIntensity() * 0.2, // Grows as user slides
                    rotate: [-5, 5, -5],
                  }
            }
            transition={
              isCancelled ? { duration: 0.4 } : { rotate: { repeat: Infinity, duration: 0.5 } }
            }
            style={{
              color: isCancelled ? '#ef4444' : `rgb(156, 163, 175)`, // gray-400
            }}>
            <TrashIcon
              className='h-6 w-6'
              style={{
                opacity: 0.5 + getCancelIntensity() * 0.5, // Fades in as user slides
              }}
            />
          </motion.div>

          {/* Recording timer */}
          <div className='flex items-center gap-2'>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className='h-2.5 w-2.5 rounded-full bg-red-500'
            />
            <span className='font-nunito text-sm dark:text-white'>{formatTime(recordingTime)}</span>
          </div>
        </div>

        {/* ✅ FIXED: Slide to cancel text with better exit animation */}
        <AnimatePresence mode='wait'>
          {!isCancelled && (
            <motion.div
              key='slide-text'
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: 1 - getCancelIntensity() * 0.5, // Fade as user slides
                x: 0,
              }}
              exit={{
                x: -100,
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.15 },
              }}
              className='flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mr-10 font-nunito'>
              <ChevronLeftIcon className="h-4 w-4" /> <span> Slide to cancel</span>
            </motion.div>
          )}

          {/* ✅ NEW: "Release to cancel" message when threshold reached */}
          {isCancelled && (
            <motion.div
              key='cancel-text'
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className='flex items-center gap-2 text-red-500 text-sm font-semibold mr-10'>
              <TrashIcon className='h-4 w-4' />
              <span>Release to cancel</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ FIXED: Lock indicator with progress feedback */}
        <AnimatePresence>
          {!isLocked && (
            <motion.div
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              animate={{
                y: [0, -8, 0],
                opacity: 0.6 + getLockProgress() * 0.4, // Becomes more visible
                scale: 1 + getLockProgress() * 0.1, // Slightly grows
              }}
              transition={{
                y: { repeat: Infinity, duration: 1.5 },
                opacity: { duration: 0.1 },
                scale: { duration: 0.1 },
              }}
              className='absolute -top-12 right-4 flex flex-col items-center text-gray-400 dark:text-gray-500'>
              <ChevronUpIcon
                className='h-5 w-5'
                style={{
                  color: getLockProgress() > 0.7 ? '#22c55e' : undefined, // Green when close
                }}
              />
              <span className='text-[10px] font-bold uppercase'>
                {getLockProgress() > 0.7 ? 'Release!' : 'Lock'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (hasRecording && !isRecordingCancelled) {
    return (
      <div className='flex items-center gap-3 bg-gray-100 dark:bg-white/5 rounded-full px-4 py-2 animate-in fade-in w-full justify-between'>
        <span className='text-sm font-medium text-gray-700 dark:text-white'>
          {formatTime(recordingTime)}
        </span>

        {/* Send */}
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onSend}
            className='p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all hover:scale-110'
            title='Send voice message'>
            <PaperAirplaneIcon className='h-5 w-5' />
          </button>

          {/* Cancel */}
          <button
            type='button'
            onClick={onCancel}
            className='p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors'
            title='Cancel'>
            <TrashIcon className='h-5 w-5 text-gray-700 dark:text-white' />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
