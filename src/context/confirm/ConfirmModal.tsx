import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ConfirmModal } from "../../components/modal/Confirm";
import { createPortal } from "react-dom";

type ConfirmInfo = {
  title: string;
  label?: string;
  buttonText?: string;
};

type ConfirmOptions = ConfirmInfo & {
  onConfirm: () => Promise<void> | void;
};

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ConfirmInfo>({ title: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const onConfirmRef = useRef<(() => Promise<void> | void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    const { onConfirm, ...restInfo } = options;

    setInfo(restInfo);

    onConfirmRef.current = onConfirm;
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isDeleting) return; // prevent closing mid-action

    setOpen(false);

    onConfirmRef.current = null;
  }, [isDeleting]);

  const handleConfirm = useCallback(async () => {
    if (!onConfirmRef.current) return;

    try {
      setIsDeleting(true);

      await onConfirmRef.current();

      setOpen(false);
    } catch (error) {
      console.error("Confirm action failed:", error);
      // Keep modal open on failure so the user can retry or cancel
    } finally {
      setIsDeleting(false);
      onConfirmRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {createPortal(
        <ConfirmModal
          open={open}
          onClose={handleClose}
          onConfirm={handleConfirm}
          info={info}
          isDeleting={isDeleting}
        />,
        document.body,
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx.confirm;
};
