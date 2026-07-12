import { motion } from "framer-motion";
import { ModalWrapper } from "../shared/ModalWrapper";
import { XMarkIcon } from "@heroicons/react/24/outline";

const DotLoader = () => (
  <div className="p-2 rounded-3xl w-fit inline-flex gap-1.5 bg-black/20">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1.5 w-1.5 bg-white rounded-full block"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
      />
    ))}
  </div>
);

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  info,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  info: {
    label?: string;
    title: string;
  };
  isDeleting: boolean;
}) => {
  const { label, title } = info;

  return (
    <ModalWrapper isOpen={open} onClose={onClose}>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <motion.div
          onClick={(event) => event.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg mx-auto relative border border-red-100 dark:border-red-900/30"
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#0A1E3B80] dark:text-gray-400 hover:text-[#0A1E3B] dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="size-5" />
          </button>

          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center my-5">
              <div className="size-16 rounded-full bg-[#FFEBEB] dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24.375 6.875L23.6004 19.4064C23.4024 22.608 23.3035 24.2089 22.501 25.3599C22.1041 25.9289 21.5934 26.4091 21.0009 26.77C19.8026 27.5 18.1987 27.5 14.9909 27.5C11.7789 27.5 10.1729 27.5 8.97381 26.7686C8.381 26.4071 7.87 25.926 7.47335 25.356C6.6711 24.2032 6.57431 22.6001 6.38076 19.394L5.625 6.875"
                    stroke="#F23C49"
                    strokeWidth="1.875"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3.75 6.875H26.25M20.0696 6.875L19.2164 5.11466C18.6495 3.94533 18.366 3.36065 17.8771 2.99601C17.7687 2.91513 17.6539 2.84317 17.5338 2.78087C16.9924 2.5 16.3426 2.5 15.0431 2.5C13.711 2.5 13.045 2.5 12.4946 2.79265C12.3726 2.85751 12.2562 2.93238 12.1466 3.01646C11.652 3.39588 11.3758 4.00194 10.8233 5.21407L10.0662 6.875"
                    stroke="#F23C49"
                    strokeWidth="1.875"
                    strokeLinecap="round"
                  />
                  <path
                    d="M11.875 20.625V13.125"
                    stroke="#F23C49"
                    strokeWidth="1.875"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.125 20.625V13.125"
                    stroke="#F23C49"
                    strokeWidth="1.875"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-xl font-bold font-inter text-[#EF4444] dark:text-red-400 mb-3">
              {title}
            </h2>

            {/* Body */}
            {label && (
              <p className="text-center text-sm font-nunito text-[#0A1E3B80] dark:text-gray-400 leading-relaxed">
                {label}
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-col md:flex-row md:items-center gap-5 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg border border-[#1E293B20] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base font-bold font-nunito text-colorE3B dark:text-gray-200">
                  Cancel
                </span>
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#F23C49] dark:bg-red-600 dark:hover:bg-red-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <DotLoader />
                ) : (
                  <span className="text-white font-bold font-nunito text-base">
                    Delete
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalWrapper>
  );
};
