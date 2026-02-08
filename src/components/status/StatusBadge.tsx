import { useSelector } from 'react-redux';
import { useUnviewedStatusCount } from '../../features/status/status.api.slice';

export const StatusBadge = () => {
  const currentUserId = useSelector((state: any) => state.auth.user?._id);
  const { unviewedCount, isLoading } = useUnviewedStatusCount(currentUserId);

  if (isLoading || unviewedCount === 0) return null;

  return (
    <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
      {unviewedCount > 9 ? '9+' : unviewedCount}
    </div>
  );
};
