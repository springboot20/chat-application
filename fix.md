/**
 * UploadProgressBar.tsx
 *
 * A slim animated progress bar that sits at the top of the chat input box.
 * Mimics WhatsApp's upload indicator — green fill, fades out at 100%.
 */

import React from 'react';

interface UploadProgressBarProps {
  progress: number; // 0–100
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ progress }) => {
  const isDone = progress >= 100;

  return (
    <div
      className='w-full h-0.5 bg-gray-200 dark:bg-white/10 overflow-hidden'
      style={{
        opacity: isDone ? 0 : 1,
        transition: 'opacity 0.4s ease 0.3s', // fade out 300ms after hitting 100%
      }}
      role='progressbar'
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}>
      <div
        className='h-full bg-[#25d366]'
        style={{
          width: `${progress}%`,
          transition: 'width 0.2s ease',
        }}
      />
    </div>
  );
};

/**
 * useSendMessage.ts
 *
 * Drop-in replacement for useSendMessageMutation / useReplyToMessageMutation.
 * Uses axios so we get real onUploadProgress callbacks.
 * Keeps the exact same call signature you already use in MessageInput.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAppSelector } from '../redux/redux.hooks';
import { RootState } from '../app/store';

// Match your existing server response shape
interface SendResponse {
  data: any;
  statusCode: number;
  message: string;
  success: boolean;
}

interface SendPayload {
  chatId: string;
  data: { [key: string]: any };
  messageId?: string; // only for replies
}

function buildFormData(data: Record<string, any>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'attachments' && Array.isArray(value)) {
      value.forEach((item) => formData.append('attachments', item));
      return;
    }

    if (key === 'mentions' && Array.isArray(value)) {
      value.forEach((m) =>
        formData.append('mentions', typeof m === 'string' ? m : JSON.stringify(m)),
      );
      return;
    }

    if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

export function useSendMessage() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const send = useCallback(
    async ({ chatId, data, messageId }: SendPayload): Promise<SendResponse> => {
      setIsLoading(true);
      setUploadProgress(0);

      const url = messageId
        ? `/api/chat-app/messages/${chatId}/${messageId}/reply`
        : `/api/chat-app/messages/${chatId}`;

      const method = messageId ? 'patch' : 'post';

      try {
        const response = await axios({
          method,
          url,
          data: buildFormData(data),
          headers: {
            // Let axios set Content-Type with boundary automatically
            ...(user?.accessToken
              ? { Authorization: `Bearer ${user.accessToken}` }
              : {}),
          },
          withCredentials: true, // if you use cookies instead of Bearer
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total ?? 0;
            if (total > 0) {
              const pct = Math.round((progressEvent.loaded / total) * 100);
              setUploadProgress(pct);
            }
          },
        });

        setUploadProgress(100);
        return response.data;
      } finally {
        setIsLoading(false);
        // Reset progress after brief delay so UI can show 100% momentarily
        setTimeout(() => setUploadProgress(0), 800);
      }
    },
    [user?.accessToken],
  );

  return { send, uploadProgress, isLoading };
}


/**
 * FileUploadPreview.tsx
 *
 * Renders the list of staged/uploading files INSIDE the chat input bar,
 * mimicking WhatsApp's pre-send attachment tray.
 *
 * Features:
 * - Image thumbnails with upload progress ring overlay
 * - Document cards with inline linear progress + percentage
 * - Cancel button per file (works mid-upload via XHR abort)
 * - Error state with retry-style red indicator
 */

import React from 'react';
import {
  DocumentIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { PendingFile } from '../../hooks/useFileUpload';
import { classNames, formatFileSize } from '../../utils';

// ─── Sub-components ────────────────────────────────────────────────────────

const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}> = ({
  progress,
  size = 40,
  stroke = 3,
  color = '#25d366',
  trackColor = 'rgba(255,255,255,0.25)',
  children,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, progress)) / 100) * circ;

  return (
    <div className='relative flex items-center justify-center' style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className='absolute inset-0 -rotate-90'>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap='round'
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>
      <div className='relative z-10'>{children}</div>
    </div>
  );
};

function getExtColor(ext: string) {
  if (ext === 'PDF') return '#e53e3e';
  if (['DOC', 'DOCX'].includes(ext)) return '#3182ce';
  if (['XLS', 'XLSX'].includes(ext)) return '#38a169';
  if (['PPT', 'PPTX'].includes(ext)) return '#dd6b20';
  if (['ZIP', 'RAR', '7Z'].includes(ext)) return '#805ad5';
  if (['MP4', 'MOV', 'AVI', 'MKV'].includes(ext)) return '#d53f8c';
  return '#4299e1';
}

