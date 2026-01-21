import { Disclosure, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { User } from '../../types/auth';
import { classNames } from '../../utils';
import { CheckIcon, UserIcon } from '@heroicons/react/24/outline';

interface MentionUserMenuComponentProp {
  show: boolean;
  handleSelectUser: (user: User) => void;
  selectedUser: User;
  users: User[];
}

export const MentionUserMenuComponent: React.FC<MentionUserMenuComponentProp> = ({
  show,
  handleSelectUser,
  selectedUser,
  users,
}) => {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Disclosure.Panel as='div' className='bottom-20 absolute left-4 z-50 file-menu'>
        <Transition.Child
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'>
          <div className='min-w-[200px] origin-top-right rounded-md bg-white dark:bg-gray-900 dark:ring-white/15 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
            {(users || []).map((user) => {
              const selected = user._id === selectedUser._id;

              return (
                <button
                  key={user._id}
                  type='button'
                  onClick={() => handleSelectUser(user)}
                  className='group px-3 py-1.5 relative w-full'>
                  <div className='flex items-center gap-3'>
                    {user?.avatar?.url ? (
                      <div className='overflow-hidden size-7 rounded-full border border-gray-400'>
                        <img
                          src={user?.avatar?.url}
                          alt={user?.username}
                          className='h-full w-full object-cover object-center'
                        />
                      </div>
                    ) : (
                      <span className='shrink-0 flex justify-center items-center size-7 border border-gray-400 bg-gray-50 rounded-full'>
                        <UserIcon className='h-4 fill-gray-600' />
                      </span>
                    )}
                    <span
                      className={classNames(
                        'block truncate text-gray-800 dark:text-white',
                        selected ? 'font-semibold' : '',
                      )}>
                      {user.username}
                    </span>
                  </div>

                  {selected && (
                    <span
                      className={classNames(
                        'absolute inset-y-0 right-0 flex items-center pr-4 group-focus:text-indigo-600 text-indigo-600',
                      )}>
                      <CheckIcon
                        className={classNames('h-5 w-5')}
                        strokeWidth={selected ? 2 : 1}
                        aria-hidden='true'
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Transition.Child>
      </Disclosure.Panel>
    </Transition.Root>
  );
};
