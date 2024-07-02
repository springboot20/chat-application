import { useTheme } from '../../context/ThemeContext'
import { ModeToggler } from '../../components/ModeToggler'
import { SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export const Settings: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { setTheme, activeMode, activateTheme } = useTheme()

  const handleClose = () => onClose()
  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
          <div className="fixed inset-0 z-10">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className="transition-all transform rounded-lg h-1/2 p-8 fixed bottom-12 left-32 w-[40%] z-20 bg-gray-200 dark:bg-gray-600 shadow-lg"
                  style={{
                    overflow: 'inherit',
                  }}
                >
                  <div className="py-4 flex w-full items-center justify-between">
                    <Dialog.Title
                      as="h2"
                      className="text-3xl text-gray-800 dark:text-gray-50 font-semibold"
                    >
                      Settings
                    </Dialog.Title>

                    <button
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-gray-200 shadow absolute top-7 right-10"
                      onClick={() => onClose()}
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon
                        className="h-8 text-gray-800"
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between w-full items-center rounded-xl bg-gray-50 shadow dark:bg-gray-500 p-3">
                    <div className="flex items-center space-x-11">
                      <div className="flex items-center relative flex-shrink-0 h-14 w-14 rounded-full ">
                        {activeMode ? (
                          <MoonIcon className="h-9 left-1/2 -translate-x-1/2 absolute text-gray-500 dark:text-gray-50" />
                        ) : (
                          <SunIcon className="h-9 left-1/2 -translate-x-1/2 absolute text-gray-700 dark:text-gray-50" />
                        )}
                      </div>
                      <h3 className="text-xl font-medium text-gray-800 dark:text-white">
                        Theme
                      </h3>
                    </div>
                    <div className="">
                      <ModeToggler
                        icon={
                          activeMode ? (
                            <MoonIcon className="h-10 w-10 text-white" />
                          ) : (
                            <SunIcon className="h-10 w-10 text-gray-700" />
                          )
                        }
                        setTheme={setTheme}
                        activate={activateTheme}
                        active={activeMode}
                        className={
                          'flex space-x-3 flex-shrink-0 flex-grow items-center dark:text-white text-gray-900'
                        }
                      />
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
