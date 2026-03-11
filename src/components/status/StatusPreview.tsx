import React from 'react';
import { Status } from '../../features/status/status.api.slice';
import { VideoThumbnail } from '../shared/VideoThumbnail';

interface StatusPreviewProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusPreview: React.FC<StatusPreviewProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'size-10',
    md: 'size-12',
    lg: 'size-16',
  };

  const currentSize = sizeClasses[size];

  if (status.type === 'text') {
    return (
      <div
        className={`${currentSize} rounded-lg flex items-center justify-center p-1 overflow-hidden shadow-sm border border-black/5 dark:border-white/5`}
        style={{ backgroundColor: status.textContent?.backgroundColor || '#ccc' }}>
        <p className='text-[8px] text-white line-clamp-3 text-center leading-tight font-medium'>
          {status.textContent?.text}
        </p>
      </div>
    );
  }

  if (status.type === 'image') {
    return (
      <div
        className={`${currentSize} rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm`}>
        <img
          src={status.mediaContent?.url}
          alt='Status preview'
          className='w-full h-full object-cover'
        />
      </div>
    );
  }

  if (status.type === 'video') {
    return (
      <VideoThumbnail
        url={status.mediaContent?.url || ''}
        className={`${currentSize} rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm`}
        showPlayIcon={true}
      />
    );
  }

  return null;
};
