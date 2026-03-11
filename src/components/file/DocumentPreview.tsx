import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  MagnifyingGlassPlusIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { classNames, formatFileSize, getExtColor, DownloadTracker } from '../../utils';
import { Attachment, getAttachmentSrc } from '../../types/chat'; // ← added getAttachmentSrc
import { VoiceMessagePlayer } from '../voice/VoiceMessagePlayer';
import { getAudioBlobDuration } from '../../utils/audio';
import { LinearProgress, ProgressRing } from '../Loader';

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
  uploadProgress?: number;
  onCancelUpload?: (index: number) => void;
  thumbnailUrl?: string;
}

type TransferState = 'idle' | 'uploading' | 'downloading' | 'done' | 'error';

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
    uploadProgress,
    onCancelUpload,
    thumbnailUrl,
  }) => {
    const [fileImageUrl, setFileImageUrl] = useState<string>('');
    const [fileAudioUrl, setFileAudioUrl] = useState<string>('');
    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [transferState, setTransferState] = useState<TransferState>('idle');
    const abortRef = useRef<AbortController | null>(null);

    // ── Resolve the single renderable src for any attachment ──────────────────
    // local/queued → base64 data URL (localPath), server → url
    const attachmentSrc = attachment ? getAttachmentSrc(attachment) : '';
    const isLocalAttachment = Boolean(attachment?.isLocal);

    // ── Derived type booleans — fileType always wins, URL fallback for server ─
    const isImageFromAttachment =
      attachment?.fileType === 'image' ||
      (!isLocalAttachment && !!attachmentSrc?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i));
    const isPdfFromAttachment =
      attachment?.fileType === 'document' ||
      (!isLocalAttachment && !!attachmentSrc?.match(/\.pdf$/i));
    const isAudioFromAttachment =
      attachment?.fileType === 'voice' ||
      (!isLocalAttachment && !!attachmentSrc?.match(/\.(webm)$/i));
    const isDocFromAttachment =
      attachment?.fileType === 'document' ||
      (!isLocalAttachment && !!attachmentSrc?.match(/\.docx$/i));

    const isImageFromFile = file?.type?.startsWith('image/');
    const isAudioFromFile = file?.type?.startsWith('audio/');
    const isVideoFromFile = file?.type?.startsWith('video/');

    const isVideoFromAttachment =
      attachment?.fileType === 'video' ||
      (!isLocalAttachment && !!attachmentSrc?.match(/\.(mp4|mov|avi|mkv|webm)$/i));

    const isAudio = isAudioFromAttachment || isAudioFromFile;
    const isDocument = isDocFromAttachment || isPdfFromAttachment;
    const isVideo = isVideoFromAttachment || isVideoFromFile;

    const isQueued = status === 'queued';
    const isUploading =
      isQueued || (uploadProgress !== undefined && uploadProgress < 100 && uploadProgress > 0);
    const effectiveUploadProgress = uploadProgress ?? (isQueued ? 0 : 100);

    const fileExtension =
      attachment?.fileName?.split('.').pop()?.toUpperCase() ||
      (!isLocalAttachment && attachmentSrc?.split('.').pop()?.toUpperCase()) ||
      file?.name?.split('.').pop()?.toUpperCase() ||
      '';
    const fileName =
      attachment?.fileName ||
      (!isLocalAttachment ? attachmentSrc?.split('/').pop() : undefined) ||
      file?.name ||
      'Unknown File';
    const fileSize = attachment?.fileSize || file?.size;
    const extColor = getExtColor(fileExtension);

    // ── Unified image src ─────────────────────────────────────────────────────
    // Priority: attachment base64/url → thumbnail → File object URL (input staging only)
    const imageSrc = attachmentSrc || fileImageUrl || thumbnailUrl;

    // ── Unified audio src + duration ──────────────────────────────────────────
    // Priority: attachment base64/url → File object URL
    const audioSrc = attachmentSrc || fileAudioUrl;
    const resolvedAudioDuration = attachment?.duration || audioDuration;

    // ── Object URLs — only needed when a raw File is passed with no attachment ─
    useEffect(() => {
      if (file && isAudioFromFile && !attachment) {
        getAudioBlobDuration(file)
          .then(setAudioDuration)
          .catch(() => setAudioDuration(0));
      }
    }, [file, isAudioFromFile, attachment]);

    useEffect(() => {
      if (file && isImageFromFile && !attachment) {
        const url = URL.createObjectURL(file);
        setFileImageUrl(url);
        return () => URL.revokeObjectURL(url);
      }
      if (file && isAudioFromFile && !attachment) {
        const url = URL.createObjectURL(file);
        setFileAudioUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }, [file, isAudioFromFile, isImageFromFile, attachment]);

    // ── Download (unchanged except uses attachmentSrc) ────────────────────────
    const handleDownload = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        // CHANGE 4: local attachments can't be downloaded — not on server yet
        if (!attachmentSrc || isLocalAttachment) return;

        if (DownloadTracker.isDownloaded(attachmentSrc)) {
          window.open(attachmentSrc, '_blank');
          return;
        }

        if (transferState === 'downloading') {
          abortRef.current?.abort();
          setTransferState('idle');
          setDownloadProgress(0);
          return;
        }

        abortRef.current = new AbortController();
        setTransferState('downloading');
        setDownloadProgress(0);

        try {
          const response = await fetch(attachmentSrc, { signal: abortRef.current.signal });
          if (!response.ok) throw new Error('Download failed');

          const contentLength = response.headers.get('Content-Length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader');

          const chunks: Uint8Array[] = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (total > 0) {
              setDownloadProgress(Math.round((received / total) * 100));
            } else {
              setDownloadProgress((p) => Math.min(90, p + 5));
            }
          }

          setDownloadProgress(100);
          const blob = new Blob(chunks as any);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
          DownloadTracker.markAsDownloaded(attachmentSrc);
          setTransferState('done');
          setTimeout(() => {
            setTransferState('idle');
            setDownloadProgress(0);
          }, 1500);
        } catch (err: unknown) {
          if ((err as Error).name === 'AbortError') {
            setTransferState('idle');
          } else {
            setTransferState('error');
            setTimeout(() => setTransferState('idle'), 2000);
          }
          setDownloadProgress(0);
        }
      },
      [attachmentSrc, fileName, isLocalAttachment, transferState],
    );

    const isDownloading = transferState === 'downloading';

    const SpinnerSVG = ({ className }: { className?: string }) => (
      <svg
        className={classNames('animate-spin', className || 'h-5 w-5')}
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'>
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    );

    const renderContent = () => {
      // ── Voice ─────────────────────────────────────────────────────────────
      // Covers: server URL, base64 data URL (offline queued), raw File object URL
      if ((isAudioFromAttachment || isAudioFromFile) && audioSrc) {
        return (
          <VoiceMessagePlayer
            audioUrl={audioSrc}
            duration={resolvedAudioDuration}
            isOwnMessage={Boolean(isOwnedMessage)}
          />
        );
      }

      // ── Image / Video (Thumbnail) ──────────────────────────────────────────
      // Covers: server URL, base64 data URL (offline queued), raw File object URL
      // imageSrc = attachmentSrc (base64 or https) || fileImageUrl (object URL)
      if ((isImageFromAttachment || isImageFromFile || isVideo) && imageSrc) {
        return (
          <div className='relative w-full h-full'>
            <img
              className={classNames('h-full w-full object-cover', isModal ? 'object-contain' : '')}
              src={imageSrc}
              alt={`Attachment ${fileName}`}
              loading='lazy'
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {isVideo && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                <div className='p-1.5 rounded-full bg-black/40 text-white'>
                  <svg
                    className='h-6 w-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'>
                    <path d='M8 5v14l11-7z' />
                  </svg>
                </div>
              </div>
            )}
            {isUploading && (
              <div
                className={classNames(
                  'absolute z-50 inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 rounded-lg',
                  onClick ? 'cursor-pointer' : '',
                )}
                onClick={onClick}>
                <ProgressRing
                  progress={effectiveUploadProgress}
                  size={48}
                  color='#25d366'
                  bgColor='rgba(255,255,255,0.3)'>
                  {onCancelUpload ? (
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelUpload(index);
                      }}
                      className='text-white hover:text-red-300 transition-colors'
                      aria-label='Cancel upload'>
                      <XMarkIcon className='h-4 w-4' />
                    </button>
                  ) : (
                    <SpinnerSVG className='h-4 w-4 text-white' />
                  )}
                </ProgressRing>
                <span className='text-white text-[11px] font-medium'>
                  {`Uploading…${effectiveUploadProgress}%`}
                </span>
              </div>
            )}
          </div>
        );
      }

      // ── Document / Generic ─────────────────────────────────────────────────
      if (
        isDocument ||
        isPdfFromAttachment ||
        (!isImageFromAttachment && !isAudioFromAttachment && !isImageFromFile && !isAudioFromFile)
      ) {
        if (variant === 'square') {
          return (
            <div className='h-full w-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-2 relative'>
              <div
                className='h-10 w-10 rounded flex items-center justify-center mb-1'
                style={{ backgroundColor: extColor }}>
                <DocumentIcon className='h-6 w-6 text-white' />
              </div>
              <span className='text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full px-1'>
                {fileName}
              </span>
              <span className='text-[8px] text-gray-500 uppercase mt-0.5'>{fileExtension}</span>
              {isUploading && (
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center rounded'>
                  <ProgressRing progress={effectiveUploadProgress} size={36} color='#25d366'>
                    <SpinnerSVG className='h-3 w-3 text-white' />
                  </ProgressRing>
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            className={classNames(
              'flex items-center gap-3 p-2.5 rounded-lg w-full min-w-[240px]',
              isOwnedMessage ? 'bg-[#d9fdd3] dark:bg-[#005c4b]' : 'bg-white dark:bg-[#202c33]',
              'border dark:border-white/5 border-black/5 shadow-sm',
            )}>
            <div className='relative shrink-0'>
              {isUploading ? (
                <ProgressRing
                  progress={effectiveUploadProgress}
                  size={44}
                  color='#25d366'
                  bgColor={isOwnedMessage ? 'rgba(0,92,75,0.4)' : 'rgba(255,255,255,0.15)'}>
                  <div
                    className='h-8 w-8 rounded-full flex items-center justify-center'
                    style={{ backgroundColor: extColor }}>
                    {onCancelUpload ? (
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelUpload(index);
                        }}
                        className='text-white hover:text-red-200'
                        aria-label='Cancel upload'>
                        <XMarkIcon className='h-3.5 w-3.5' />
                      </button>
                    ) : (
                      <DocumentIcon className='h-4 w-4 text-white' />
                    )}
                  </div>
                </ProgressRing>
              ) : isDownloading ? (
                <ProgressRing
                  progress={downloadProgress}
                  size={44}
                  color='#25d366'
                  bgColor='rgba(255,255,255,0.15)'>
                  <button
                    type='button'
                    onClick={handleDownload}
                    className='text-white hover:text-red-200 transition-colors'
                    aria-label='Cancel download'>
                    <XMarkIcon className='h-3.5 w-3.5' />
                  </button>
                </ProgressRing>
              ) : (
                <div
                  className='h-11 w-11 rounded-lg flex items-center justify-center'
                  style={{ backgroundColor: extColor }}>
                  <DocumentIcon className='h-7 w-7 text-white' />
                </div>
              )}
            </div>

            <div className='flex-1 min-w-0 pr-1'>
              <div className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight'>
                {fileName}
              </div>
              <div className='flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase'>
                <span>{fileSize ? formatFileSize(fileSize) : 'Unknown size'}</span>
                <span>•</span>
                <span>{fileExtension || 'FILE'}</span>
                {isUploading && effectiveUploadProgress > 0 && (
                  <>
                    <span>•</span>
                    <span className='text-[#25d366] font-semibold lowercase'>
                      {effectiveUploadProgress}%
                    </span>
                  </>
                )}
                {isDownloading && (
                  <>
                    <span>•</span>
                    <span className='text-[#25d366] font-semibold lowercase'>
                      {downloadProgress}%
                    </span>
                  </>
                )}
                {transferState === 'done' && (
                  <>
                    <span>•</span>
                    <span className='text-[#25d366] font-semibold lowercase'>saved</span>
                  </>
                )}
                {transferState === 'error' && (
                  <>
                    <span>•</span>
                    <span className='text-red-500 font-semibold lowercase'>failed</span>
                  </>
                )}
              </div>
              {(isUploading || isDownloading) && (
                <LinearProgress
                  progress={isUploading ? effectiveUploadProgress : downloadProgress}
                />
              )}
            </div>

            {/* Download button hidden for local attachments — not on server yet */}
            {!isUploading && !isLocalAttachment && attachmentSrc && (
              <button
                type='button'
                onClick={handleDownload}
                disabled={transferState === 'error'}
                className={classNames(
                  'h-9 w-9 flex items-center justify-center rounded-full transition-colors shrink-0',
                  isDownloading
                    ? 'hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'hover:bg-black/5 dark:hover:bg-white/5',
                  'disabled:opacity-50',
                )}
                aria-label={
                  isDownloading
                    ? 'Cancel download'
                    : transferState === 'done'
                      ? 'Downloaded'
                      : `Download ${fileName}`
                }>
                {isDownloading ? (
                  <div className='relative'>
                    <SpinnerSVG className='h-5 w-5 text-[#25d366]' />
                    <XMarkIcon className='h-2.5 w-2.5 text-[#25d366] absolute inset-0 m-auto' />
                  </div>
                ) : transferState === 'done' ? (
                  <svg
                    viewBox='0 0 24 24'
                    className='h-5 w-5 text-[#25d366]'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2.5}>
                    <path d='M20 6L9 17l-5-5' />
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
        {isModal && !isLocalAttachment && attachmentSrc && (
          <button
            type='button'
            onClick={handleDownload}
            disabled={transferState === 'error'}
            className='absolute top-2 left-2 z-40 p-1.5 bg-black/40 rounded-full hover:bg-black/60 transition-colors disabled:opacity-50'
            aria-label={isDownloading ? 'Downloading…' : `Download ${fileName}`}>
            {isDownloading ? (
              <SpinnerSVG className='h-5 w-5 text-white' />
            ) : (
              <ArrowDownTrayIcon className='h-5 w-5 text-white' />
            )}
          </button>
        )}

        {showOverlay && !(isAudio || isDocument) && (
          <div className='absolute z-10 inset-0 flex justify-center items-center w-full gap-2 h-full bg-black/60 group-hover:opacity-100 opacity-0 transition-opacity ease-in-out duration-150'>
            <button
              type='button'
              onClick={onClick}
              className='p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors'
              aria-label={`View ${fileName}`}>
              <MagnifyingGlassPlusIcon className='h-6 w-6 text-white' />
            </button>
            {!isLocalAttachment && attachmentSrc && (
              <button
                type='button'
                onClick={handleDownload}
                disabled={isDownloading}
                className='p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50'
                aria-label={isDownloading ? 'Downloading…' : `Download ${fileName}`}>
                {isDownloading ? (
                  <SpinnerSVG className='h-6 w-6 text-white' />
                ) : (
                  <ArrowDownTrayIcon className='h-6 w-6 text-white' />
                )}
              </button>
            )}
          </div>
        )}

        {onRemove && (
          <button
            type='button'
            onClick={() => onRemove(index)}
            className='absolute top-1 right-1 z-40 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100'
            aria-label='Remove file'>
            <XCircleIcon className='h-6 w-6 text-white' />
          </button>
        )}

        {renderContent()}
      </div>
    );
  },
);

DocumentPreview.displayName = 'DocumentPreview';
