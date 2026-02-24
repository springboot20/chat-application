import { useTheme } from '../../context/ThemeContext';
import { ModeToggler } from '../../components/ModeToggler';
import {
  SunIcon,
  MoonIcon,
  XMarkIcon,
  UserIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useAppSelector } from '../../redux/redux.hooks';
import { UserProfileModal } from '../../components/modal/UserProfileModal';

export const Settings: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { activeMode } = useTheme();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [openProfile, setOpenProfile] = useState(false);

  const handleClose = () => onClose();
  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog open={open} onClose={handleClose} className='relative z-[60]'>
          <Dialog.Backdrop className='fixed inset-0 z-50 bg-gray-500/75 dark:bg-black/70 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in' />

          <div className='fixed inset-0 z-50'>
            <div className='flex min-h-full items-end justify-center p-3 text-center sm:items-center sm:p-0'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
                enterTo='opacity-100 translate-y-0 sm:scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 translate-y-0 sm:scale-100'
                leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'>
                <Dialog.Panel className='flex w-full transform text-left text-base transition data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in md:data-[closed]:translate-y-0 md:data-[closed]:scale-95 mx-auto md:max-w-5xl md:rounded-2xl overflow-hidden'>
                  <div className='relative flex flex-col md:flex-row bg-white dark:bg-gray-900 w-full min-h-screen md:min-h-[600px] md:max-h-[85vh]'>
                    <div className='md:hidden flex justify-between items-center w-full h-16 px-4 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30'>
                      <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                        Settings
                      </Dialog.Title>
                      <button
                        type='button'
                        onClick={handleClose}
                        className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                        <span className='sr-only'>Close</span>
                        <XMarkIcon className='h-6 w-6' />
                      </button>
                    </div>

                    <div className='w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/50'>
                      <div className='hidden md:flex justify-between items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30'>
                        <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                          Settings
                        </Dialog.Title>
                        <button
                          type='button'
                          onClick={handleClose}
                          className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'>
                          <span className='sr-only'>Close</span>
                          <XMarkIcon className='h-6 w-6' />
                        </button>
                      </div>

                      <div className='p-4 space-y-1'>
                        <div className='p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-3 cursor-pointer'>
                          <UserCircleIcon className='h-5 w-5' />
                          <span>General</span>
                        </div>
                        <div className='p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 font-medium flex items-center gap-3 cursor-pointer transition-colors'>
                          <SunIcon className='h-5 w-5' />
                          <span>Appearance</span>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-6 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/50 p-6'>
                      {/* Profile Section */}
                      <section>
                        <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1'>
                          Account Profile
                        </h4>
                        <div className='flex justify-between w-full items-center rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border dark:border-gray-700/50'>
                          <div className='flex items-center gap-4'>
                            <div className='flex items-center relative flex-shrink-0 h-16 w-16 '>
                              {currentUser?.avatar?.url ? (
                                <img
                                  src={currentUser.avatar.url}
                                  alt={currentUser.username}
                                  className='h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'
                                />
                              ) : (
                                <div className='h-16 w-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'>
                                  <UserIcon className='h-8 w-8 text-gray-400' />
                                </div>
                              )}
                            </div>
                            <div className='text-left'>
                              <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                                {currentUser?.username || 'Guest User'}
                              </h3>
                              <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {currentUser?.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setOpenProfile(true)}
                            className='p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all active:scale-95'
                            title='Edit Profile'>
                            <PencilSquareIcon className='h-6 w-6' />
                          </button>
                        </div>
                      </section>

                      <UserProfileModal
                        open={openProfile}
                        onClose={() => setOpenProfile(false)}
                        user={currentUser}
                      />

                      {/* Appearance Section */}
                      <section>
                        <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1'>
                          Appearance
                        </h4>
                        <div className='flex justify-between w-full items-center rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border dark:border-gray-700/50'>
                          <div className='flex items-center gap-4'>
                            <div className='flex items-center justify-center h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'>
                              {activeMode ? (
                                <MoonIcon className='h-6 w-6' />
                              ) : (
                                <SunIcon className='h-6 w-6' />
                              )}
                            </div>
                            <div className='text-left'>
                              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                Theme Mode
                              </h3>
                              <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {activeMode ? 'Dark Theme' : 'Light Theme'}
                              </p>
                            </div>
                          </div>
                          <ModeToggler />
                        </div>
                      </section>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
