import React, { useState } from 'react'
// import { MessageItem } from '../components/panels/MessageItem';
import { NavigationLayout } from './NavigationLayout'
import { Disclosure } from '@headlessui/react'
import { NotificationPanel } from '../components/panels/NotificationPanel'
import { ChatModal } from '../components/modal/ChatModal'
import {
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { Button } from '../components/buttons/Buttons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone } from '@fortawesome/free-solid-svg-icons'
import { SearchInput } from '../components/panels/SearchInput'

export const ChatLayout = () => {
  const [openChat, setOpenChat] = useState(false)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])

  console.log(attachmentFiles)

  return (
    <Disclosure as={'div'}>
      {({ open }) => (
        <React.Fragment>
          <ChatModal open={openChat} onClose={() => setOpenChat(false)} />
          <div className="w-full flex lg:justify-between items-stretch h-screen flex-shrink-0">
            <NavigationLayout setOpen={setOpenChat} />
            <main className="w-full left-32 lg:w-[calc(100%-43rem)] sticky lg:left-[43rem] min-h-screen right-0">
              <div className="w-full relative flex flex-col justify-between h-full">
                <header className="fixed top-0 right-0 left-32 lg:left-[43rem] h-28 bg-white dark:bg-gray-800 dark:shadow-md -z-10">
                  <div className="flex justify-between items-center p-4 h-full">
                    <div className="flex items-start space-x-4">
                      <span className="flex items-center justify-center p-2 h-16 w-16 rounded-lg dark:bg-white shadow-md cursor-pointer">
                        <UserIcon className="h-10 w-10 text-gray-600" />
                      </span>
                      <div className="">
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                          Florencio Dorrance
                        </h3>
                        <p className="inline-flex items-center space-x-4">
                          <span className="h-3 w-3 rounded-full bg-green-400 block"></span>
                          <span className="text-xl font-medium dark:text-white">
                            {' '}
                            Online
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button className="flex items-end justify-center space-x-2 h-12 w-28 rounded-lg shadow-md hover:bg-[#615EF0]/10 bg-[#615EF0]/20 hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-1 focus:ring-violet-400">
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="h-7 text-violet-500"
                        />
                        <p className="text-lg text-violet-500 font-semibold">
                          Call
                        </p>
                      </Button>
                      <Disclosure.Button className={'block'}>
                        <EllipsisVerticalIcon className="h-10 stroke-2 fill-none stroke-gray-600" />
                      </Disclosure.Button>
                    </div>
                  </div>
                </header>
                <div className="p-8 overflow-y-auto flex flex-col-reverse gap-6 w-full">
                  
                </div>
                <div className="sticky top-full p-4 flex justify-between items-center w-full gap-2 left-32 lg:left-[43rem] h-28 bg-white dark:bg-gray-800 z-10">
                  <div className="p-4 h-full w-full flex items-center space-x-7">
                    <input
                      hidden
                      multiple
                      type="file"
                      id="attachments"
                      value=""
                      max={5}
                      onChange={(event) => {
                        if (event.target.files) {
                          setAttachmentFiles([...event.target.files])
                        }
                      }}
                    />
                    <label htmlFor="attachments">
                      <PaperClipIcon className="w-10 h-10 fill-none stroke-gray-400 dark:stroke-white hover:stroke-gray-300 transition" />
                    </label>
                    <div className="relative w-full outline-gray-400 outline outline-2 rounded-2xl h-16 p-3 overflow-hidden">
                      <SearchInput
                        className="w-full relative outline-none border-none h-full text-xl dark:text-white font-medium bg-transparent"
                        placeholder="type in your message..."
                      />
                    </div>
                    <Button className="p-4 rounded-full bg-dark hover:bg-secondary disabled:opacity-50">
                      <PaperAirplaneIcon className="h-6 right-5 text-violet-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </main>
            <NotificationPanel open={open} />
          </div>
        </React.Fragment>
      )}
    </Disclosure>
  )
}
