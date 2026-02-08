import {
  getTimeRemaining,
  StatusGroup,
  useGetStatusFeedQuery,
} from '../../../features/status/status.api.slice';
import { List, type RowComponentProps } from 'react-window';
import { motion } from 'framer-motion';
import { UserAvatar } from '../StatusAvatar';
import { useAuth } from '../../../context/AuthContext';
import { useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/solid';
import { timeAgo } from '../../../utils';

const hasUnviewedStatus = (statusGroup: StatusGroup, currentUserId: string) => {
  return statusGroup?.items?.some(
    (status) =>
      !status.viewedBy?.some((viewer) =>
        typeof viewer === 'string' ? viewer === currentUserId : viewer?._id === currentUserId,
      ),
  );
};

interface StatusListProps {
  onViewStatus?: (statusGroup: StatusGroup | null) => void;
}

interface StatusListItemData {
  items?: StatusGroup[];
  myStatus?: StatusGroup | null;
  currentUserId: string;
  onViewStatus?: (statusGroup: StatusGroup | null) => void;
}

export const StatusListComponent: React.FC<StatusListProps> = ({ onViewStatus }) => {
  const { user } = useAuth(); // Get current user
  const currentUserId = user?._id || '';

  const { data: feedData, isLoading: isFeedLoading } = useGetStatusFeedQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const feeds = useMemo(() => feedData?.data || [], [feedData?.data]);

  // Filter out own status from feeds (to avoid duplication)
  const otherUsersFeeds = useMemo(() => {
    return feeds.filter((feed) => feed._id !== currentUserId);
  }, [feeds, currentUserId]);

  const rowCount = otherUsersFeeds.length;

  const itemData: StatusListItemData = {
    items: otherUsersFeeds,
    currentUserId,
    onViewStatus,
  };

  if (isFeedLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600' />
      </div>
    );
  }

  if (otherUsersFeeds.length === 0) {
    return (
      <div className='text-center p-8 text-gray-500 dark:text-gray-400'>
        <p>No status updates from your contacts</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      <h3 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>Status Updates</h3>

      <List
        rowCount={rowCount}
        rowHeight={600} // Adjust based on your layout
        rowComponent={StatusListItemComponent}
        rowProps={{ data: itemData }}
      />
    </div>
  );
};

const StatusListItemComponent = ({
  index,
  style,
  data,
}: RowComponentProps<{ data: StatusListItemData }>) => {
  const { items, currentUserId, onViewStatus } = data;
  const feed = items?.[index];

  if (!feed) return null;

  return (
    <div style={style} className='!h-auto'>
      <OthersStatusRow
        statusGroup={feed}
        currentUserId={currentUserId}
        onViewStatus={onViewStatus}
      />
    </div>
  );
};

interface OthersStatusRowProps {
  statusGroup: StatusGroup;
  currentUserId: string;
  onViewStatus?: (statusGroup: StatusGroup | null) => void;
}

const OthersStatusRow = ({ statusGroup, currentUserId, onViewStatus }: OthersStatusRowProps) => {
  const feedPostedBy = statusGroup?.user;
  const hasUnviewed = hasUnviewedStatus(statusGroup, currentUserId);
  const latestStatus = statusGroup?.items?.[statusGroup?.items?.length - 1];

  const handleClick = () => {
    if (onViewStatus) {
      onViewStatus(statusGroup);
    }
  };

  return (
    <motion.div
      role='button'
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className='rounded-2xl overflow-hidden border dark:border-gray-600/30 w-full h-[72px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
      <div className='w-full h-full flex items-center gap-x-3'>
        {/* Avatar with gradient ring for unviewed */}
        <div className='relative'>
          <div
            className={`rounded-full relative size-14 ${
              hasUnviewed
                ? 'p-0.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                : 'border-2 border-gray-300 dark:border-gray-600'
            }`}>
            <div className='w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-900'>
              <UserAvatar imageUrl={feedPostedBy?.avatar?.url || ''} />
            </div>
          </div>

          {/* Unviewed indicator badge */}
          {hasUnviewed && (
            <div className='absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-gray-900' />
          )}
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h3
              className={`font-medium truncate ${
                hasUnviewed
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
              {feedPostedBy?.username || 'Unknown User'}
            </h3>
            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400'>
              {statusGroup?.items?.length}
            </span>
          </div>

          <div className='flex items-center gap-3 mt-0.5'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {timeAgo(statusGroup?.lastUpdated)}
            </p>
            {latestStatus?.expiresAt && (
              <div className='flex items-center gap-1 text-xs text-gray-400'>
                <ClockIcon width={12} height={12} />
                <span>{getTimeRemaining(latestStatus.expiresAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status preview (optional) */}
        {/* {latestStatus && (
          <StatusPreview status={latestStatus} />
        )} */}
      </div>
    </motion.div>
  );
};
