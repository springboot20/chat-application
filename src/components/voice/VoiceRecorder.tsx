import React from 'react';
import { PauseIcon, PlayIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
// import { LiveWaveform } from './LiveWaveform';
import {
  ChevronLeftIcon,
  ChevronUpIcon,
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '../../utils';

interface VoiceRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioLevel: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSend: () => void;
  hasRecording: boolean;
  isRecordingCancelled: boolean;
  uiState: 'idle' | 'recording' | 'locked' | 'cancelled';
  micRef: React.RefObject<HTMLDivElement>;
  cancelRef: React.RefObject<HTMLDivElement>;
  lockRef: React.RefObject<HTMLDivElement>;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  isPaused,
  recordingTime,
  // audioLevel,
  onPause,
  onResume,
  onCancel,
  onSend,
  uiState,
  micRef,
  cancelRef,
  lockRef, // Passed from the hook
}) => {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  if (uiState === 'idle') return null;

  return (
    <div className='relative flex items-center w-full h-16 bg-gray-50 dark:bg-zinc-900 rounded-full px-2'>
      {/* 1. LEFT SIDE: Recording Info & Waveform */}
      {/* Recording indicator and time */}
      {/* <div className='flex items-center flex-1 gap-3 px-2'>
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

        <div className='flex-1 h-10 overflow-hidden'>
          <LiveWaveform isPaused={isPaused} audioLevel={audioLevel} isRecording={isRecording} />
        </div>
      </div> */}

      {/* 2. CENTER: Slide to Cancel (Controlled via Ref) */}
      <AnimatePresence>
        {uiState === 'recording' && (
          <motion.div
            ref={cancelRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className='absolute left-1/2 -translate-x-1/2 flex items-center gap-1 text-gray-400 pointer-events-none'>
            <ChevronLeftIcon className='h-4 w-4 animate-bounce-x' />
            <span className='text-sm'>Slide to cancel</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. RIGHT SIDE: The Mic / Actions */}
      <div className='relative flex items-center justify-end w-12 h-12'>
        {/* Lock Indicator (Controlled via Ref) */}
        <div
          ref={lockRef}
          className={classNames(
            `absolute -top-32 p-2 rounded-full transition-colors`,
            uiState === 'locked' ? 'hidden' : 'flex flex-col items-center',
          )}>
          <ChevronUpIcon className='h-5 w-5 text-gray-400 animate-bounce' />
          <div className='bg-white dark:bg-zinc-800 p-1 rounded-full shadow-lg'>
            <LockClosedIcon className='h-4 w-4 text-gray-500' />
          </div>
        </div>

        {/* The Draggable Mic Handle */}
        <div
          ref={micRef}
          className='z-50 p-3 bg-blue-500 rounded-full text-white shadow-xl touch-none mb-40'>
          {uiState === 'locked' ? (
            <PaperAirplaneIcon className='h-6 w-6' onClick={onSend} />
          ) : (
            <div className='h-6 w-6 rounded-full bg-white/20 animate-ping absolute inset-0' />
          )}
          {uiState === 'locked' ? (
            <LockOpenIcon className='h-6 w-6' />
          ) : (
            <LockClosedIcon className='h-6 w-6' />
          )}
        </div>
      </div>

      {/* 4. LOCKED CONTROLS */}
      {uiState === 'locked' && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className='absolute inset-0 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 rounded-full z-[60]'>
          {/* Delete Recording */}
          <button
            type='button'
            onClick={onCancel}
            className='text-gray-500 hover:text-red-500 p-2 transition-colors'
            title='Delete recording'>
            <TrashIcon className='h-6 w-6' />
          </button>

          {/* Center Status (Optional: Add a "Recording" or "Paused" label here) */}
          <div className='flex-1 flex justify-center'>
            {!isRecording && (
              <span className='text-xs font-bold uppercase text-white'>Review Mode</span>
            )}
          </div>

          <div className='flex items-center gap-3'>
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

            {/* Send Button */}
            <button
              type='button'
              onClick={onSend}
              title='send voice record'
              className='p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md transition-all active:scale-90'>
              <PaperAirplaneIcon className='h-5 w-5' />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
