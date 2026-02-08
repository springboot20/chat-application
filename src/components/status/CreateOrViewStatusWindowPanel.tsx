import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  EyeIcon,
  PauseIcon,
  PhotoIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  TrashIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useStatusStories } from '../../hooks/useStatusStories';
import { classNames } from '../../utils';
import { AnimatePresence, motion } from 'framer-motion';
import ImageMediaContent from './create/ImageMediaContent';
import VideoMediaContent from './create/VideoMediaContent';
import TextMediaContent from './create/TextMediaContent';
import { MediaContentType } from '../../context/StatusContext';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../redux/redux.hooks';
import {
  useDeleteStatusMutation,
  useMarkStatusAsViewedMutation,
} from '../../features/status/status.api.slice';
import { useAuth } from '../../context/AuthContext';

export const CreateOrViewStatusWindowPanel = () => {
  const { statusWindow, handleStatusWindowChange } = useStatusStories();
  const { selectedStatusToView } = useAppSelector((state) => state.statusStories);

  return (
    <div className='h-screen w-full overflow-hidden lg:pl-[30rem]'>
      {statusWindow === 'view-status' && selectedStatusToView ? (
        <ViewStatusWindowPanelSlot />
      ) : statusWindow === 'create-status' ? (
        /* Priority 2: Creating a new one */
        <CreateStatusWindowPanelSlot />
      ) : (
        /* Empty State */
        <div className='h-full flex flex-col'>
          <header
            className={classNames(
              'fixed h-16 top-0 right-0 p-1.5 left-0 bg-white dark:bg-black border-b-[1.5px] dark:border-b-white/10 border-b-gray-600/30 z-20 transition-all',
              'lg:hidden',
            )}>
            <div className='h-full w-full flex items-center px-2'>
              <button
                type='button'
                title='close chat'
                className='flex items-center justify-center space-x-2 lg:hidden'
                onClick={(event) => {
                  event.stopPropagation();
                  handleStatusWindowChange(null);
                }}>
                <ArrowLeftIcon className='h-5 w-5 dark:text-white' />
                <span className='text-base font-medium dark:text-white'>View Status</span>
              </button>
              <span className='text-xl text-gray-600 font-medium dark:text-white hidden lg:block'>
                View Status
              </span>
            </div>
          </header>

          <div className='w-full h-full flex justify-center items-center dark:text-white'>
            <div className='text-center'>
              <p className='text-gray-500 dark:text-gray-400 mb-4'>No status updates yet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CreateStatusWindowPanelSlot = () => {
  const { handleStatusWindowChange, mediaContentType, setMediaContentType, MEDIA_TYPES } =
    useStatusStories();

  return (
    <div className='h-full flex flex-col'>
      <header
        className={classNames(
          'fixed h-16 top-0 right-0 p-1.5 left-0 bg-white dark:bg-black border-b-[1.5px] dark:border-b-white/10 border-b-gray-600/30 z-20 transition-all',
          'lg:left-[30rem]',
        )}>
        <div className='h-full w-full flex items-center px-2'>
          <button
            type='button'
            title='close chat'
            className='flex items-center justify-center space-x-2'
            onClick={(event) => {
              event.stopPropagation();
              setMediaContentType(null);
              handleStatusWindowChange('view-status');
            }}>
            <ArrowLeftIcon className='h-5 w-5 dark:text-white' />
            <span className='text-base font-medium dark:text-white'>Create Status</span>
          </button>
        </div>
      </header>

      <Fragment>
        {mediaContentType === null && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 place-content-center place-items-center h-full pb-24 md:pb-0 p-4 max-w-2xl mx-auto'>
            {MEDIA_TYPES.map((type) => (
              <MediaTypeButtonComponent
                key={type}
                type={type}
                activeType={mediaContentType === type}
                setMediaContentType={setMediaContentType}
              />
            ))}
          </div>
        )}

        {mediaContentType === 'text' && <TextMediaContent />}
        {mediaContentType === 'image' && <ImageMediaContent />}
        {mediaContentType === 'video' && <VideoMediaContent />}
      </Fragment>
    </div>
  );
};

const StatusIndicator: React.FC<{
  length: number;
  progress: number;
  activeStatusIndex: number;
}> = ({ length, progress, activeStatusIndex }) => {
  const array = Array.from({ length }).fill('');

  return (
    <div className='flex items-center w-full h-12 gap-x-0.5'>
      {array.map((_, index) => {
        return (
          <div key={index} className='flex-1 h-1 bg-white/30 rounded-full overflow-hidden'>
            <div
              className='h-full bg-white transition-all duration-100 ease-linear'
              style={{
                width:
                  index === activeStatusIndex
                    ? `${progress}%`
                    : index < activeStatusIndex
                      ? '100%'
                      : '0%',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const ViewersModal: React.FC<{
  viewers: any[];
  onClose: () => void;
}> = ({ viewers, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center'
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Viewed by {viewers.length}
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1'>
            <XMarkIcon className='w-5 h-5' />
          </button>
        </div>

        {/* Viewers List */}
        <div className='overflow-y-auto max-h-[calc(70vh-80px)]'>
          {viewers.length > 0 ? (
            <div className='p-2'>
              {viewers.map((viewer: any) => (
                <div
                  key={viewer._id}
                  className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                  <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0'>
                    {viewer.avatar?.url && (
                      <img
                        src={viewer.avatar.url}
                        alt={viewer.name}
                        className='w-full h-full object-cover'
                      />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                      {viewer.name || viewer.username}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {viewer.username && viewer.name !== viewer.username && `@${viewer.username}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-12 text-center text-gray-500 dark:text-gray-400'>
              <EyeIcon className='w-12 h-12 mx-auto mb-3 opacity-50' />
              <p>No views yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const StatusViewerHeader: React.FC<{
  user: any;
  timestamp: string;
  isOwnStatus: boolean;
  viewCount?: number;
  onClose: () => void;
  onDelete: () => void;
  onShowViewers: () => void;
}> = ({ user, timestamp, isOwnStatus, viewCount, onClose, onDelete, onShowViewers }) => {
  return (
    <div className='flex items-center justify-between mb-3'>
      {/* User Info */}
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0'>
          {user?.avatar?.url && (
            <img src={user.avatar.url} alt={user.name} className='w-full h-full object-cover' />
          )}
        </div>
        <div>
          <p className='text-white font-medium text-sm leading-tight'>
            {user?.name || user?.username || 'Unknown'}
          </p>
          <p className='text-white/60 text-xs leading-tight'>{timestamp}</p>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-2'>
        {isOwnStatus && (
          <>
            <button
              type='button'
              onClick={onShowViewers}
              className='flex items-center gap-1.5 text-white/80 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/10'>
              <EyeIcon className='w-4 h-4' />
              <span className='text-sm'>{viewCount || 0}</span>
            </button>
            <button
              type='button'
              onClick={onDelete}
              className='text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10'>
              <TrashIcon className='w-5 h-5' />
            </button>
          </>
        )}
        <button
          type='button'
          onClick={onClose}
          className='text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10'>
          <XMarkIcon className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
};

export const ViewStatusWindowPanelSlot = () => {
  const { user } = useAuth();
  const { selectedStatusToView } = useAppSelector((state) => state.statusStories);
  const {
    handleStatusWindowChange,
    handleSelectedStatusToView,
    activeStatusIndex,
    setActiveStatusIndex,
    progress,
    setProgress,
  } = useStatusStories();

  const [_, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5000);
  const [isMuted, setIsMuted] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const [markAsViewed] = useMarkStatusAsViewedMutation();
  const [deleteStatus] = useDeleteStatusMutation();

  const statuses = selectedStatusToView?.items || [];
  const currentStatus = statuses[activeStatusIndex];
  const isOwnStatus = selectedStatusToView?._id === user?._id;

  const onVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setVideoDuration(e.currentTarget.duration * 1000); // Convert to ms
  };

  useEffect(() => {
    if (currentStatus && !isOwnStatus) {
      // Mark current status as viewed
      markAsViewed(currentStatus._id);
    }
  }, [currentStatus?._id, isOwnStatus, markAsViewed]);

  useEffect(() => {
    if (progress === 0) {
      setElapsedTime(0);
    }

    if (currentStatus && !isPaused) {
      const INTERVAL = 50;
      const DURATION = currentStatus.type === 'video' ? videoDuration : 5000;

      progressIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + INTERVAL;
          const newProgress = (newTime / DURATION) * 100;

          setProgress(Math.min(newProgress, 100));

          if (newTime >= DURATION) {
            clearInterval(progressIntervalRef.current!);
            handleNext();
            return 0; // Reset for next status
          }
          return newTime;
        });
      }, INTERVAL);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [activeStatusIndex, isPaused, currentStatus, videoDuration]);

  const handleNext = useCallback(() => {
    if (activeStatusIndex < statuses.length - 1) {
      setActiveStatusIndex((prev) => prev + 1);
      setProgress(0);
      setElapsedTime(0);
    } else {
      // Close viewer when reaching the end
      handleSelectedStatusToView(null);
    }
  }, [activeStatusIndex, statuses.length, setActiveStatusIndex, handleSelectedStatusToView]);

  const handlePrevious = useCallback(() => {
    if (activeStatusIndex > 0) {
      setActiveStatusIndex((prev) => prev - 1);
      setProgress(0);
      setElapsedTime(0);
    }
  }, [activeStatusIndex, setActiveStatusIndex]);

  useEffect(() => {
    if (currentStatus?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {}); // Catch prevents errors on rapid clicking
      }
    }
  }, [isPaused, currentStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showViewers) return;

      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') handleStatusWindowChange(null);
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, handleStatusWindowChange]);

  const handleDelete = async () => {
    if (!isOwnStatus || !currentStatus) return;

    if (window.confirm('Delete this status?')) {
      try {
        await deleteStatus(currentStatus._id).unwrap();

        // If this was the only status, close the viewer
        if (statuses.length === 1) {
          handleStatusWindowChange(null);
        } else {
          // Move to next status or previous if this was the last
          if (activeStatusIndex >= statuses.length - 1) {
            setActiveStatusIndex((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error('Failed to delete status:', error);
        alert('Failed to delete status');
      }
    }
  };

  const handleTap = useCallback(
    (clientX: number) => {
      const rect = viewerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = clientX - rect.left;
      const tapZoneWidth = rect.width / 3;

      if (x < tapZoneWidth) {
        handlePrevious();
      } else if (x > tapZoneWidth * 2) {
        handleNext();
      }
    },
    [handlePrevious, handleNext],
  );

  if (!selectedStatusToView || !currentStatus) {
    return null;
  }

  const timestamp = new Date(currentStatus.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);
  const handleMouseLeave = () => setIsPaused(false);

  const handleTouchStart = () => {
    // Start a timer to detect if this is a "Long Press"
    longPressTimeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      setIsPaused(true); // Pause the progress and video
    }, 200); // 200ms threshold for long press
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Clear the timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    if (isLongPress) {
      // If it was a long press, just resume
      setIsLongPress(false);
      setIsPaused(false);
    } else {
      // If it was just a quick tap, handle navigation
      // We pass the touch coordinates to our existing handleTap logic
      const touch = e.changedTouches[0];
      handleTap(touch.clientX);
    }
  };

  return (
    <div className='fixed inset-0 bg-black z-50 lg:left-[30rem]'>
      {/* Main Container - WhatsApp Desktop Style */}
      <div className='h-full flex items-center justify-center p-8'>
        <div className='w-full max-w-3xl h-full max-h-[90vh] flex flex-col'>
          {/* Progress Bars */}
          <StatusIndicator
            length={statuses.length}
            progress={progress}
            activeStatusIndex={activeStatusIndex}
          />

          {/* Header */}
          <div className='px-4'>
            <StatusViewerHeader
              user={selectedStatusToView.user}
              timestamp={timestamp}
              isOwnStatus={isOwnStatus}
              viewCount={0}
              onClose={() => {
                setActiveStatusIndex(0);
                handleSelectedStatusToView(null);
              }}
              onDelete={handleDelete}
              onShowViewers={() => {
                setShowViewers(true);
                setIsPaused(true);
              }}
            />
          </div>

          {/* Status Content Container */}
          <div className='flex-1 relative overflow-hidden rounded-2xl shadow-2xl bg-gray-950'>
            {/* Blurred Background Image (Behind everything) */}
            {currentStatus.type === 'image' && currentStatus.mediaContent?.url && (
              <>
                {/* Full background image - blurred */}
                <div
                  className='absolute inset-0'
                  style={{
                    backgroundImage: `url(${currentStatus.mediaContent.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(60px)',
                    transform: 'scale(1.2)',
                    opacity: 0.3,
                  }}
                />
                {/* Dark overlay on top of blur */}
                <div className='absolute inset-0 bg-black/50' />
              </>
            )}

            {currentStatus.type === 'text' && currentStatus.textContent?.backgroundColor && (
              <div
                className='absolute inset-0 opacity-40'
                style={{ backgroundColor: currentStatus.textContent.backgroundColor }}
              />
            )}

            {currentStatus.type === 'video' && (
              <div className='absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' />
            )}

            {/* Content Area (On top of background) */}
            <div
              ref={viewerRef}
              className='relative z-10 w-full h-full flex items-center justify-center cursor-pointer'
              // Desktop Mouse Events
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              // Mobile Touch Events
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}>
              {/* Text Status */}
              {currentStatus.type === 'text' && currentStatus.textContent && (
                <div
                  className='w-full h-full flex items-center justify-center p-12'
                  style={{ backgroundColor: currentStatus.textContent.backgroundColor }}>
                  <p className='text-white text-3xl md:text-4xl lg:text-5xl text-center font-semibold leading-relaxed max-w-2xl break-words'>
                    {currentStatus.textContent.text}
                  </p>
                </div>
              )}

              {/* Image Status */}
              {currentStatus.type === 'image' && currentStatus.mediaContent?.url && (
                <img
                  src={currentStatus.mediaContent.url}
                  alt='Status'
                  className='max-w-full max-h-full object-contain drop-shadow-2xl'
                />
              )}

              {/* Video Status */}
              {currentStatus.type === 'video' && currentStatus.mediaContent?.url && (
                <video
                  ref={videoRef}
                  src={currentStatus.mediaContent.url}
                  autoPlay
                  muted={isMuted}
                  onLoadedMetadata={onVideoLoad}
                  className='max-w-full max-h-full object-contain drop-shadow-2xl'
                />
              )}

              {/* Caption Overlay */}
              {currentStatus.caption && (
                <div className='absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6'>
                  <p className='text-white text-center text-sm md:text-base font-medium'>
                    {currentStatus.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Arrows (Desktop) - Show on hover */}
            <div className='absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none px-4 z-30 opacity-0 hover:opacity-100 transition-opacity duration-300 group'>
              {activeStatusIndex > 0 && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className='pointer-events-auto w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg border border-white/20'>
                  <ChevronLeftIcon className='w-6 h-6' />
                </button>
              )}
              <div className='flex-1' />
              {activeStatusIndex < statuses.length - 1 && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className='pointer-events-auto w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg border border-white/20'>
                  <ChevronRightIcon className='w-6 h-6' />
                </button>
              )}
            </div>

            {/* Control Buttons - Bottom Right */}
            <div className='absolute bottom-4 right-4 flex items-center gap-2 z-30'>
              {/* Play/Pause */}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className='w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg border border-white/20'>
                {isPaused ? (
                  <PlayIcon className='w-5 h-5 ml-0.5' />
                ) : (
                  <PauseIcon className='w-5 h-5' />
                )}
              </button>

              {/* Mute/Unmute (for video) */}
              {currentStatus.type === 'video' && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className='w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg border border-white/20'>
                  {isMuted ? (
                    <SpeakerXMarkIcon className='w-5 h-5' />
                  ) : (
                    <SpeakerWaveIcon className='w-5 h-5' />
                  )}
                </button>
              )}
            </div>

            {/* Pause Indicator */}
            {isPaused && (
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40'>
                <div className='bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-2xl'>
                  <p className='text-white text-sm font-medium flex items-center gap-2'>
                    <PauseIcon className='w-4 h-4' />
                    Paused
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Counter */}
          <div className='text-center text-white/60 text-sm mt-3'>
            {activeStatusIndex + 1} / {statuses.length}
          </div>
        </div>
      </div>

      {/* Viewers Modal */}
      <AnimatePresence>
        {showViewers && (
          <ViewersModal
            viewers={currentStatus.viewedBy || []}
            onClose={() => {
              setShowViewers(false);
              setIsPaused(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

type MediaTypeButtonComponentProps = {
  setMediaContentType: (type: MediaContentType) => void;
  type: string;
  activeType: boolean;
};

const MediaTypeButtonComponent: React.FC<MediaTypeButtonComponentProps> = ({
  setMediaContentType,
  type,
  activeType,
}) => {
  const renderMediaIcon = (mediaType: 'text' | 'image' | 'video') => {
    const baseClass = 'size-6 dark:text-indigo-500';

    const icons = {
      text: <DocumentTextIcon className={baseClass} title='Text content' />,
      image: <PhotoIcon className={baseClass} title='Image content' />,
      video: <VideoCameraIcon className={baseClass} title='Image content' />,
    };

    return icons[mediaType] || icons.text;
  };
  return (
    <motion.div
      role='button'
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        setMediaContentType(type as MediaContentType);
      }}
      className={classNames(
        activeType && 'bg-gray-600/30',
        'rounded-xl overflow-hidden border dark:border-gray-600/30 aspect-square w-full h-48 transition-colors dark:hover:bg-gray-600/30',
      )}>
      <div className='w-full h-full flex items-center p-1 gap-y-1.5 justify-center flex-col text-center'>
        {renderMediaIcon(type as MediaContentType)}
        <span className='font-nunito dark:text-white text-sm font-medium capitalize text-center'>
          {type}
        </span>
      </div>
    </motion.div>
  );
};
