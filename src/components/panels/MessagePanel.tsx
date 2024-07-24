import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { SearchInput } from "./SearchInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faClose } from "@fortawesome/free-solid-svg-icons";
import { Disclosure } from "@headlessui/react";
import { Loading } from "../Loading";
import { useRef } from "react";

export const MessagePanel: React.FC<{
  open: boolean;
  setOpenChat: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpenChat }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();

      alert(inputRef.current)
    }
  };

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
            onClick={() => setOpenChat((prev) => !prev)}
          >
            <span className="sr-only">plus icon</span>
            <PlusIcon
              className="h-5 stroke-[4] text-white"
              aria-hidden={true}
            />
          </button>
        </div>
        <div className="px-3 w-full">
          <div className="w-full rounded-md border border-gray-400 flex items-center h-16 bg-gray-100/60">
            <button
              type="button"
              className="px-4 py-2 flex items-center justify-center"
              onClick={handleFocus}
            >
              <MagnifyingGlassIcon
                className="h-7 text-gray-700"
                aria-hidden={true}
              />
            </button>

            <SearchInput
              ref={inputRef}
              placeholder="Search messages"
              className="flex-1 h-full bg-transparent"
            />
          </div>

          <div className="w-full mx-auto flex items-center justify-center mt-5">
            <Loading />
          </div>
        </div>
      </div>
    </Disclosure.Panel>
  );
};
