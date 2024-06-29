import { Disclosure } from '@headlessui/react';
import { PanelProps } from '../../types/panels.type';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';

export const NotificationPanel = ({ open }: PanelProps) => {
  return (
    <div className={`fixed top-0 bg-white border-l-2 transition border-l-gray-200/40 h-screen w-[32rem] right-0 z-10 dark:bg-gray-800 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className='flex flex-col items-start gap-8 h-full'>
        <header className='p-8 relative w-full border-b-2 border-b-gray-200/40 h-28'>
          <h2 className='text-3xl font-semibold text-gray-800 dark:text-white'>Directory</h2>
          <Disclosure.Button className='h-12 w-12 flex items-center justify-center rounded-full bg-[#615EF0] absolute top-7 right-10'>
            <FontAwesomeIcon icon={faClose} className='h-10 text-white' />
          </Disclosure.Button>
        </header>
      </div>
    </div>
  );
};
