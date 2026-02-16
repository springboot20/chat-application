import { Disclosure, Transition } from '@headlessui/react';
import { ArrowUturnLeftIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { Fragment } from 'react';
import { createPortal } from 'react-dom';

type Position = {
  x: number;
  y: number;
};

interface MessageMenuSelectionProps {
  // onSelectionClick?: (type: FileTypes) => void;
  open?: boolean;
  isMessageDeleted: boolean;
  menuRef: React.MutableRefObject<HTMLDivElement | null>;
  menuPosition: Position;
  handleDeleteChatMessage: () => void;
  handleSetOpenReply: () => void;
  closeMenu: () => void;
}

export const MessageMenuSelection: React.FC<MessageMenuSelectionProps> = ({
  open,
  menuRef,
  menuPosition,
  handleDeleteChatMessage,
  closeMenu,
  isMessageDeleted,
  handleSetOpenReply,
}) => {
  console.log(menuRef!);
  console.log(menuPosition);

  return createPortal(
    <Transition.Root show={open} as={Fragment}>
      <Disclosure.Panel as='div' className='fixed inset-0 z-[9999] pointer-events-none'>
        {/* Invisible overlay to handle clicks outside if needed, or just let menu handle it */}
        <Transition.Child
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'>
          <div
            style={{
              top: `${menuPosition.y}px`,
              left: `${menuPosition.x}px`,
            }}
            ref={menuRef}
            className='fixed w-64 h-fit origin-top-left rounded-md bg-gray-50 dark:bg-gray-900 dark:ring-white/15 py-1.5 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none pointer-events-auto'>
            {!isMessageDeleted && (
              <button
                type='button'
                className='w-full dark:hover:bg-white/5 px-3 py-2 text-gray-800'
                onClick={() => {
                  handleSetOpenReply();
                  closeMenu();
                }}>
                <div className='flex items-center gap-3'>
                  <ArrowUturnLeftIcon className='h-6 dark:stroke-white' />
                  <span className='font-nunito font-medium text-sm sm:text-base lg:text-lg dark:text-white'>
                    Reply Message
                  </span>
                </div>
              </button>
            )}

            {!isMessageDeleted && (
              <button
                type='button'
                className='w-full dark:hover:bg-white/5 px-3 py-2 text-gray-800'
                onClick={() => {
                  closeMenu();
                }}>
                <div className='flex items-center gap-3'>
                  <DocumentDuplicateIcon className='h-6 dark:stroke-white' />
                  <span className='font-nunito font-medium text-sm sm:text-base lg:text-lg dark:text-white'>
                    Copy Message
                  </span>
                </div>
              </button>
            )}

            <button
              type='button'
              className='w-full dark:hover:bg-white/5 px-3 py-2 text-gray-800'
              onClick={() => {
                handleDeleteChatMessage();
                closeMenu();
              }}>
              <div className='flex items-center gap-3'>
                <TrashIcon className='h-6 text-red-500' />
                <span className='font-nunito font-medium text-sm sm:text-base lg:text-lg text-red-500'>
                  Delete Message
                </span>
              </div>
            </button>
          </div>
        </Transition.Child>
      </Disclosure.Panel>
    </Transition.Root>,
    document.body,
  );
};
