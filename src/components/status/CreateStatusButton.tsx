import { PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useStatusStories } from '../../hooks/useStatusStories';

export const CreateStatusButton = () => {
  const { handleStatusWindowChange, statusWindow } = useStatusStories();

  console.log(statusWindow);

  return (
    <motion.div
      role='button'
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        handleStatusWindowChange('create-status');
      }}
      className='rounded-xl overflow-hidden border dark:border-gray-600/30 aspect-square h-32 w-24'>
      <div className='w-full h-full flex items-center justify-between p-1 flex-col shrink-0'>
        <div className='rounded-full relative size-12 border dark:border-gray-600/30'>
          <div className='absolute -bottom-1 rounded-full size-6 flex items-center justify-center -right-2 shrink-0 dark:border dark:border-gray-600/30 bg-indigo-500'>
            <PlusIcon className='h-4 text-white' />
          </div>
        </div>
        <span className='font-nunito dark:text-white text-sm font-medium self-center'>
          Add Status
        </span>
      </div>
    </motion.div>
  );
};
