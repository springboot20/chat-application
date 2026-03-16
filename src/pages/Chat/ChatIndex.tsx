import React from 'react';
import { classNames } from '../../utils';

export const ChatIndex: React.FC = () => {
  return (
    <div
      className={classNames(
        'h-full flex flex-col justify-center items-center dark:text-white bg-white dark:bg-black p-10 text-center',
      )}>
      <div className='max-w-md space-y-4'>
        <h2 className='text-3xl font-bold text-gray-800 dark:text-white'>Welcome to Chat-App</h2>
        <p className='text-gray-500 dark:text-gray-400'>
          Select a chat from the sidebar to start messaging. Your conversations are encrypted and
          secure.
        </p>
        <div className='pt-6'>
          <div className='inline-flex items-center justify-center p-4 rounded-full bg-[#615EF0]/10 text-[#615EF0]'>
            <svg
              width='48'
              height='48'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M17 2H7C4.24 2 2 4.23 2 6.98V13.96C2 16.71 4.24 18.94 7 18.94H8.5C8.77 18.94 9.13 19.12 9.3 19.34L10.8 21.33C11.46 22.21 12.54 22.21 13.2 21.33L14.7 19.34C14.89 19.09 15.19 18.94 15.5 18.94H17C19.76 18.94 22 16.71 22 13.96V6.98C22 4.23 19.76 2 17 2Z'
                fill='currentColor'
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
