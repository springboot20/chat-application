import { UserCircleIcon } from '@heroicons/react/24/outline';

export const UserAvatar = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className='size-12 flex items-center justify-center'>
      {imageUrl ? (
        <span className='h-full w-full rounded-full overflow-hidden'>
          <img src={imageUrl} alt='user avatar' className='w-full h-full object-cover' />
        </span>
      ) : (
        <div className='h-full w-full flex items-center justify-center'>
          <UserCircleIcon className='dark:fill-white/40 size-8 fill-gray-400 stroke-1' />
        </div>
      )}
    </div>
  );
};
