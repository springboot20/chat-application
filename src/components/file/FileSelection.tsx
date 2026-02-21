import { Disclosure, Transition } from '@headlessui/react';
import { DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useRef } from 'react';

type FileTypes = 'document-file' | 'image-file';

interface FileSelectionProps {
  onSelectionClick?: (type: FileTypes) => void;
  handleOpenPolling?: (value: boolean) => void;
  close: (focusableElement?: HTMLElement | React.MutableRefObject<HTMLElement | null>) => void;
  open?: boolean;
  documentInputRef: React.MutableRefObject<HTMLInputElement | null>;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
  handleFileChange: (
    fileType: 'document-file' | 'image-file',
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}

export const FileSelection: React.FC<FileSelectionProps> = ({
  imageInputRef,
  documentInputRef,
  handleFileChange,
  close,
  open,
  handleOpenPolling,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleCloseFileMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.file-menu')) {
        close();
      }
    };

    document.addEventListener('mousedown', handleCloseFileMenu);

    return () => document.removeEventListener('mousedown', handleCloseFileMenu);
  }, [close]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange('image-file', event);
    close();
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange('document-file', event);
    close();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Disclosure.Panel
        as='div'
        className='bottom-[4.25rem] absolute inset-x-0 z-50 file-menu'
        ref={ref}>
        <Transition.Child
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'>
          <div className='origin-bottom bg-white w-full dark:bg-gray-900 dark:ring-white/15 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
            <div className='grid grid-cols-2 place-items-center lg:grid-cols-3 max-w-[18rem] sm:max-w-sm w-full mx-auto'>
              <input
                hidden
                multiple
                type='file'
                id='image-files'
                accept='image/*'
                max={5}
                ref={imageInputRef}
                onChange={handleImageChange}
              />
              <label
                htmlFor='image-files'
                className='w-full flex-grow dark:hover:bg-white/5 px-2 py-2 cursor-pointer'>
                <div className='flex flex-col items-center gap-3'>
                  <PhotoIcon className='size-5 dark:stroke-white' />
                  <span className='font-nunito font-medium text-[0.65rem] dark:text-white'>
                    Upload Image
                  </span>
                </div>
              </label>

              <input
                hidden
                multiple
                type='file'
                id='document-files'
                accept='.pdf,.doc,.docx,.txt,.rtf'
                max={5}
                ref={documentInputRef}
                onChange={handleDocumentChange}
              />
              <label
                htmlFor='document-files'
                className='w-full flex-grow dark:hover:bg-white/5 px-2 py-2 cursor-pointer'>
                <div className='flex flex-col items-center gap-3'>
                  <DocumentIcon className='size-5 dark:stroke-white' />
                  <span className='font-nunito font-medium text-[0.65rem] dark:text-white'>
                    Document
                  </span>
                </div>
              </label>

              <div
                role='button'
                onClick={() => handleOpenPolling?.(true)}
                className='dark:hover:bg-white/5 px-2 py-2 w-full cursor-pointer'>
                <div className='flex flex-col items-center gap-3'>
                  <svg
                    data-slot='icon'
                    fill='none'
                    strokeWidth='1.5'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                    className='size-5 dark:stroke-white'
                    aria-hidden='true'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12'></path>
                  </svg>
                  <span className='font-nunito font-medium text-[0.65rem] dark:text-white'>
                    Polling
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Transition.Child>
      </Disclosure.Panel>
    </Transition.Root>
  );
};
