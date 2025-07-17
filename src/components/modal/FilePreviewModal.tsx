import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { classNames } from "../../utils";
import { DocumentPreview } from "../file/DocumentPreview";
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChatMessageInterface } from "../../types/chat";

type MessageFiles = {
  url: string;
  localPath: string;
  _id: string;
  type?: string;
}[];

interface FilePreviewModalProps {
  handleCloseModal: () => void;
  open: boolean;
  messageFiles: MessageFiles;
  message: ChatMessageInterface;
  handleNextImage: () => void;
  handleImageChange: (index: number) => void;
  handlePreviousImage: () => void;
  currentMessageImageIndex: number;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  handleCloseModal,
  open,
  messageFiles,
  message,
  handleNextImage,
  handleImageChange,
  handlePreviousImage,
  currentMessageImageIndex,
}) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={() => handleCloseModal()}>
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
          <button
            className="absolute top-4 right-4 z-[100] p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            onClick={handleCloseModal}
            aria-label="Close preview"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>

          {messageFiles.length > 1 && !message.isDeleted && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-60 flex items-center justify-center rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 transition-colors"
                onClick={handlePreviousImage}
                aria-label="Previous image"
              >
                <ArrowLeftIcon className="h-6 w-6 text-white" />
              </button>

              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-60 flex items-center justify-center rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 transition-colors"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                <ArrowRightIcon className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
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
                className="relative transform overflow-x-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-full sm:max-w-xl sm:p-6 h-full"
                style={{
                  overflow: "inherit",
                }}
              >
                <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6 w-full">
                  <div className="w-full max-h-[80vh] flex items-center justify-center">
                    <DocumentPreview
                      attachment={messageFiles[currentMessageImageIndex]}
                      index={currentMessageImageIndex}
                      isModal={true}
                    />
                  </div>

                  {messageFiles.length > 1 && (
                    <div className="flex items-center gap-3 pb-2">
                      {messageFiles.map((file, index) => (
                        <button
                          key={file._id}
                          onClick={() => handleImageChange(index)}
                          className={classNames(
                            "h-24 w-24 rounded overflow-hidden transition-all flex-shrink-0",
                            index === currentMessageImageIndex
                              ? "ring-2 ring-white scale-110"
                              : "hover:scale-105 opacity-70 hover:opacity-100"
                          )}
                          aria-label={`View attachment ${index + 1}`}
                        >
                          <DocumentPreview attachment={file} index={index} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
