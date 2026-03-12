import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { classNames, formatMessageTime, getDynamicUserColor } from '../../utils';
import { DocumentPreview } from '../file/DocumentPreview';
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Attachment, ChatMessageInterface } from '../../types/chat';
import { useMessage } from '../../hooks/useMessage';

type MessageFiles = Attachment[];

interface FilePreviewModalProps {
  handleCloseModal: () => void;
  open: boolean;
  messageFiles: MessageFiles;
  message: ChatMessageInterface;
  handleNextImage: () => void;
  handleImageChange: (index: number) => void;
  handlePreviousImage: () => void;
  currentMessageImageIndex: number;
  onAfterLeave?: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  handleCloseModal,
  open,
  messageFiles,
  message,
  handleNextImage,
  handleImageChange,
  handlePreviousImage,
  currentMessageImageIndex,
  onAfterLeave,
}) => {
  const { fileProgress } = useMessage();

  return (
    <Transition.Root show={open} as={Fragment} afterLeave={onAfterLeave}>
      <Dialog as='div' className='relative z-50' onClose={handleCloseModal}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/95 transition-opacity backdrop-blur-sm  lg:left-[30rem]' />
        </Transition.Child>

        <div className='fixed inset-0 z-10 overflow-hidden flex flex-col lg:left-[30rem]'>
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3 z-50 bg-black/20 backdrop-blur-md'>
            <div className='flex items-center gap-3'>
              {message.sender?.avatar?.url ? (
                <img
                  src={message.sender.avatar.url}
                  alt={message.sender.username}
                  className='size-10 rounded-full object-cover border border-white/20'
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: getDynamicUserColor(message.sender?._id || '', true),
                  }}
                  className='flex justify-center items-center size-10 rounded-full shrink-0 capitalize font-nunito font-bold text-white shadow-lg'>
                  {message.sender?.username.substring(0, 1)}
                </div>
              )}
              <div className='flex flex-col'>
                <span className='text-white font-semibold text-sm'>{message.sender?.username}</span>
                <span className='text-white/60 text-xs uppercase'>
                  {formatMessageTime(message.updatedAt)}
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <button
                className='p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 active:scale-90 group'
                onClick={handleCloseModal}
                aria-label='Close preview'>
                <XMarkIcon className='h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300' />
              </button>
            </div>
          </div>

          {/* Main Area */}
          <div className='relative flex-1 flex items-center justify-center p-4 min-h-0'>
            {messageFiles.length > 1 && !message.isDeleted && (
              <>
                <button
                  type='button'
                  className='absolute left-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full h-14 w-14 dark:bg-white/5 bg-gray-500 dark:hover:bg-white/15 hover:bg-gray-400 border border-white/10 hover:border-white/30 transition-all duration-300 active:scale-95 group backdrop-blur-sm'
                  onClick={handlePreviousImage}
                  aria-label='Previous image'>
                  <ArrowLeftIcon className='h-7 w-7 text-white group-hover:-translate-x-1 transition-transform' />
                </button>

                <button
                  type='button'
                  className='absolute right-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full h-14 w-14 dark:bg-white/5 bg-gray-500 dark:hover:bg-white/15 hover:bg-gray-400 border border-white/10 hover:border-white/30 transition-all duration-300 active:scale-95 group backdrop-blur-sm'
                  onClick={handleNextImage}
                  aria-label='Next image'>
                  <ArrowRightIcon className='h-7 w-7 text-white group-hover:translate-x-1 transition-transform' />
                </button>
              </>
            )}

            <Transition.Child
              as={Fragment}
              enter='ease-out duration-400'
              enterFrom='opacity-0 scale-90 translate-y-4'
              enterTo='opacity-100 scale-100 translate-y-0'
              leave='ease-in duration-300'
              leaveFrom='opacity-100 scale-100 translate-y-0'
              leaveTo='opacity-0 scale-90 translate-y-4'>
              <div className='w-full h-full flex items-center justify-center'>
                <div className='max-w-7xl max-h-full flex items-center justify-center relative shadow-2xl rounded-xl overflow-hidden'>
                  <DocumentPreview
                    attachment={messageFiles[currentMessageImageIndex]}
                    index={currentMessageImageIndex}
                    isModal={false}
                    showOverlay={fileProgress?.get(currentMessageImageIndex) ? true : false}
                    uploadProgress={fileProgress?.get(currentMessageImageIndex)}
                    status={message.status}
                  />
                </div>
              </div>
            </Transition.Child>
          </div>

          {/* Thumbnail Slider */}
          {messageFiles.length > 1 && (
            <div className='w-full px-4 py-6 bg-gradient-to-t from-black/80 to-transparent'>
              <div className='flex items-center justify-center gap-3 overflow-x-auto py-2 scrollbar-hide'>
                {messageFiles.map((file, index) => (
                  <button
                    key={`${file._id}-${index}`}
                    onClick={() => handleImageChange(index)}
                    className={classNames(
                      'h-16 w-16 rounded-lg overflow-hidden transition-all duration-300 flex-shrink-0 relative group border-2',
                      index === currentMessageImageIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-50 hover:opacity-80 scale-100',
                    )}
                    aria-label={`View attachment ${index + 1}`}>
                    <DocumentPreview
                      attachment={file}
                      index={index}
                      isModal={false}
                      showOverlay={fileProgress?.get(index) ? true : false}
                      uploadProgress={fileProgress?.get(index)}
                      status={message.status}
                    />
                    {index === currentMessageImageIndex && (
                      <div className='absolute inset-0 bg-white/10 pointer-events-none' />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </Transition.Root>
  );
};
