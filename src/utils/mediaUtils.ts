/**
 * Media Utilities for handling video/image processing.
 */

/**
 * Captures a thumbnail from a video file or URL.
 * @param videoSource - File object or URL string of the video.
 * @param seekTime - Time in seconds to capture (default 1s).
 * @returns Promise resolving to a dataURL string of the thumbnail.
 */
export const captureVideoThumbnail = (
  videoSource: File | string,
  seekTime: number = 1,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = typeof videoSource === 'string' ? videoSource : URL.createObjectURL(videoSource);

    video.src = url;
    video.crossOrigin = 'anonymous';
    video.currentTime = seekTime;
    video.preload = 'auto';

    video.onloadeddata = () => {
      // Seek to the desired time
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        if (typeof videoSource !== 'string') {
          URL.revokeObjectURL(url);
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = (err) => {
      reject(err);
    };
  });
};
