import { PlusIcon } from '@heroicons/react/24/outline'
import { SearchInput } from './SearchInput'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faClose } from '@fortawesome/free-solid-svg-icons'
import { PanelProps } from '../../types/panels.type'
import { Disclosure } from '@headlessui/react'
import { Loading } from '../Loading'

export const MessagePanel: React.FC<
  { setOpen: React.Dispatch<React.SetStateAction<boolean>> } & PanelProps
> = ({ open, setOpen }) => {
  return (
    <div
      className={`fixed w-[35rem] lg:left-32 bg-white dark:bg-gray-800 border-r-2 flex-1 border-r-gray-200/40 h-screen z-20 lg:lg:z-10  transform -translate-x-full md:translate-x-0 ${
        open ? 'translate-x-0' : ''
      }`}
    >
      <div className="flex flex-col items-center gap-8 h-full">
        <Disclosure.Button
          className={'absolute right-0 h-14 w-14 rounded-full lg:hidden'}
        >
          <span className="sr-only">Close panel</span>
          <FontAwesomeIcon
            icon={faClose}
            className="h-7 w-7 stroke-[4] text-gray-500 dark:text-white"
            aria-hidden={true}
          />
        </Disclosure.Button>
        <div className="flex justify-between items-center w-full p-8 border-b-2 border-b-gray-200/40 mt-10">
          <div className="flex items-center">
            <span className="text-3xl block text-gray-600 font-medium dark:text-white">
              Messages
            </span>
            <button className={'h-14 w-14 rounded-full'}>
              <span className="sr-only">Open Messages</span>
              <FontAwesomeIcon
                icon={faCaretDown}
                className="h-7 w-7 stroke-[4] text-gray-500 dark:text-white"
                aria-hidden={true}
              />
            </button>
          </div>
          <Disclosure.Button
            className="block p-4 rounded-full bg-[#615EF0]"
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">plus icon</span>
            <PlusIcon
              className="h-7 stroke-[4] text-white"
              aria-hidden={true}
            />
          </Disclosure.Button>
        </div>
        <div className="w-full p-4">
          <SearchInput
            placeholder="Search messages"
            className="h-14 bg-gray-100/60 outline-gray-400 dark:bg-white rounded-lg shadow-md outline outline-2"
          />
        </div>

        <div className="">
          <Loading />
        </div>
      </div>
    </div>
  )
}
