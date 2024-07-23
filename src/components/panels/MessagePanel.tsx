import { PlusIcon } from "@heroicons/react/24/outline";
import { SearchInput } from "./SearchInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faClose } from "@fortawesome/free-solid-svg-icons";
import { Disclosure } from "@headlessui/react";
import { Loading } from "../Loading";

export const MessagePanel: React.FC<{
  open: boolean;
  setOpenChat: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpenChat }) => {
  return (
    <Disclosure.Panel
      className={`fixed w-[35rem] bg-white dark:bg-gray-800 flex-1 border-r-[1.5px] border-r-gray-600/30 h-screen z-10 lg:z-10 transform ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex flex-col items-center gap-8 h-full">
        <Disclosure.Button
          className={
            "absolute right-0 bottom-9 h-14 w-14 rounded-full lg:hidden"
          }
        >
          <span className="sr-only">Close panel</span>
          <FontAwesomeIcon
            icon={faClose}
            className="h-7 w-7 stroke-[4] text-gray-500 dark:text-white"
            aria-hidden={true}
          />
        </Disclosure.Button>

        <div className="flex justify-between items-center w-full p-4 border-b-[1.5px] border-b-gray-600/30">
          <div className="flex items-center">
            <span className="text-xl block text-gray-600 font-medium dark:text-white">
              Messages
            </span>
            <button className={"h-14 w-14 rounded-full"}>
              <span className="sr-only">Open Messages</span>
              <FontAwesomeIcon
                icon={faCaretDown}
                className="h-7 w-7 stroke-[4] text-gray-500 dark:text-white"
                aria-hidden={true}
              />
            </button>
          </div>
          <button
            type="button"
            className="block p-3 rounded-full bg-[#615EF0]"
            onClick={() => setOpenChat(prev=> !prev)}
          >
            <span className="sr-only">plus icon</span>
            <PlusIcon
              className="h-5 stroke-[4] text-white"
              aria-hidden={true}
            />
          </button>
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
    </Disclosure.Panel>
  );
};
