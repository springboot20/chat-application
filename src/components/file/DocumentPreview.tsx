import { pdfjs } from 'react-pdf';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  MagnifyingGlassPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { classNames } from '../../utils';
import { Attachment } from '../../types/chat';
import { VoiceMessagePlayer } from '../voice/VoiceMessagePlayer';
import { getAudioBlobDuration } from '../../utils/audio';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentPreviewProps {
  onRemove?: (index: number) => void;
  index: number;
  attachment?: Attachment;
  onClick?: () => void;
  isModal?: boolean;
  isOwnedMessage?: boolean;
  file?: File;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = React.memo(
  ({ attachment, onRemove, index, onClick, isModal = false, file, isOwnedMessage }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [audioURL, setAudioURL] = useState<string>('');
    const [pdfError, setPdfError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [audioDuration, setAudioDuration] = useState<number>(0);

    const isImageFromAttachment =
      attachment?.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || attachment?.fileType === 'image';
    const isPdfFromAttachment = attachment?.url?.match(/\.pdf$/i);
    const isAudioFromAttachment =
      attachment?.fileType === 'voice' || attachment?.url?.match(/\.(webm)$/i);
    const isDocFromAttachment =
      attachment?.url?.match(/\.docx$/i) || attachment?.fileType === 'document';

    const isImageFromFile = file?.type?.startsWith('image/');
    const isAudioFromFile = file?.type?.startsWith('audio/');

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const isAudio = isAudioFromAttachment || isAudioFromFile;
    const isDocument = isDocFromAttachment;
    const showOverlay = !isModal && !isAudio && !isDocument;

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

    useEffect(() => {
      if (isPdfFromAttachment && canvasRef.current && attachment?.url) {
        const renderPDF = async () => {
          setIsLoading(true);
          setPdfError('');

          try {
            const response = await axios.get(attachment?.url as string, {
              responseType: 'arraybuffer',
            });

            const pdf = await pdfjs.getDocument({ data: response.data }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: isModal ? 2.0 : 1.0 });

            const canvas = canvasRef.current!;
            const context = canvas?.getContext('2d');

            if (!context) return;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: canvas, viewport } as any).promise;
            page.cleanup();
          } catch (error: any) {
            console.error(`Failed to render PDF ${attachment?.url}:`, error);
            setPdfError(`Failed to load PDF: ${error.message}`);
          } finally {
            setIsLoading(false);
          }
        };
        renderPDF();
      }
    }, [attachment?.url, isPdfFromAttachment, isModal]);

    const fileExtension = attachment?.url?.split('.').pop()?.toUpperCase() || '';
    const fileName = attachment?.url?.split('/').pop() || file?.name || 'Unknown File';

    const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (attachment?.url) {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = fileName;
        link.click();
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

      if (isDocument) {
        return (
          <div className='h-full w-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-3'>
            <DocumentIcon className='h-10 w-10 text-blue-600 mb-2' />
            <span className='text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate max-w-[90px]'>
              {fileName}
            </span>
            <span className='text-[10px] text-gray-500 uppercase'>{fileExtension}</span>
          </div>
        );
      }

      if (isPdfFromAttachment) {
        if (isLoading) {
          return (
            <div className='h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
              <div className='text-sm text-gray-600 dark:text-gray-300'>Loading PDF...</div>
            </div>
          );
        }

        if (pdfError) {
          return (
            <div className='h-full w-full bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center p-2'>
              <DocumentIcon className='h-8 w-8 text-red-500 mb-2' />
              <span className='text-xs text-red-500 text-center'>{pdfError}</span>
            </div>
          );
        }

        return (
          <canvas
            ref={canvasRef}
            className='h-full w-full object-cover'
            title={`PDF Preview: ${fileName}`}
          />
        );
      }

      // Default file preview
      return (
        <div className='h-full w-full bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center p-2'>
          <DocumentIcon className='h-8 w-8 text-gray-600 dark:text-gray-300 mb-2' />
          <span className='text-xs text-gray-600 dark:text-gray-300 text-center truncate max-w-[100px]'>
            {fileName}
          </span>
          <span className='text-xs text-gray-500 dark:text-gray-400'>{fileExtension}</span>
        </div>
      );
    };

    return (
      <div
        className={classNames(
          'relative rounded-lg overflow-hidden group',
          isAudio
            ? 'w-full'
            : isDocument
              ? 'w-24 h-24'
              : isModal
                ? 'w-full h-auto max-w-xl'
                : attachment?.url?.split('.').includes('pdf')
                  ? 'h-24 w-24'
                  : 'aspect-square cursor-pointer',
        )}>
        {isModal && attachment?.url && (
          <button
            type='button'
            onClick={handleDownload}
            className='absolute top-2 left-2 z-10 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors'
            aria-label={`Download ${fileName}`}>
            <ArrowDownTrayIcon className='h-6 w-6 text-white' />
          </button>
        )}

        {showOverlay && (
          <div className='absolute inset-0 z-20 flex justify-center items-center w-full gap-2 h-full bg-black/60 group-hover:opacity-100 opacity-0 transition-opacity ease-in-out duration-150'>
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
                className='p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors'
                aria-label={`Download ${fileName}`}>
                <ArrowDownTrayIcon className='h-6 w-6 text-white' />
              </button>
            )}
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            type='button'
            onClick={() => onRemove(index)}
            className='absolute top-1 right-1 z-30 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100'
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
