import { PlusIcon, TrashIcon, XMarkIcon, PhotoIcon, PencilIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useStatusStories } from '../../../hooks/useStatusStories';
import { MediaContentTypes } from './MediaContentTypes';
import { Fragment, useCallback, useState } from 'react';
import { useObjectURL } from '../../../hooks/useObjectUrl';
import { classNames } from '../../../utils';
import { getCroppedImg } from '../../../utils/canvas';
import { getOrientation } from 'get-orientation/browser';
import Cropper from 'react-easy-crop';
import CameraViewfinder from '../CameraViewFinder';
import CaptionInputComponent from '../CaptionInputComponent';

const ORIENTATION_TO_ANGLE: Record<number, number> = {
  1: 0, // Standard orientation
  3: 180, // Upside down
  6: 90, // Rotated right
  8: -90, // Rotated left
};

export default function ImageMediaContent() {
  const {
    selectedFiles,
    setSelectedFiles,
    activeFileIndex,
    setActiveFileIndex,
    closeMediaContent,
  } = useStatusStories();

  const [viewMode, setViewMode] = useState<'gallery' | 'camera'>('gallery');
  const [cameraMode, setCameraMode] = useState<'image' | 'video'>('image');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const activeFile = selectedFiles[activeFileIndex];
  const mainPreviewUrl = useObjectURL(activeFile);
  const editingFileUrl = useObjectURL(editingIndex !== null ? selectedFiles[editingIndex] : null);

  const handleCapture = (file: File) => {
    setSelectedFiles((prev) => [...prev, file].slice(0, 6));
    setActiveFileIndex(selectedFiles.length); // Auto-focus the new capture
    setViewMode('gallery'); // Return to gallery to preview/edit
  };

  const onCropComplete = useCallback((_: any, celebratedPixels: any) => {
    setCroppedAreaPixels(celebratedPixels);
  }, []);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setSelectedFiles((prev) => {
      const combined = [...newFiles, ...prev].slice(0, 6); // Max 6 images
      return combined;
    });
    setActiveFileIndex(0); // Focus on the newest upload
  };

  const handleSaveCrop = async () => {
    if (editingIndex === null || !editingFileUrl || !croppedAreaPixels) return;

    const orientation = await getOrientation(selectedFiles[editingIndex]);
    const rotationAngle = ORIENTATION_TO_ANGLE[orientation] ?? 0;

    const croppedBlob = (await getCroppedImg({
      imageSrc: editingFileUrl,
      pixelCrop: croppedAreaPixels,
      rotation: rotationAngle,
      flip: { horizontal: true, vertical: false },
    })) as unknown as Blob;

    if (!croppedBlob) return;

    const croppedFile = new File([croppedBlob], selectedFiles[editingIndex].name, {
      type: 'image/jpeg',
    });

    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[editingIndex] = croppedFile;
      return updated;
    });

    setEditingIndex(null);
    setRotation(0);
  };

  const removeImage = useCallback(
    (index: number) => {
      setSelectedFiles((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        // Adjust active index if we deleted the current or last item
        if (activeFileIndex >= filtered.length) {
          setActiveFileIndex(Math.max(0, filtered.length - 1));
        }
        return filtered;
      });
    },
    [activeFileIndex, setActiveFileIndex, setSelectedFiles],
  );

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className='mt-16 bg-gray-600/30 h-full overflow-x-hidden overflow-auto pb-20 shadow-2xl'>
      <header className='h-14 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 font-nunito'>
        <button
          type='button'
          onClick={closeMediaContent}
          className='size-8 flex items-center justify-center rounded-full justify-self-end'>
          <XMarkIcon className='h-5 text-gray-800 dark:text-white' />
        </button>
        <MediaContentTypes />
        <div className='w-10' /> {/* Spacer for balance */}
      </header>

      <div className='p-4 space-y-4 min-h-0'>
        {/* SUB-SWITCHER: Gallery vs Camera */}
        <div className='flex justify-center'>
          <div className='flex bg-black/20 p-1 rounded-full'>
            <button
              type='button'
              onClick={() => setViewMode('gallery')}
              className={classNames(
                'px-6 py-1.5 rounded-full text-xs font-bold transition-all',
                viewMode === 'gallery' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400',
              )}>
              Gallery
            </button>
            <button
              type='button'
              onClick={() => {
                setViewMode('camera');
                setCameraMode('image');
              }}
              className={classNames(
                'px-6 py-1.5 rounded-full text-xs font-bold transition-all',
                viewMode === 'camera' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400',
              )}>
              Camera
            </button>
          </div>
        </div>

        {/* Main Preview Area */}
        <div
          className={classNames(
            'relative aspect-square w-full bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 group',
            mainPreviewUrl ? 'h-[35rem]' : 'h-[25rem]',
          )}>
          <AnimatePresence mode='wait'>
            {viewMode === 'camera' ? (
              <div className='h-full relative'>
                <CameraViewfinder mode={cameraMode} onCapture={handleCapture} />
              </div>
            ) : (
              <div className='h-full relative'>
                {mainPreviewUrl ? (
                  <Fragment>
                    <button
                      type='button'
                      onClick={() => setEditingIndex(activeFileIndex)}
                      className='absolute top-4 right-4 z-40 bg-gray-600/60 text-white backdrop-blur-md px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-x-2'>
                      Edit <PencilIcon className='size-4' />
                    </button>
                    <img
                      src={mainPreviewUrl}
                      className='h-full w-full object-contain'
                      alt='Preview'
                    />

                    {/* MOVE CAPTION INSIDE THE RELATIVE CONTAINER AND POSITION ABSOLUTE */}
                    <div className='absolute bottom-4 inset-x-0 px-4 z-30'>
                      <CaptionInputComponent file={activeFile} type='image' />
                    </div>
                  </Fragment>
                ) : (
                  <div className='h-full w-full flex flex-col items-center justify-center text-gray-400'>
                    <PhotoIcon className='h-12 w-12 mb-2 opacity-20' />
                    <p className='text-sm font-medium'>No image selected</p>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* CROPPER OVERLAY */}
        <AnimatePresence>
          {editingIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 z-50 bg-black flex flex-col'>
              <div className='relative flex-1'>
                <Cropper
                  image={editingFileUrl || ''}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={4 / 5} // Standard Social Aspect Ratio
                  onCropChange={setCrop}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className='p-6 bg-gray-900 space-y-6'>
                <div className='flex flex-col gap-2'>
                  <fieldset>
                    <label htmlFor='zoom-level' className='text-white text-xs font-nunito'>
                      Zoom
                    </label>
                    <input
                      id='zoom-level'
                      type='range'
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className='w-full'
                    />
                  </fieldset>

                  <fieldset>
                    <label htmlFor='rotation-angle' className='text-white text-xs mt-2 font-nunito'>
                      Rotation: {rotation}°
                    </label>
                    <input
                      id='rotation-angle'
                      type='range'
                      min={0}
                      max={360}
                      step={1}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className='w-full'
                    />
                  </fieldset>
                </div>

                <div className='flex gap-4'>
                  <button
                    type='button'
                    onClick={() => setEditingIndex(null)}
                    className='flex-1 py-3 text-white font-bold bg-white/10 rounded-xl'>
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={handleSaveCrop}
                    className='flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl'>
                    Apply Crop
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnail Gallery */}
        <div className='flex items-center gap-3 overflow-x-auto py-2 px-2 scrollbar-hide'>
          {/* Add More Button */}
          {selectedFiles.length < 6 && (
            <label className='flex-shrink-0 size-16 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group'>
              <PlusIcon className='size-6 text-gray-400 group-hover:text-blue-500' />
              <input type='file' hidden accept='image/*' multiple onChange={handleFileSelection} />
            </label>
          )}

          <AnimatePresence>
            {selectedFiles.map((file, idx) => (
              <FileThumbnail
                key={file.name + idx}
                file={file}
                isActive={idx === activeFileIndex}
                onSelect={() => setActiveFileIndex(idx)}
                onRemove={() => removeImage(idx)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function FileThumbnail({ file, isActive, onSelect, onRemove }: any) {
  const url = useObjectURL(file);

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={classNames(
        'relative flex-shrink-0 size-16 rounded-xl overflow-hidden cursor-pointer ring-2 transition-all',
        isActive
          ? 'ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
          : 'ring-transparent opacity-70 hover:opacity-100',
      )}
      onClick={onSelect}>
      <img src={url ? String(url) : ''} className='h-full w-full object-cover' alt='thumb' />
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className='absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-md hover:bg-red-500 transition-colors'>
        <TrashIcon className='size-3' />
      </button>
    </motion.div>
  );
}
