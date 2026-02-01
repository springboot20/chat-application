import { Disclosure } from '@headlessui/react';
import { Fragment } from 'react';
import { classNames } from '../../utils';
import { StatusUpdates } from '../status/StatusUpdates';
import { useStatusStories } from '../../hooks/useStatusStories';

export const StatusTabComponent = () => {
  const { statusWindow } = useStatusStories();

  return (
    <Fragment>
      <div
        className='fixed lg:left-20 w-[25rem] bg-white dark:bg-black flex-1 border-r-[1.5px] border-r-gray-600/30 h-screen z-30 hidden lg:block font-nunito
        '>
        <div className='flex flex-col gap-4 h-full'>
          <div className='flex justify-between items-center w-full p-2 h-16 border-b-[1.5px] border-b-gray-600/30'>
            <div className='flex items-center'>
              <span className='text-xl block text-gray-600 font-medium dark:text-white'>
                Status
              </span>
            </div>
          </div>

          <div className='px-2'>
            <StatusUpdates />
          </div>
        </div>
      </div>

      {statusWindow === null &&
        statusWindow !== 'view-status' &&
        statusWindow !== 'create-status' && (
          <Disclosure.Panel
            static
            className={classNames(
              'fixed w-full bg-white dark:bg-black z-30 lg:hidden',
              'mobile-navigation border-r-[1.5px] border-r-gray-600/30',
              'left-0 font-nunito',
            )}>
            <header className='fixed inset-x-0 h-14 border-b-[1.5px] border-b-gray-600/30'>
              <div className='flex items-center justify-between h-full px-2'>
                <h2 className='text-2xl font-semibold dark:text-white'>Status</h2>
              </div>
            </header>

            <div className='mt-16'>
              <div className='px-2'>
                <StatusUpdates />
              </div>
            </div>
          </Disclosure.Panel>
        )}
    </Fragment>
  );
};
