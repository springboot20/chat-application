import React, { useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  MagnifyingGlassPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { classNames, formatFileSize } from '../../utils';
import { Attachment } from '../../types/chat';
import { VoiceMessagePlayer } from '../voice/VoiceMessagePlayer';
import { getAudioBlobDuration } from '../../utils/audio';

interface DocumentPreviewProps {
  onRemove?: (index: number) => void;
  index: number;
  attachment?: Attachment;
  onClick?: () => void;
  isModal?: boolean;
  showOverlay?: boolean;
  isOwnedMessage?: boolean;
  file?: File;
  status?: 'sent' | 'delivered' | 'seen' | 'queued';
  variant?: 'square' | 'wide';
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = React.memo(
  ({
    attachment,
    onRemove,
    index,
    onClick,
    isModal,
    file,
    isOwnedMessage,
    showOverlay,
    status,
    variant = 'wide',
  }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [audioURL, setAudioURL] = useState<string>('');
    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const isImageFromAttachment =
      attachment?.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || attachment?.fileType === 'image';
    const isPdfFromAttachment = attachment?.url?.match(/\.pdf$/i);
    const isAudioFromAttachment =
      attachment?.fileType === 'voice' || attachment?.url?.match(/\.(webm)$/i);
    const isDocFromAttachment =
      attachment?.url?.match(/\.docx$/i) || attachment?.fileType === 'document';

    const isImageFromFile = file?.type?.startsWith('image/');
    const isAudioFromFile = file?.type?.startsWith('audio/');

    const isAudio = isAudioFromAttachment || isAudioFromFile;
    const isDocument = isDocFromAttachment || isPdfFromAttachment;

    useEffect(() => {
      if (file && isAudioFromFile) {
        getAudioBlobDuration(file)
          .then((duration) => {
            setAudioDuration(duration);
          })
          .catch((err) => {
            console.error('Failed to get audio duration', err);
            setAudioDuration(0);
          });
      }
    }, [file, isAudioFromFile]);

    useEffect(() => {
      if (file && isImageFromFile) {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url);
      } else if (file && isAudioFromFile) {
        const url = URL.createObjectURL(file);
        setAudioURL(url);
        return () => URL.revokeObjectURL(url);
      }
    }, [file, isAudioFromFile, isImageFromFile]);

    const fileExtension =
      attachment?.url?.split('.').pop()?.toUpperCase() ||
      file?.name?.split('.').pop()?.toUpperCase() ||
      '';
    const fileName =
      attachment?.fileName || attachment?.url?.split('/').pop() || file?.name || 'Unknown File';
    const fileSize = attachment?.fileSize || file?.size;
    const isQueued = status === 'queued';

    const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!attachment?.url || isDownloading) return;

      setIsDownloading(true);
      try {
        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (error) {
        console.error('Download error:', error);
      } finally {
        setIsDownloading(false);
      }
    };

    const renderContent = () => {
      if (isAudioFromAttachment && attachment?.url) {
        return (
          <VoiceMessagePlayer
            audioUrl={attachment.url}
            duration={attachment.duration || 0}
            isOwnMessage={Boolean(isOwnedMessage)}
          />
        );
      }

      if (isAudioFromFile && audioURL && file) {
        return (
          audioDuration > 0 && (
            <VoiceMessagePlayer
              audioUrl={audioURL}
              duration={audioDuration}
              isOwnMessage={Boolean(isOwnedMessage)}
            />
          )
        );
      }

      if (isImageFromAttachment && attachment?.url) {
        return (
          <img
            className={classNames('h-full w-full object-cover', isModal ? 'object-contain' : '')}
            src={attachment.url}
            alt={`Attachment ${fileName}`}
            loading='lazy'
            onError={(e) => {
              console.error('Image failed to load:', attachment.url);
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      }

      if (isImageFromFile && file) {
        return (
          <img
            className={classNames('h-full w-full object-cover', isModal ? 'object-contain' : '')}
            src={imageUrl}
            alt={`Attachment ${fileName}`}
            loading='lazy'
            onError={(e) => {
              console.error('File image failed to load:', file.name);
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      }

      if (
        isDocument ||
        isPdfFromAttachment ||
        (!isImageFromAttachment && !isAudioFromAttachment && !isImageFromFile && !isAudioFromFile)
      ) {
        const getIconBackground = () => {
          if (fileExtension === 'PDF') return 'bg-red-500';
          if (['DOC', 'DOCX'].includes(fileExtension)) return 'bg-blue-500';
          if (['XLS', 'XLSX'].includes(fileExtension)) return 'bg-green-600';
          if (['PPT', 'PPTX'].includes(fileExtension)) return 'bg-orange-500';
          return 'bg-blue-400';
        };

        if (variant === 'square') {
          return (
            <div className='h-full w-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-2 relative'>
              <div
                className={classNames(
                  'h-10 w-10 rounded flex items-center justify-center mb-1',
                  getIconBackground(),
                )}>
                <DocumentIcon className='h-6 w-6 text-white' />
              </div>
              <span className='text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full px-1'>
                {fileName}
              </span>
              <span className='text-[8px] text-gray-500 uppercase mt-0.5'>{fileExtension}</span>
            </div>
          );
        }

        return (
          <div
            className={classNames(
              'flex items-center gap-3 p-2 rounded-lg w-full min-w-[240px]',
              isOwnedMessage ? 'bg-[#d9fdd3] dark:bg-[#005c4b]' : 'bg-white dark:bg-[#202c33]',
              'border dark:border-white/5 border-black/5 shadow-sm',
            )}>
            <div
              className={classNames(
                'h-11 w-11 rounded-lg flex items-center justify-center shrink-0 relative',
                getIconBackground(),
              )}>
              {isQueued ? (
                <div className='absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg'>
                  <svg
                    className='animate-spin h-6 w-6 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                </div>
              ) : (
                <DocumentIcon className='h-7 w-7 text-white' />
              )}
            </div>

            <div className='flex-1 min-w-0 pr-2'>
              <div className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                {fileName}
              </div>
              <div className='flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase'>
                <span>{fileSize ? formatFileSize(fileSize) : 'Unavailable'}</span>
                <span>•</span>
                <span>{fileExtension || 'FILE'}</span>
              </div>
            </div>

            {!isQueued && attachment?.url && (
              <button
                type='button'
                onClick={handleDownload}
                disabled={isDownloading}
                className='h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 disabled:opacity-50'
                aria-label={isDownloading ? 'Downloading...' : `Download ${fileName}`}>
                {isDownloading ? (
                  <svg
                    className='animate-spin h-5 w-5 text-gray-500 dark:text-gray-400'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                ) : (
                  <ArrowDownTrayIcon className='h-5 w-5 text-gray-500 dark:text-gray-400' />
                )}
              </button>
            )}
          </div>
        );
      }
    };

    return (
      <div
        className={classNames(
          'relative overflow-hidden group w-full h-full',
          isAudio ? 'h-auto' : '',
          !isModal && !isAudio ? 'cursor-pointer' : '',
        )}>
        {isModal && attachment?.url && (
          <button
            type='button'
            onClick={handleDownload}
            disabled={isDownloading}
            className='absolute top-2 left-2 z-40 p-1.5 bg-black/40 rounded-full hover:bg-black/60 transition-colors disabled:opacity-50'
            aria-label={isDownloading ? 'Downloading...' : `Download ${fileName}`}>
            {isDownloading ? (
              <svg
                className='animate-spin h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
            ) : (
              <ArrowDownTrayIcon className='h-5 w-5 text-white' />
            )}
          </button>
        )}

        {showOverlay && !(isAudio || isDocument) && (
          <div className='absolute inset-0 flex justify-center items-center w-full gap-2 h-full bg-black/60 group-hover:opacity-100 opacity-0 transition-opacity ease-in-out duration-150'>
            <button
              type='button'
              onClick={onClick}
              className='p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors'
              aria-label={`View ${fileName}`}>
              <MagnifyingGlassPlusIcon className='h-6 w-6 text-white' />
            </button>
            {attachment?.url && (
              <button
                type='button'
                onClick={handleDownload}
                disabled={isDownloading}
                className='p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50'
                aria-label={isDownloading ? 'Downloading...' : `Download ${fileName}`}>
                {isDownloading ? (
                  <svg
                    className='animate-spin h-6 w-6 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                ) : (
                  <ArrowDownTrayIcon className='h-6 w-6 text-white' />
                )}
              </button>
            )}
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            type='button'
            onClick={() => onRemove(index)}
            className='absolute top-1 right-1 z-40 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100'
            aria-label='Remove file'>
            <XCircleIcon className='h-6 w-6 text-white' />
          </button>
        )}

        {/* Main content */}
        {renderContent()}
      </div>
    );
  },
);