// ─── Image tile ────────────────────────────────────────────────────────────


// ─── Document row ──────────────────────────────────────────────────────────

const DocumentRow: React.FC<{
  pending: PendingFile;
  onCancel: (tempId: string) => void;
}> = ({ pending, onCancel }) => {
  const ext = pending.file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
  const color = getExtColor(ext);
  const isUploading = pending.status === 'uploading';
  const isDone = pending.status === 'done';
  const isError = pending.status === 'error';

  return (
    <div className='flex items-center gap-2.5 bg-white dark:bg-[#2a3942] rounded-xl px-3 py-2 shadow-sm border border-black/5 dark:border-white/5 w-full'>
      {/* Icon / ring */}
      <div className='shrink-0'>
        {isUploading ? (
          <ProgressRing progress={pending.progress} size={40} stroke={3} trackColor='rgba(0,0,0,0.1)'>
            <div
              className='h-7 w-7 rounded-full flex items-center justify-center'
              style={{ backgroundColor: color }}>
              <button
                type='button'
                onClick={() => onCancel(pending.tempId)}
                className='text-white hover:text-red-200'
                aria-label='Cancel'>
                <XMarkIcon className='h-3 w-3' />
              </button>
            </div>
          </ProgressRing>
        ) : (
          <div
            className='h-10 w-10 rounded-lg flex items-center justify-center relative'
            style={{ backgroundColor: color }}>
            <DocumentIcon className='h-5 w-5 text-white' />
            {isDone && (
              <CheckCircleIcon className='h-3.5 w-3.5 text-white absolute -bottom-1 -right-1 drop-shadow' />
            )}
            {isError && (
              <ExclamationCircleIcon className='h-3.5 w-3.5 text-red-200 absolute -bottom-1 -right-1' />
            )}
          </div>
        )}
      </div>

      {/* File info */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-gray-800 dark:text-gray-100 truncate leading-tight'>
          {pending.file.name}
        </p>
        <div className='flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 uppercase mt-0.5'>
          <span>{formatFileSize(pending.file.size)}</span>
          <span>•</span>
          <span>{ext}</span>
          {isUploading && (
            <>
              <span>•</span>
              <span className='text-[#25d366] font-semibold lowercase'>{pending.progress}%</span>
            </>
          )}
          {isError && (
            <>
              <span>•</span>
              <span className='text-red-500 lowercase'>failed</span>
            </>
          )}
          {isDone && (
            <>
              <span>•</span>
              <span className='text-[#25d366] lowercase'>uploaded</span>
            </>
          )}
        </div>
        {/* Linear progress */}
        {isUploading && (
          <div className='w-full h-0.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden mt-1.5'>
            <div
              className='h-full rounded-full bg-[#25d366] transition-all duration-150'
              style={{ width: `${pending.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Remove (idle / done / error) */}
      {!isUploading && (
        <button
          type='button'
          onClick={() => onCancel(pending.tempId)}
          className='h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0'
          aria-label='Remove file'>
          <XMarkIcon className='h-4 w-4 text-gray-400 dark:text-gray-500' />
        </button>
      )}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

interface FileUploadPreviewProps {
  pendingFiles: PendingFile[];
  onCancel: (tempId: string) => void;
  className?: string;
}

export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({
  pendingFiles,
  onCancel,
  className,
}) => {
  if (!pendingFiles.length) return null;

  const images = pendingFiles.filter(
    (f) => f.file.type.startsWith('image/') || f.file.type.startsWith('video/'),
  );
  const docs = pendingFiles.filter(
    (f) => !f.file.type.startsWith('image/') && !f.file.type.startsWith('video/'),
  );

  return (
    <div
      className={classNames(
        'flex flex-col gap-2 px-3 py-2 border-t border-gray-100 dark:border-white/5',
        className,
      )}>
      {/* Image / video grid */}
      {images.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {images.map((f) => (
            <ImageTile key={f.tempId} pending={f} onCancel={onCancel} />
          ))}
        </div>
      )}

      {/* Document rows */}
      {docs.length > 0 && (
        <div className='flex flex-col gap-1.5'>
          {docs.map((f) => (
            <DocumentRow key={f.tempId} pending={f} onCancel={onCancel} />
          ))}
        </div>
      )}
    </div>
  );
};