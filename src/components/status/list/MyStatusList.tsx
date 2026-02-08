import { CameraIcon, ClockIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CreateStatusButton } from '../CreateStatusButton';
import { useAuth } from '../../../context/AuthContext';
import {
  getTimeRemaining,
  StatusGroup,
  useGetUserStatusesQuery,
} from '../../../features/status/status.api.slice';
import { motion } from 'framer-motion';
import { UserAvatar } from '../StatusAvatar';
import { timeAgo } from '../../../utils';
import { Fragment } from 'react';
import { useStatusStories } from '../../../hooks/useStatusStories';

interface MyStatusRowProps {
  myStatus: StatusGroup | null;
  onViewStatus?: (statusGroup: StatusGroup | null) => void;
}

interface StatusListProps {
  onViewStatus?: (statusGroup: StatusGroup | null) => void;
  setShowMyStatusList: (value: boolean) => void;
  showMyStatusList: boolean;
}

export const MyStatusListComponent: React.FC<StatusListProps> = ({
  setShowMyStatusList,
  showMyStatusList,
  onViewStatus,
}) => {
  const { user } = useAuth(); // Get current user

  const { data: myStatusData, isLoading: isMyStatusLoading } = useGetUserStatusesQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const myStatus = myStatusData?.data || null;
  const hasStatus = myStatus && myStatus.items.length > 0;

  const handleClick = () => {
    if (hasStatus) {
      setShowMyStatusList(true);
    }
  };

  if (isMyStatusLoading) {
    return (
      <div className='rounded-2xl overflow-hidden border dark:border-gray-600/30 w-full p-2'>
        <div className='flex items-center gap-3'>
          <div className='rounded-full size-14 bg-gray-200 dark:bg-gray-800 animate-pulse' />
          <div className='flex-1'>
            <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-24 mb-2' />
            <div className='h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-32' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      {!showMyStatusList && (
        <Fragment>
          {hasStatus ? (
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>My Status</h3>

              <motion.div
                role='button'
                onClick={handleClick}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className='rounded-2xl overflow-hidden border dark:border-gray-600/30 w-full p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
                <div className='w-full h-full flex items-center gap-x-3'>
                  {/* Avatar */}
                  <div className='relative'>
                    <div className='rounded-full relative size-14 border-2 border-gray-300 dark:border-gray-600'>
                      <UserAvatar
                        imageUrl={myStatus.user?.avatar?.url || user?.avatar?.url || ''}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold text-gray-900 dark:text-gray-100'>My Status</h3>
                      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300'>
                        {myStatus.items.length}
                      </span>
                    </div>

                    <div className='flex items-center gap-3 mt-0.5'>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {timeAgo(myStatus.lastUpdated)}
                      </p>
                      <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500'>
                        <EyeIcon height={14} width={14} />
                      </div>
                    </div>
                  </div>

                  {/* Tap to view indicator */}
                  <div className='text-xs text-gray-400'>Tap to view</div>
                </div>
              </motion.div>
            </div>
          ) : (
            <CreateStatusButton />
          )}
        </Fragment>
      )}

      {showMyStatusList && (
        <MyStatusListModal
          myStatus={myStatus || ({} as StatusGroup)}
          onClose={() => {
            setShowMyStatusList(false);
            onViewStatus?.(null);
          }}
        />
      )}
    </Fragment>
  );
};

export const MyStatusRow = ({ myStatus, onViewStatus }: MyStatusRowProps) => {
  const hasStatus = myStatus && myStatus.items.length > 0;

  const handleClick = () => {
    if (hasStatus && onViewStatus) {
      onViewStatus(myStatus);
    }
  };

  return hasStatus ? (
    <motion.div
      role='button'
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className='rounded-2xl overflow-hidden border dark:border-gray-600/30 w-full h-full p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
      <div className='w-full h-full flex items-center gap-x-3'>
        {/* Avatar with status indicator */}
        <div className='relative'>
          <div className='rounded-full relative size-14 border-2 border-gray-300 dark:border-gray-600'>
            <UserAvatar imageUrl={myStatus.user?.avatar?.url || ''} />
          </div>
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-gray-900 dark:text-gray-100'>
              {hasStatus ? 'My Status' : 'Add Status'}
            </h3>
            {hasStatus && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300'>
                {myStatus.items.length}
              </span>
            )}
          </div>

          {hasStatus ? (
            <div className='flex items-center gap-3 mt-0.5'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {timeAgo(myStatus.lastUpdated)}
              </p>
              <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500'>
                <EyeIcon height={14} width={14} />
                {/* <span>
                  {myStatus.items.reduce((acc, item) => acc + (item.viewCount || 0), 0)} views
                </span> */}
              </div>
            </div>
          ) : (
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>Share your moment</p>
          )}
        </div>

        {/* Action indicator */}
        {!hasStatus && <CameraIcon className='text-gray-400' height={20} width={20} />}
      </div>
    </motion.div>
  ) : (
    <CreateStatusButton />
  );
};

