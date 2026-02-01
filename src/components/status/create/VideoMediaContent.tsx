import {
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  TrashIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useStatusStories } from '../../../hooks/useStatusStories';
import { MediaContentTypes } from './MediaContentTypes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useObjectURL } from '../../../hooks/useObjectUrl';
import { toast } from 'react-toastify';
import { classNames } from '../../../utils';
import CameraViewfinder from '../CameraViewFinder';
import CaptionInputComponent from '../CaptionInputComponent';

const MAX_DURATION = 30;

export default function VideoMediaContent() {
  const {
    closeMediaContent,
    selectedVideoFiles,
    setSelectedVideoFiles,
    activeVideoFileIndex,
    setActiveVideoFileIndex,
  } = useStatusStories();

  // Mode state: 'gallery' shows the upload/preview, 'camera' shows viewfinder
  const [viewMode, setViewMode] = useState<'gallery' | 'camera'>('gallery');
  const selectedVideo = selectedVideoFiles[activeVideoFileIndex];

  const videoUrl = useObjectURL(selectedVideo);

  const handleVideoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) return;

    const newFiles = Array.from(files);

    if (newFiles.length > 5) {
      toast.warning('You can only upload up to 5 videos at a time.');
      return;
    }

    setSelectedVideoFiles((prev) => {
      const combined = [...newFiles, ...prev];

      return combined;
    });

    setActiveVideoFileIndex(0);
  };

  const handleCapture = (file: File) => {
    setSelectedVideoFiles((prev) => [...prev, file]);
    setActiveVideoFileIndex(selectedVideoFiles.length);
    setViewMode('gallery'); // Return to preview the recorded video
  };

  const handleMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (e.currentTarget.duration > MAX_DURATION) {
      toast.warning(`Video too long! Please keep it under ${MAX_DURATION} seconds.`);
      setSelectedVideoFiles((prev) => prev.filter((_, i) => i !== activeVideoFileIndex));
    }
  };

  const removeVideo = useCallback(
    (index: number) => {
      setSelectedVideoFiles((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        // Adjust active index if we deleted the current or last item
        if (activeVideoFileIndex >= filtered.length) {
          setActiveVideoFileIndex(Math.max(0, filtered.length - 1));
        }
        return filtered;
      });
    },
    [activeVideoFileIndex, setActiveVideoFileIndex, setSelectedVideoFiles],
  );

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      className='mt-16 bg-gray-600/30 h-screen flex flex-col'>
      <header className='h-14 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 shrink-0'>
        <button
          type='button'
          onClick={closeMediaContent}
          className='size-8 flex items-center justify-center rounded-full'>
          <XMarkIcon className='h-5 text-gray-800 dark:text-white' />
        </button>
        <MediaContentTypes />
        <div className='w-10' />
      </header>

      <div className='p-4 space-y-4 flex-1 flex flex-col h-full'>
        {/* Source Switcher */}
        <div className='flex justify-center shrink-0'>
          <div className='flex bg-black/20 p-1 rounded-full'>
            <button
              type='button'
              onClick={() => setViewMode('gallery')}
              className={classNames(
                'px-6 py-1.5 rounded-full text-xs font-bold transition-all',
                viewMode === 'gallery' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400',
              )}>
              Gallery
            </button>
            <button
              type='button'
              onClick={() => setViewMode('camera')}
              className={classNames(
                'px-6 py-1.5 rounded-full text-xs font-bold transition-all',
                viewMode === 'camera' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400',
              )}>
              Camera
            </button>
          </div>
        </div>

        <div className='relative aspect-[9/16] w-full max-h-[480px] mx-auto bg-black rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10'>
          <AnimatePresence mode='wait'>
            {viewMode === 'camera' ? (
              <motion.div
                key='cam'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='h-full'>
                <CameraViewfinder mode='video' onCapture={handleCapture} />
              </motion.div>
            ) : (
              <motion.div
                key='gal'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='h-full'>
                {videoUrl ? (
                  <VideoPreviewPlayer file={selectedVideo} handleMetadata={handleMetadata} />
                ) : (
                  <label className='h-full flex flex-col items-center justify-center cursor-pointer p-10 text-center'>
                    <div className='p-6 bg-gray-100 dark:bg-white/5 rounded-full mb-4'>
                      <VideoCameraIcon className='h-12 w-12 text-gray-400' />
                    </div>
                    <p className='text-sm font-medium text-gray-500'>
                      Tap to upload a video status
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>Up to 30 seconds</p>
                    <input
                      type='file'
                      hidden
                      accept='video/*'
                      multiple
                      onChange={handleVideoSelection}
                    />
                  </label>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Caption Field - Only show if a video is selected and in gallery mode */}
        {videoUrl && <CaptionInputComponent file={selectedVideo as File} type='video' />}

        <div className='flex items-center gap-3 overflow-x-auto py-2 px-2 scrollbar-hide'>
          {/* Add More Button */}
          {selectedVideoFiles.length < 6 && (
            <label className='flex-shrink-0 size-16 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group'>
              <PlusIcon className='size-6 text-gray-400 group-hover:text-blue-500' />
              <input type='file' hidden accept='video/*' multiple onChange={handleVideoSelection} />
            </label>
          )}

          <AnimatePresence>
            {selectedVideoFiles.map((file, idx) => (
              <VideoThumbnail
                key={file.name + idx}
                file={file}
                isActive={idx === activeVideoFileIndex}
                onSelect={() => setActiveVideoFileIndex(idx)}
                onRemove={() => removeVideo(idx)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function VideoThumbnail({ file, isActive, onSelect, onRemove }: any) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const video = document.createElement('video');
    const fileUrl = URL.createObjectURL(file);

    video.src = fileUrl;
    video.load();
    video.currentTime = 1; // Seek to 1 second to get a good preview frame
    video.muted = true;

    const handleCapture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      setThumbnail(canvas.toDataURL('image/jpeg'));
      URL.revokeObjectURL(fileUrl); // Clean up memory
    };

    video.addEventListener('loadeddata', handleCapture);
    return () => {
      video.removeEventListener('loadeddata', handleCapture);
      URL.revokeObjectURL(fileUrl);
    };
  }, [file]);

  return (
    <motion.div
      layout
      className={classNames(
        'relative flex-shrink-0 size-16 rounded-xl overflow-hidden cursor-pointer ring-2 transition-all',
        isActive ? 'ring-blue-500 ring-offset-2' : 'ring-transparent opacity-70',
      )}
      onClick={onSelect}>
      {thumbnail ? (
        <img src={thumbnail} className='h-full w-full object-cover' alt='Video thumb' />
      ) : (
        <div className='h-full w-full bg-gray-800 animate-pulse' />
      )}

      {/* Video Indicator Icon */}
      <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
        <PlayIcon className='size-5 text-white/80' />
      </div>

      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className='absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-md hover:bg-red-500'>
        <TrashIcon className='size-3' />
      </button>
    </motion.div>
  );
}

function VideoPreviewPlayer({
  file,
  handleMetadata,
}: {
  file: File;
  handleMetadata: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useObjectURL(file);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // Allow user to click the bar to seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  return (
    <div className='relative h-full w-full bg-black flex items-center justify-center group'>
      <video
        ref={videoRef}
        src={videoUrl || ''}
        onLoadedDataCapture={(event) => {
          handleMetadata(event);
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className='h-full w-full object-contain'
        autoPlay
        muted={isMuted}
        loop
        playsInline
      />

      {/* Progress Bar Container */}
      <div className='absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent z-20'>
        <fieldset>
          <label htmlFor='range' className='sr-only'>
            Progress
          </label>
          <input
            type='range'
            id='range'
            min='0'
            max='100'
            value={progress}
            onChange={handleSeek}
            className='w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all'
          />
        </fieldset>
        <div className='flex justify-between mt-1'>
          <span className='text-[10px] text-white font-medium'>
            {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0}s
          </span>
          <span className='text-[10px] text-white font-medium'>{Math.floor(duration)}s</span>
        </div>
      </div>

      {/* Play/Pause Overlay Button (visible on hover or when paused) */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <button
          type='button'
          onClick={togglePlay}
          className='p-4 bg-black/40 rounded-full text-white'>
          {isPlaying ? <PauseIcon className='size-10' /> : <PlayIcon className='size-10' />}
        </button>
      </div>

      {/* Mute/Unmute Toggle */}
      <button
        type='button'
        onClick={() => setIsMuted(!isMuted)}
        className='absolute bottom-20 right-4 z-50 p-2 bg-black/50 rounded-full text-white'>
        {isMuted ? <SpeakerXMarkIcon className='size-6' /> : <SpeakerWaveIcon className='size-6' />}
      </button>
    </div>
  );
}
