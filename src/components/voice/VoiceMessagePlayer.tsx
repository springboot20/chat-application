import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
// import { ForwardIcon } from '@heroicons/react/24/outline';
import WaveSurfer from 'wavesurfer.js';
import { classNames } from '../../utils';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  isOwnMessage: boolean;
}

// ✅ Playback speeds
const PLAYBACK_SPEEDS = [1, 1.5, 2];

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  duration,
  isOwnMessage,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // ✅ Playback speed state

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: isOwnMessage ? '#a78bfa' : '#86efac',
      progressColor: isOwnMessage ? '#7c3aed' : '#22c55e',
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      height: 40,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioUrl);

    // Event listeners
    wavesurfer.on('ready', () => {
      console.log('✅ WaveSurfer ready');
      // Set initial playback speed
      wavesurfer.setPlaybackRate(playbackSpeed);
    });

    wavesurfer.on('audioprocess', () => {
      const time = wavesurfer.getDuration();

      setCurrentTime(time);
    });

    wavesurfer.on('interaction', () => {
      setCurrentTime(wavesurfer.getDuration());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      wavesurfer.seekTo(0);
      wavesurfer.setTime(0);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, duration, isOwnMessage, playbackSpeed]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  };

  // ✅ Cycle through playback speeds
  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex];

    setPlaybackSpeed(newSpeed);

    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(newSpeed);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex items-center gap-3 min-w-[280px] max-w-[380px] px-0.5'>
      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className={classNames(
          'p-2 rounded-full transition-all flex-shrink-0',
          isOwnMessage
            ? 'bg-violet-500 hover:bg-violet-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white',
        )}>
        {isPlaying ? <PauseIcon className='h-5 w-5' /> : <PlayIcon className='h-5 w-5' />}
      </button>

      {/* Waveform */}
      <div className='flex-1 min-w-0'>
        <div ref={waveformRef} className='w-full' />
      </div>

      {/* Duration and Speed Control */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        {/* Duration */}
        <span className='text-xs text-gray-600 dark:text-gray-300 min-w-[40px]'>
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </span>

        {/* ✅ Speed Control Button */}
        <button
          onClick={cyclePlaybackSpeed}
          className={classNames(
            'px-2 py-1 rounded-md text-xs font-semibold transition-all',
            isOwnMessage
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
          )}
          title='Change playback speed'>
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
};
