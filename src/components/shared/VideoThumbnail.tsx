import React, { useEffect, useState } from 'react';
import { captureVideoThumbnail } from '../../utils/mediaUtils';
import { PlayIcon } from '@heroicons/react/24/outline';

interface VideoThumbnailProps {
  url: string;
  className?: string;
  showPlayIcon?: boolean;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  url,
  className = '',
  showPlayIcon = true,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    captureVideoThumbnail(url)
      .then((dataUrl) => {
        if (isMounted) setThumbnail(dataUrl);
      })
      .catch((err) => {
        console.error('Failed to generate video thumbnail:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className={`relative ${className}`}>
      {thumbnail ? (
        <img src={thumbnail} alt='Video thumbnail' className='w-full h-full object-cover' />
      ) : (
        <div className='w-full h-full bg-zinc-800 animate-pulse' />
      )}
      {showPlayIcon && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
          <PlayIcon className='h-6 w-6 text-white' />
        </div>
      )}
    </div>
  );
};
