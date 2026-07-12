import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
};

export function ModalWrapper({ isOpen, children, onClose }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000]">
          {/* Overlay */}
          <motion.div
            role="button"
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              console.log("ModalWrapper: Overlay clicked, closing modal");
              onClose();
            }}
          />

          {children}
        </div>
      )}
    </AnimatePresence>
  );
}
