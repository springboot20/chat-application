import React from 'react';
import {
  StopIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/solid';
import { classNames } from '../../utils';
import { LiveWaveform } from './LiveWaveForm';
import { TrashIcon } from '@heroicons/react/24/outline';

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
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
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
