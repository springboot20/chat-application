import { Button } from '../buttons/Buttons';
import { SearchInput as MessageInput } from '../panels/SearchInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/fontawesome-free-regular';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { PaperClipIcon } from '@heroicons/react/24/outline';

export const MessageInputNavigation: React.FC<{
  setAttachmentFiles: React.Dispatch<React.SetStateAction<File[] | undefined>>;
}> = ({ setAttachmentFiles }) => {
  return (
    <div className='absolute bottom-0 right-0 left-0 h-28 bg-white dark:bg-gray-800 z-10'>
      <div className='p-4 h-full w-full flex items-center space-x-7'>
        <input
          hidden
          multiple
          type='file'
          max={5}
          onChange={(event) => {
            if (event.target.files) {
              setAttachmentFiles([...event.target.files]);
            }
          }}
        />
        <label htmlFor=''>
          <PaperClipIcon className='w-10 h-10 fill-none stroke-gray-400 dark:stroke-white hover:stroke-gray-300 transition' />
        </label>
        <div className='relative w-full outline-gray-400 outline outline-2 rounded-2xl h-16 p-3 overflow-hidden'>
          <MessageInput
            className='w-full relative outline-none border-none h-full text-xl dark:text-white font-medium bg-transparent'
            placeholder='type in your message...'
          />
          <Button className=''>
            <FontAwesomeIcon
              icon={faPaperPlane as IconProp}
              className='h-10 absolute right-5 text-violet-500 top-1/2 -translate-y-1/2'
            />
          </Button>
        </div>
      </div>
    </div>
  );
};
