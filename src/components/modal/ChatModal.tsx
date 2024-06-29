import React, { Fragment } from 'react'
import { Button } from '../buttons/Buttons'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { SelectModalInput } from './Select'

export const ChatModal: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ onClose, open }) => {
  const handleClose = () => {
    onClose()
  }

  const options = [
    {
      value: 'abbase',
      label: 'opeyemi',
    },
    {
      value: 'abbase',
      label: 'opeyemi',
    },
    {
      value: 'abbase',
      label: 'opeyemi',
    },
  ]

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/70 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-visible">
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
                  className="relative transform overflow-x-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 h-full"
                  style={{
                    overflow: 'inherit',
                  }}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <Dialog.Title
                        as="h3"
                        className="text-2xl font-medium leading-6 text-gray-900 dark:text-white"
                      >
                        Create Chat
                      </Dialog.Title>
                      <button
                        type="button"
                        className="bg-gray-300 hover:text-zinc-600 rounded-full p-3 flex justify-center items-center"
                        onClick={() => handleClose()}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon
                          strokeWidth={2}
                          className="h-6 w-6 text-gray-800"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="my-5">
                    <SelectModalInput
                      placeholder={'Select a user to chat...'}
                      value={''}
                      options={options}
                      onChange={() => console.log('hello')}
                    />
                  </div>
                  <div className="mt-5 flex justify-between items-center gap-4">
                    <Button
                      onClick={handleClose}
                      className="w-[40%] bg-black/40 text-white text-xl font-semibold rounded-lg"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => console.log('hello world')}
                      className="w-[40%] bg-violet-500 text-white text-xl font-semibold rounded-lg"
                    >
                      Create
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
