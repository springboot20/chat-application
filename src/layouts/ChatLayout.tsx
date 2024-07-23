import React, { useState } from "react";
import { MessagePanel } from "../components/panels/MessagePanel.tsx";
import { Disclosure } from "@headlessui/react";
import { ChatModal } from "../components/modal/ChatModal";
import { Bars3Icon, UserIcon } from "@heroicons/react/24/outline";
import { MessageInputNavigation } from "../components/navigation/MessageInputNavigation.tsx";
import { classNames } from "../utils/index.ts";

export const ChatLayout = () => {
  const [openChat, setOpenChat] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[] | undefined>(
    []
  );

  console.log(attachmentFiles);

  return (
    <Disclosure as={"div"}>
      {({ open }) => (
        <React.Fragment>
          <ChatModal open={openChat} onClose={() => setOpenChat(false)} />
          <div
            className={classNames(
              "w-full flex items-stretch h-screen flex-shrink-0",
              open ? "lg:justify-between" : ""
            )}
          >
            <MessagePanel open={open} setOpenChat={setOpenChat} />
            <main
              className={classNames(
                "w-full sticky min-h-screen right-0 overflow-hidden transition-all",
                open
                  ? "lg:left-[35rem] lg:w-[calc(100%-35rem)] "
                  : "left-0 w-full flex-1"
              )}
            >
              <div className="w-full flex flex-col justify-between h-full">
                <header
                  className={classNames(
                    "fixed top-0 right-0 p-[0.9rem] bg-white dark:bg-gray-800 border-b-[1.5px] border-b-gray-600/30 z-10 transition-all",
                    open ? "left-[35rem]" : "left-0"
                  )}
                >
                  <div className="flex justify-between items-center h-full">
                    <div className="flex items-center gap-5">
                      <Disclosure.Button>
                        <Bars3Icon className="text-gray-800 h-10" />
                      </Disclosure.Button>

                      <div className="flex items-start space-x-4">
                        <span className="flex items-center justify-center h-12 w-12 rounded-lg dark:bg-white cursor-pointer">
                          <UserIcon className="h-10 w-10 text-gray-600" />
                        </span>
                        <div className="">
                          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                            Florencio Dorrance
                          </h3>
                          <p className="inline-flex items-center space-x-4">
                            <span className="h-3 w-3 rounded-full bg-green-400 block"></span>
                            <span className="text-xl font-medium dark:text-white">
                              Online
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </header>
                <div className="relative gap-6 h-screen flex flex-col flex-grow overflow-hidden flex-shrink-0 mt-20 w-full">
                  <div className="flex flex-col flex-grow p-4 overflow-auto gap-10">
                    <div className="flex w-full mt-2 gap-2 md:max-w-xl lg:max-w-3xl">
                      <span className="block h-20 w-20 p-4 bg-white shadow rounded-md"></span>
                      <div className="bg-[#A79BE1B2] w-full rounded-2xl p-4 lg:py-8 lg:px-12"></div>
                    </div>

                    <div className="justify-end flex w-full mt-2 gap-2 md:max-w-xl ml-auto lg:max-w-3xl">
                      <div className="bg-[#A79BE1B2] w-full rounded-2xl p-4 lg:py-8 lg:px-12"></div>
                      <span className="block h-20 w-20 p-4 bg-white shadow rounded-md"></span>
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 p-4 w-full gap-2 left-28 lg:left-[40rem] right-0 h-28 bg-white dark:bg-gray-800 z-10 border-t-[1.5px] border-b-[1.5px] border-gray-600/30">
                  <MessageInputNavigation
                    setAttachmentFiles={setAttachmentFiles}
                  />
                </div>
              </div>
            </main>
          </div>
        </React.Fragment>
      )}
    </Disclosure>
  );
};
