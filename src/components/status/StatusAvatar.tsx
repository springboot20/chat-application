import { UserCircleIcon } from '@heroicons/react/24/outline';

export const UserAvatar = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className='h-full w-full flex items-center justify-center'>
      {imageUrl ? (
        <span className='h-full w-full rounded-full overflow-hidden'>
          <img
            src={imageUrl}
            alt='user avatar'
            className='w-full h-full object-cover'
            loading='lazy'
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </span>
      ) : (
        <div className='h-full w-full flex items-center justify-center border dark:border-gray-600/30 rounded-full bg-gray-100 dark:bg-gray-700'>
          <UserCircleIcon className='dark:fill-white/40 size-8 fill-gray-400 stroke-1' />
        </div>
      )}
    </div>
  );
};
