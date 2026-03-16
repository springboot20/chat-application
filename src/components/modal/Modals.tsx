const DeleteModal: React.FC<{
  open: boolean;
  onClose: () => void;
  handleDelete: () => Promise<void>;
  deleteProductLoading: boolean;
  productDeleted: boolean;
}> = ({ open, onClose, handleDelete, deleteProductLoading, productDeleted }) => {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog open={open} onClose={onClose} className="w-full relative z-30 " as="div">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Backdrop className="fixed inset-0 z-10 bg-gray-500 bg-opacity-75 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="flex h-screen items-center justify-center">
                <Dialog.Panel className="bg-white relative max-w-md w-full flex flex-col space-y-2 p-4">
                  <button
                    onClick={onClose}
                    className="h-12 w-12 flex items-center justify-center absolute top-0 right-0"
                  >
                    <span className="sr-only">Close modal</span>
                    <XCircleIcon className="h-5 text-[#758E95]" strokeWidth={2.5} />
                  </button>
                  <Dialog.Title as="h1" className="text-xl font-bold text-red-500">
                    Delete Product
                  </Dialog.Title>
                  <div className="text-center">
                    <Dialog.Title as="h3" className="font-normal text-base text-red-500">
                      Are you sure you want to delete this product?
                    </Dialog.Title>
                    <Dialog.Description className="mt-3 text-[#413F3F] font-normal text-sm sm:text-base">
                      Deleting this product means it will be permanently removed from products
                      collections and cannot be recovered
                    </Dialog.Description>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="filled"
                      color="red"
                      disabled={deleteProductLoading}
                      onClick={async () => {
                        await handleDelete();
                        if (productDeleted) {
                          setTimeout(() => onClose(), 2000);
                        }
                      }}
                      className="flex items-center gap-2 rounded px-2"
                      placeholder={undefined}
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    >
                      {deleteProductLoading ? (
                        <span>deleting product...</span>
                      ) : (
                        <>
                          <TrashIcon className="h-5 w-5 text-white" />
                          <span>delete product</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="filled"
                      color="indigo"
                      onClick={onClose}
                      className="flex items-center gap-2 rounded px-2"
                      placeholder={undefined}
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    >
                      <XCircleIcon className="h-5 w-5" />
                      <span>cancel delete</span>
                    </Button>
                  </div>
                </Dialog.Panel>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
