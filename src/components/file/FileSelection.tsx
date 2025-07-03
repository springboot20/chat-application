import { Disclosure, Transition } from "@headlessui/react";
import { DocumentIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useRef } from "react";

type FileTypes = "document-file" | "image-file";

interface FileSelectionProps {
  onSelectionClick?: (type: FileTypes) => void;
  close: (focusableElement?: HTMLElement | React.MutableRefObject<HTMLElement | null>) => void;
  open?: boolean;
  documentInputRef: React.MutableRefObject<HTMLInputElement | null>;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
  handleFileChange: (
    fileType: "document-file" | "image-file",
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

export const FileSelection: React.FC<FileSelectionProps> = ({
  imageInputRef,
  documentInputRef,
  handleFileChange,
  close,
  open,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleCloseFileMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".file-menu")) {
        close();
      }
    };

    document.addEventListener("mousedown", handleCloseFileMenu);

    return () => document.removeEventListener("mousedown", handleCloseFileMenu);
  }, [close]);

  // console.log(open)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image files selected:", event.target.files);
    handleFileChange("image-file", event);
    close();
  };
  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Document files selected:", event.target.files);
    handleFileChange("document-file", event);
    close();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Disclosure.Panel as="div" className="bottom-20 absolute left-8 z-50 file-menu" ref={ref}>
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div className=" mt-4 min-w-[250px] w-full origin-top-right rounded-md bg-white dark:bg-gray-900 dark:ring-white/15 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="w-full dark:hover:bg-white/5 px-3 py-2">
              <input
                hidden
                multiple
                type="file"
                id="image-files"
                accept="image/*"
                max={5}
                ref={imageInputRef}
                onChange={handleImageChange}
              />
              <label htmlFor="image-files">
                <div className="flex items-center gap-3">
                  <PhotoIcon className="h-6 dark:stroke-white" />
                  <span className="font-nunito font-medium text-sm sm:text-base lg:text-lg dark:text-white">
                    Upload Image
                  </span>
                </div>
              </label>
            </div>

            <div className="w-full dark:hover:bg-white/5 px-3 py-2">
              <input
                hidden
                multiple
                type="file"
                id="document-files"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                max={5}
                ref={documentInputRef}
                onChange={handleDocumentChange}
              />
              <label htmlFor="document-files">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-6 dark:stroke-white" />
                  <span className="font-nunito font-medium text-sm sm:text-base lg:text-lg dark:text-white">
                    Document
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Transition.Child>
      </Disclosure.Panel>
    </Transition.Root>
  );
};
