import {
  MicrophoneIcon,
  DocumentIcon,
  PlayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

type AttachmentItemProps = {
  file: {
    _id?: string;
    url: string;
    fileType?: string;
    localPath?: string;
    fileName?: string;
  };
};

export const AttachmentItem = ({ file }: AttachmentItemProps) => {
  const getfileType = () => {
    if (!file.fileType) return 'document';
    if (file.fileType === 'image') return 'image';
    if (file.fileType === 'video') return 'video';
    if (file.fileType === 'audio' || file.fileType === 'voice') return 'audio';
    return 'document';
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || `download-${file._id || Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const fileType = getfileType();

  if (fileType === 'image') {
    return (
      <div className='aspect-square rounded-md overflow-hidden bg-gray-200 dark:bg-zinc-800 relative group'>
        <img
          src={file.url}
          alt='Shared image'
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
        />
        <button
          onClick={handleDownload}
          className='absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity'
          title='Download'>
          <ArrowDownTrayIcon className='h-4 w-4' />
        </button>
      </div>
    );
  }

  if (fileType === 'video') {
    return (
      <div className='aspect-square rounded-md overflow-hidden bg-gray-200 dark:bg-zinc-800 relative group'>
        <video src={file.url} className='w-full h-full object-cover' preload='metadata' />
        <div className='absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors'>
          <PlayIcon className='h-12 w-12 text-white opacity-80' />
        </div>
        <button
          onClick={handleDownload}
          className='absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10'
          title='Download'>
          <ArrowDownTrayIcon className='h-4 w-4' />
        </button>
      </div>
    );
  }

  if (fileType === 'audio') {
    return (
      <div className='aspect-square rounded-md overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative group flex items-center justify-center p-3'>
        <div className='text-center'>
          <MicrophoneIcon className='h-10 w-10 text-purple-600 dark:text-purple-400 mx-auto mb-2' />
          <p className='text-xs text-gray-700 dark:text-gray-300 font-medium'>Audio</p>
        </div>
        <button
          onClick={handleDownload}
          className='absolute top-2 right-2 p-1.5 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white opacity-0 group-hover:opacity-100 transition-opacity'
          title='Download'>
          <ArrowDownTrayIcon className='h-4 w-4' />
        </button>
      </div>
    );
  }

  // Document
  return (
    <div className='aspect-square rounded-md overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 relative group flex items-center justify-center p-3'>
      <div className='text-center'>
        <DocumentIcon className='h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-2' />
        <p className='text-xs text-gray-700 dark:text-gray-300 font-medium'>Document</p>
      </div>
      <button
        onClick={handleDownload}
        className='absolute top-2 right-2 p-1.5 rounded-full bg-blue-600/80 hover:bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity'
        title='Download'>
        <ArrowDownTrayIcon className='h-4 w-4' />
      </button>
    </div>
  );
};
