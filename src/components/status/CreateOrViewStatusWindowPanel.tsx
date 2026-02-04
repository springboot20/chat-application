import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useStatusStories } from '../../hooks/useStatusStories';
import { classNames } from '../../utils';
import { motion } from 'framer-motion';
import ImageMediaContent from './create/ImageMediaContent';
import VideoMediaContent from './create/VideoMediaContent';
import TextMediaContent from './create/TextMediaContent';
import { MediaContentType } from '../../context/StatusContext';
import { Fragment } from 'react';

export const CreateOrViewStatusWindowPanel = () => {
  const { statusWindow } = useStatusStories();

  return (
    <div className='h-screen w-full overflow-hidden lg:pl-[30rem]'>
      {statusWindow === 'view-status' && statusWindow !== null && <ViewStatusWindowPanelSlot />}
      {statusWindow === 'create-status' && statusWindow !== null && <CreateStatusWindowPanelSlot />}
    </div>
  );
};

export const CreateStatusWindowPanelSlot = () => {
  const { handleStatusWindowChange, mediaContentType, setMediaContentType, MEDIA_TYPES } =
    useStatusStories();

  return (
    <div className='h-full flex flex-col'>
      <header
        className={classNames(
          'fixed h-16 top-0 right-0 p-1.5 left-0 bg-white dark:bg-black border-b-[1.5px] dark:border-b-white/10 border-b-gray-600/30 z-20 transition-all',
          'lg:left-[30rem]',
        )}>
        <div className='h-full w-full flex items-center px-2'>
          <button
            type='button'
            title='close chat'
            className='flex items-center justify-center space-x-2'
            onClick={(event) => {
              event.stopPropagation();
              setMediaContentType(null);
              handleStatusWindowChange('view-status');
            }}>
            <ArrowLeftIcon className='h-5 w-5 dark:text-white' />
            <span className='text-base font-medium dark:text-white'>Create Status</span>
          </button>
        </div>
      </header>

      <Fragment>
        {mediaContentType === null && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 place-content-center place-items-center h-full pb-24 md:pb-0 p-4 lg:p-0'>
            {MEDIA_TYPES.map((type) => (
              <MediaTypeButtonComponent
                key={type}
                type={type}
                activeType={mediaContentType === type}
                setMediaContentType={setMediaContentType}
              />
            ))}
          </div>
        )}

        {mediaContentType === 'text' && <TextMediaContent />}
        {mediaContentType === 'image' && <ImageMediaContent />}
        {mediaContentType === 'video' && <VideoMediaContent />}
      </Fragment>
    </div>
  );
};

export const ViewStatusWindowPanelSlot = () => {
  const { handleStatusWindowChange } = useStatusStories();

  return (
    <div className='h-full flex flex-col'>
      <header
        className={classNames(
          'fixed h-16 top-0 right-0 p-1.5 left-0 bg-white dark:bg-black border-b-[1.5px] dark:border-b-white/10 border-b-gray-600/30 z-20 transition-all',
          'lg:left-[30rem]',
        )}>
        <div className='h-full w-full flex items-center px-2'>
          <button
            type='button'
            title='close chat'
            className='flex items-center justify-center space-x-2 lg:hidden'
            onClick={(event) => {
              event.stopPropagation();
              handleStatusWindowChange(null);
            }}>
            <ArrowLeftIcon className='h-5 w-5 dark:text-white' />
            <span className='text-base font-medium dark:text-white'>View Status</span>
          </button>
          <span className='text-xl text-gray-600 font-medium dark:text-white hidden lg:block'>
            View Status
          </span>
        </div>
      </header>

      <div className='w-full h-full flex justify-center items-center dark:text-white'>
        <div className='text-center'>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>No status updates yet</p>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              handleStatusWindowChange('create-status');
            }}
            className='px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors'>
            Create Your First Status
          </button>
        </div>
      </div>
    </div>
  );
};

type MediaTypeButtonComponentProps = {
  setMediaContentType: (type: MediaContentType) => void;
  type: string;
  activeType: boolean;
};

const MediaTypeButtonComponent: React.FC<MediaTypeButtonComponentProps> = ({
  setMediaContentType,
  type,
  activeType,
}) => {
  const renderMediaIcon = (mediaType: 'text' | 'image' | 'video') => {
    const baseClass = 'size-6 dark:text-indigo-500';

    const icons = {
      text: <DocumentTextIcon className={baseClass} title='Text content' />,
      image: <PhotoIcon className={baseClass} title='Image content' />,
      video: <VideoCameraIcon className={baseClass} title='Image content' />,
    };

    return icons[mediaType] || icons.text;
  };
  return (
    <motion.div
      role='button'
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        setMediaContentType(type as MediaContentType);
      }}
      className={classNames(
        activeType && 'bg-gray-600/30',
        'rounded-xl overflow-hidden border dark:border-gray-600/30 aspect-square w-full h-48 transition-colors dark:hover:bg-gray-600/30',
      )}>
      <div className='w-full h-full flex items-center p-1 gap-y-1.5 justify-center flex-col text-center'>
        {renderMediaIcon(type as MediaContentType)}
        <span className='font-nunito dark:text-white text-sm font-medium capitalize text-center'>
          {type}
        </span>
      </div>
    </motion.div>
  );
};
