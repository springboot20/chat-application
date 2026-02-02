import { CogIcon } from '@heroicons/react/24/outline';
import { Settings } from '../../pages/settings/Settings';
import { useState } from 'react';
import { classNames } from '../../utils';

const navLinks = [
  {
    tab: 'chat_messages',
    Icon: ({ classname }: { classname: string }) => {
      return (
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
          className={classNames(
            'h-5 fill-none transition cursor-pointer hover:stroke-[#615EF0] dark:hover:stroke-[#615EF0]',
            classname,
          )}>
          <path d='M17 2H7C4.24 2 2 4.23 2 6.98V13.96C2 16.71 4.24 18.94 7 18.94H8.5C8.77 18.94 9.13 19.12 9.3 19.34L10.8 21.33C11.46 22.21 12.54 22.21 13.2 21.33L14.7 19.34C14.89 19.09 15.19 18.94 15.5 18.94H17C19.76 18.94 22 16.71 22 13.96V6.98C22 4.23 19.76 2 17 2ZM8 12C7.44 12 7 11.55 7 11C7 10.45 7.45 10 8 10C8.55 10 9 10.45 9 11C9 11.55 8.56 12 8 12ZM12 12C11.44 12 11 11.55 11 11C11 10.45 11.45 10 12 10C12.55 10 13 10.45 13 11C13 11.55 12.56 12 12 12ZM16 12C15.44 12 15 11.55 15 11C15 10.45 15.45 10 16 10C16.55 10 17 10.45 17 11C17 11.55 16.56 12 16 12Z' />
        </svg>
      );
    },
  },
  {
    tab: 'status',
    Icon: ({ classname }: { classname: string }) => {
      return (
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
          className={classNames(
            'h-5 fill-none transition cursor-pointer hover:stroke-[#615EF0] dark:hover:stroke-[#615EF0]',
            classname,
          )}>
          <path
            d='M7 10.74V13.94M12 9V15.68M17 10.74V13.94M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    },
  },
];

type SideNavigationProps = {
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
  activeTab: Tab;
};

type Tab = 'status' | 'chat_messages' | 'settings';

const SideNavigation: React.FC<SideNavigationProps> = ({ activeTab, setActiveTab }) => {
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <nav
      className={`fixed inset-0 min-h-screen shadow-sm border-r-[1.5px] border-r-gray-600/30 bottom-0 bg-white dark:bg-black dark:border-r-white/15 w-16 sm:w-20 z-20`}>
      <div className={`h-full flex justify-between p-5 flex-col items-center`}>
        <div className='flex flex-col justify-between items-center'>
          <div className='flex flex-col items-center space-y-8'>
            <div className='flex items-center'>
              <span className='inline-flex items-center'>
                <svg
                  width='56'
                  height='56'
                  viewBox='0 0 56 56'
                  xmlns='http://www.w3.org/2000/svg'
                  className='fill-[#615EF0] w-10 h-10 sm:h-12 sm:w-12'>
                  <rect width='56' height='56' rx='14' />
                  <path
                    d='M33.586 39.316C33.53 39.316 33.313 39.239 32.935 39.085C32.571 38.945 32.326 38.854 32.2 38.812C31.206 38.406 28.77 37.44 24.892 35.914C23.646 35.424 22.694 34.584 22.036 33.394C21.392 32.204 21.07 30.706 21.07 28.9C21.07 26.478 21.651 24.623 22.813 23.335C23.975 22.033 25.641 21.382 27.811 21.382C29.981 21.382 31.64 22.033 32.788 23.335C33.95 24.623 34.531 26.478 34.531 28.9C34.531 30.552 34.244 31.945 33.67 33.079C33.11 34.213 32.298 35.053 31.234 35.599V35.683L34.447 36.838C34.643 36.908 34.741 37.02 34.741 37.174C34.741 37.314 34.685 37.559 34.573 37.909C34.461 38.273 34.314 38.595 34.132 38.875C33.964 39.169 33.782 39.316 33.586 39.316ZM27.811 33.751C28.931 33.751 29.778 33.338 30.352 32.512C30.926 31.686 31.213 30.482 31.213 28.9C31.213 27.346 30.926 26.17 30.352 25.372C29.778 24.56 28.931 24.154 27.811 24.154C26.691 24.154 25.837 24.56 25.249 25.372C24.675 26.17 24.388 27.346 24.388 28.9C24.388 30.482 24.675 31.686 25.249 32.512C25.837 33.338 26.691 33.751 27.811 33.751Z'
                    fill='white'
                  />
                </svg>
              </span>
            </div>
            <ul className='space-y-6'>
              {navLinks.map(({ tab, Icon }, index) => {
                return (
                  <li
                    key={index}
                    onClick={() => {
                      setActiveTab(tab as Tab);
                    }}
                    className='flex items-center rounded-md p-3'>
                    <Icon
                      classname={classNames(
                        'stroke-2',
                        activeTab === (tab as Tab)
                          ? 'stroke-[#615EF0]'
                          : 'stroke-gray-500 dark:stroke-white',
                      )}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className='hidden lg:block'>
          <div className='flex items-center'>
            {/* Mobile menu button*/}
            <button
              type='button'
              onClick={() => setOpenSettings(!openSettings)}
              className='inline-flex items-center justify-center p-3 rounded-xl transition-all hover:rounded-full text-gray-600 bg-gray-50 border dark:text-white dark:bg-transparent hover:bg-[#615EF0]/70 hover:text-white focus:ring-2 focus:ring-inset focus:ring-white'>
              <span className='sr-only'>Settings</span>
              <CogIcon className='block h-5 w-5 stroke-2' aria-hidden='true' />
            </button>
          </div>

          {openSettings ? (
            <Settings open={openSettings} onClose={() => setOpenSettings(!openSettings)} />
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export { SideNavigation };