interface MyStatusListModalProps {
  myStatus: StatusGroup;
  onClose: () => void;
}

export const MyStatusListModal: React.FC<MyStatusListModalProps> = ({ myStatus, onClose }) => {
  const { handleSelectedStatusToView } = useStatusStories();

  const handleStatusClick = (index: number) => {
    // Pass the status group AND the specific index clicked
    handleSelectedStatusToView(myStatus, index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className='h-full overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between p-4'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>My Status</h2>
        <button
          type='button'
          onClick={onClose}
          className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'>
          <XMarkIcon className='w-6 h-6' />
        </button>
      </div>

      {/* Status List */}
      <div className='overflow-y-auto max-h-[calc(80vh-80px)]'>
        <div className='my-2 space-y-3'>
          {myStatus.items.map((status, index) => (
            <motion.div
              key={status._id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleStatusClick(index)}
              className='rounded-3xl overflow-hidden border dark:border-gray-600/30 w-full h-[72px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-x-2'>
              {/* Preview */}
              <div className='shrink-0'>
                {status.type === 'text' && status.textContent ? (
                  <div
                    className='w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-medium'
                    style={{ backgroundColor: status.textContent.backgroundColor }}></div>
                ) : status.type === 'image' && status.mediaContent?.url ? (
                  <div className='w-12 h-12 rounded-lg overflow-hidden'>
                    <img
                      src={status.mediaContent.url}
                      alt='Status preview'
                      className='w-full h-full object-cover'
                    />
                  </div>
                ) : status.type === 'video' && status.mediaContent?.url ? (
                  <div className='w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-gray-500 dark:text-gray-400'
                      fill='currentColor'
                      viewBox='0 0 20 20'>
                      <path d='M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z' />
                    </svg>
                  </div>
                ) : null}
              </div>

              {/* Info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                    {status.type === 'text' && status.textContent
                      ? status.textContent.text.substring(0, 30) +
                        (status.textContent.text.length > 30 ? '...' : '')
                      : status.caption || `${status.type} status`}
                  </p>
                </div>
                <div className='flex items-center gap-3 mt-1'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {timeAgo(status.createdAt)}
                  </p>
                  <div className='flex items-center gap-1 text-xs text-gray-500'>
                    <EyeIcon className='w-3 h-3' />
                    {/* <span>{status.viewCount || 0}</span> */}
                  </div>
                  {status.expiresAt && (
                    <div className='flex items-center gap-1 text-xs text-gray-400'>
                      <ClockIcon className='w-3 h-3' />
                      <span>{getTimeRemaining(status.expiresAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          <CreateStatusButton />
        </div>
      </div>

      {/* Footer */}
      <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
        <p className='text-xs text-center text-gray-500 dark:text-gray-400'>
          Tap any status to view full screen
        </p>
      </div>
    </motion.div>
  );
};
