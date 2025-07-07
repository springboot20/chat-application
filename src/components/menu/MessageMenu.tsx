import { Transition } from "@headlessui/react";
import { ArrowUturnLeftIcon, DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";
import React, { Fragment } from "react";

type Position = {
  x: number;
  y: number;
};

interface MessageMenuSelectionProps {
  // onSelectionClick?: (type: FileTypes) => void;
  open?: boolean;
  menuRef: React.MutableRefObject<HTMLDivElement | null>;
  menuPosition: Position;
}

export const MessageMenuSelection: React.FC<MessageMenuSelectionProps> = ({
  open,
  menuRef,
  menuPosition,
}) => {
  console.log(menuRef);
  console.log(menuPosition);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Transition.Child
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div
          style={{
            top: menuPosition.y,
            left: menuPosition.x,
          }}
          ref={menuRef}
          className="fixed z-[100] h-fit origin-top-right min-w-56 rounded-md bg-gray-50 dark:bg-gray-900 dark:ring-white/15 py-1.5 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <button type="button" className="w-full dark:hover:bg-white/5 px-3 py-2">
            <div className="flex items-center gap-3">
              <ArrowUturnLeftIcon className="h-6 dark:stroke-white" />
              <span className="font-nunito font-medium text-sm sm:text-base lg:text-lg dark:text-white">
                Reply Message
              </span>
            </div>
          </button>

          <button type="button" className="w-full dark:hover:bg-white/5 px-3 py-2">
            <div className="flex items-center gap-3">
              <DocumentDuplicateIcon className="h-6 dark:stroke-white" />
              <span className="font-nunito font-medium text-sm sm:text-base lg:text-lg dark:text-white">
                Copy Message
              </span>
            </div>
          </button>

          <button type="button" className="w-full dark:hover:bg-white/5 px-3 py-2">
            <div className="flex items-center gap-3">
              <TrashIcon className="h-6 text-red-500" />
              <span className="font-nunito font-medium text-sm sm:text-base lg:text-lg text-red-500">
                Delete Message
              </span>
            </div>
          </button>
        </div>
      </Transition.Child>
    </Transition.Root>
  );
};
