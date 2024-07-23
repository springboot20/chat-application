import { Button } from '../buttons/Buttons'
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import EmojiPicker from 'emoji-picker-react'

export const MessageInputNavigation: React.FC<{
  setAttachmentFiles: React.Dispatch<React.SetStateAction<File[] | undefined>>
}> = ({ setAttachmentFiles }) => {
  return (
    <div className="h-full z-10 p-4 flex items-center justify-between mx-auto max-w-8xl">
      <input
        hidden
        multiple
        type="file"
        id="files"
        max={5}
        onChange={(event) => {
          if (event.target.files) {
            setAttachmentFiles([...event.target.files])
          }
        }}
      />
      <label htmlFor="files" className="mr-4">
        <PaperClipIcon className="cursor-pointer w-10 h-10 fill-none stroke-gray-400 dark:stroke-white hover:stroke-gray-700 transition" />
      </label>
      <EmojiPicker open={false} />
      <input
        id="message-input"
        type="text"
        className="relative block px-4 py-3.5 focus:outline-none hover:border-indigo-400 rounded-md border-gray-600/30 border-2 w-full"
        placeholder="Type a message..."
      />
      <Button className="shadow-none">
        <PaperAirplaneIcon
          aria-hidden={true}
          className="h-12 text-violet-500"
        />
      </Button>
    </div>
  )
}
