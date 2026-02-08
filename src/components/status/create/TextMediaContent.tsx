import {
  CheckIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useStatusStories } from '../../../hooks/useStatusStories';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useCallback, useState } from 'react';
import { classNames } from '../../../utils';
import ContentEditable from 'react-contenteditable';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '../../../context/ThemeContext';
import { MediaContentTypes } from './MediaContentTypes';

export default function TextMediaContent() {
  return (
    <motion.div
      initial={{
        scale: 0.85,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0.85,
        opacity: 0,
      }}
      className='flex flex-col h-full bg-gray-600/30 overflow-hidden mt-16'>
      <TextStatusTab />

      <div className='flex-1 overflow-y-auto p-4 relative mb-20 lg:mb-0'>
        <TextEditorContent />
      </div>
    </motion.div>
  );
}

const TextEditorContent = () => {
  const {
    textContent,
    onContentChange,
    selectedTextBackground,
    editorRef,
    MAX_CHARS,
    mediaContentType,
    handlePostStatus,
  } = useStatusStories();
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const { theme } = useTheme();

  const [openEmoji, setOpenEmoji] = useState(false);
  const savedRange = useRef<Range | null>(null);

  const canPostTextStatus = mediaContentType === 'text' && textContent.length > 0;

  // 1. Capture the range whenever the user stops interacting with the editor
  const handleBlur = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  // 2. The Emoji Toggle Button
  // Use onMouseDown + preventDefault so the cursor doesn't disappear
  const toggleEmojiPicker = (e: React.MouseEvent) => {
    e.preventDefault(); // This is the magic line
    setOpenEmoji((prev) => !prev);
  };

  // 3. The Refined Insert Logic
  const insertEmoji = useCallback(
    (emojiData: EmojiClickData) => {
      const element = editorRef.current;
      if (!element) return;

      // Re-focus the element so the selection API can work
      element.focus();
      const selection = window.getSelection();
      if (!selection) return;

      // Use the range we captured on blur, or the current one if still focused
      const range =
        savedRange.current || (selection.rangeCount > 0 ? selection.getRangeAt(0) : null);

      if (range) {
        range.deleteContents(); // Clear any highlighted text
        const emojiNode = document.createTextNode(emojiData.emoji);
        range.insertNode(emojiNode);

        // Move cursor to after the emoji
        const newRange = document.createRange();
        newRange.setStartAfter(emojiNode);
        newRange.collapse(true);

        selection.removeAllRanges();
        selection.addRange(newRange);

        // Update the savedRange for the next emoji
        savedRange.current = newRange;

        // Trigger state update
        onContentChange(element.textContent);
      }
    },
    [onContentChange, editorRef],
  );

  // 1. PERFORMANCE: Derive charCount directly from content to avoid extra renders
  const charCount = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    return tempDiv.textContent?.length || 0;
  }, [textContent]);

  // 2. FOCUS: Place cursor at end on initial mount
  useEffect(() => {
    const element = editorRef.current;
    if (element) {
      element.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (element.childNodes.length > 0) {
        range.setStart(element.childNodes[0], element.textContent?.length || 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [editorRef]);

  // 3. STYLING: Memoized class generators
  const textAlignClasses = useMemo(
    () =>
      ({
        left: 'text-left justify-start',
        right: 'text-right justify-end',
        center: 'text-center justify-center',
      })[textAlign],
    [textAlign],
  );

  const fontSizeClass = useMemo(() => {
    if (charCount < 50) return 'text-4xl';
    if (charCount < 100) return 'text-3xl';
    if (charCount < 150) return 'text-2xl';
    return 'text-xl';
  }, [charCount]);

  // 4. HANDLERS
  const handleContentPaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = textContent;
      const currentLength = tempDiv.textContent?.length || 0;

      if (currentLength > MAX_CHARS) {
        return;
      }

      const text = event.clipboardData.getData('text/plain');
      const remaining = MAX_CHARS - currentLength;

      if (remaining <= 0) return;

      const textToInsert = text.slice(0, remaining);
      // Uses native browser command to preserve Undo/Redo history
      document.execCommand('insertText', false, textToInsert);
    },
    [MAX_CHARS, textContent],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    const currentLength = tempDiv.textContent?.length || 0;

    const isDeletion = e.key === 'Backspace' || e.key === 'Delete';
    const isControl = e.ctrlKey || e.metaKey;
    const isNavigation = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ].includes(e.key);

    if (currentLength >= MAX_CHARS && !isDeletion && !isControl && !isNavigation) {
      e.preventDefault();
    }
  };

  const handleChange = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = event.currentTarget.innerHTML || '';
      const plainText = tempDiv.textContent || '';

      if (plainText.length > MAX_CHARS) {
        // Restore to previous valid state
        if (editorRef.current) {
          editorRef.current.innerHTML = textContent;
        }
        return;
      }

      onContentChange(event);
    },
    [onContentChange, textContent, editorRef, MAX_CHARS],
  );

  return (
    <Fragment>
      {openEmoji && (
        <div className='absolute bottom-20 left-4 z-50'>
          <EmojiPicker
            className='absolute min-w-[300px] sm:min-w-[500px]'
            searchPlaceHolder='search for emoji'
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(data) => {
              insertEmoji(data);
              setOpenEmoji(false);
            }}
          />
        </div>
      )}

      <div className='w-full max-w-2xl mx-auto relative'>
        <fieldset
          className='w-full h-[50vh] rounded-2xl flex items-center p-8 mb-4 relative overflow-hidden transition-all duration-500 shadow-xl border-4 border-white/5'
          style={{ backgroundColor: selectedTextBackground }}>
          {!textContent && (
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
              <span className='text-white/40 text-2xl font-light tracking-wide'>
                Type your status...
              </span>
            </div>
          )}

          <span
            className={classNames(
              'text-xs px-3 py-1 rounded-full border transition-all duration-300 font-nunito absolute right-4 bottom-4',
              charCount > MAX_CHARS * 0.9
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-white border-white/10 text-gray-400',
            )}>
            {charCount} / {MAX_CHARS}
          </span>

          <div
            className={classNames('w-full h-full flex flex-col justify-center', textAlignClasses)}>
            <ContentEditable
              innerRef={editorRef}
              html={textContent}
              onChange={handleChange}
              onPaste={handleContentPaste}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              tagName='div'
              className={classNames(
                'w-full text-white focus:outline-none font-bold leading-snug transition-all duration-300 drop-shadow-lg',
                textAlignClasses,
                fontSizeClass,
              )}
              style={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            />
          </div>
        </fieldset>

        {/* Toolbar */}
        <div className='flex items-center justify-between gap-4 bg-gray-900/60 backdrop-blur-md p-2 rounded-full border border-white/10'>
          <button
            onClick={toggleEmojiPicker}
            className='cursor-pointer h-8 w-8 lg:h-12 lg:w-12 shrink-0 mb-1'
            type='button'
            title='Add emoji'>
            <span className='flex items-center justify-center h-full w-full dark:bg-transparent bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors'>
              <FaceSmileIcon className='h-6 dark:text-white/60' />
            </span>
          </button>

          <div className='flex items-center gap-1'>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type='button'
                aria-pressed={textAlign === align}
                onClick={() => setTextAlign(align)}
                className={classNames(
                  'p-2.5 rounded-xl transition-all',

                  textAlign === align
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}>
                <AlignmentIcon type={align} />
              </button>
            ))}
          </div>

          <div className='flex items-center shrink-0 gap-x-3'>
            <motion.button
              key='send-button'
              title='Send message'
              type='button'
              disabled={!canPostTextStatus}
              onClick={handlePostStatus}
              initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              className={classNames(
                'p-3 rounded-full transition-colors duration-200 shadow-lg flex items-center justify-center mr-2',
                canPostTextStatus
                  ? 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed',
              )}
              whileHover={canPostTextStatus ? { scale: 1.1 } : {}}
              whileTap={canPostTextStatus ? { scale: 0.95 } : {}}>
              <PaperAirplaneIcon className='h-5 w-5' />
            </motion.button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

// Helper SVG Component
const AlignmentIcon = ({ type }: { type: 'left' | 'center' | 'right' }) => {
  const paths = {
    left: 'M3 6h18M3 12h10M3 18h18',
    center: 'M3 6h18M7 12h10M5 18h14',
    right: 'M3 6h18M11 12h10M3 18h18',
  };
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'>
      <path d={paths[type]} />
    </svg>
  );
};

const TextStatusTab = () => {
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const { closeMediaContent } = useStatusStories();

  const handleOpenColorPicker = useCallback(() => setOpenColorPicker(true), []);
  const handleCloseColorPicker = useCallback(() => setOpenColorPicker(false), []);

  return (
    <Fragment>
      <ColorModal open={openColorPicker} close={handleCloseColorPicker} />

      <header className='h-14 border-b border-gray-100 dark:border-white/5 shrink-0'>
        <div className='h-full w-full px-4 flex items-center justify-between'>
          <button
            type='button'
            className='size-8 flex items-center justify-center rounded-full justify-self-end'
            onClick={closeMediaContent}>
            <span className='sr-only'>Close panel</span>
            <XMarkIcon className='h-5 text-gray-800 dark:text-white' strokeWidth={2} />
          </button>

          <MediaContentTypes />

          <div className='flex items-center'>
            <button
              type='button'
              onClick={handleOpenColorPicker}
              className='size-10 flex items-center justify-center rounded-full bg-gray-600/30 hover:bg-gray-600/50 transition-colors'>
              <span className='sr-only'>Chose Color</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='stroke-white/60 stroke-[1.45] size-7'>
                <path d='M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z' />
                <circle cx='13.5' cy='6.5' r='.5' fill='currentColor' />
                <circle cx='17.5' cy='10.5' r='.5' fill='currentColor' />
                <circle cx='6.5' cy='12.5' r='.5' fill='currentColor' />
                <circle cx='8.5' cy='7.5' r='.5' fill='currentColor' />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </Fragment>
  );
};

const ColorModal = ({ open, close }: { open: boolean; close: () => void }) => {
  const { colors, handleSelectedTextBackground, selectedTextBackground } = useStatusStories();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as='div' onClose={close} className='fixed inset-0 z-[999]'>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'>
          <Dialog.Overlay className='fixed inset-0 bg-black/40 backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed left-0 lg:left-[30rem] right-0 overflow-hidden'>
          <div className='flex h-screen items-center justify-center px-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'>
              <Dialog.Panel className='relative max-w-md w-full rounded-xl dark:bg-gray-600/30 bg-white p-4 shadow-xl'>
                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                  <Dialog.Title className='text-sm font-semibold dark:text-white'>
                    Choose background color
                  </Dialog.Title>

                  <button
                    type='button'
                    onClick={close}
                    className='rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-500'>
                    <span className='sr-only'>Close panel</span>
                    <XMarkIcon className='w-5 h-5 dark:text-white' />
                  </button>
                </div>

                {/* Color Grid */}
                <div className='grid grid-cols-5 gap-3'>
                  {colors.map((color: string) => {
                    const isActive = selectedTextBackground === color;

                    return (
                      <button
                        key={color}
                        type='button'
                        onClick={() => {
                          handleSelectedTextBackground(color);
                          close();
                        }}
                        className={classNames(
                          'relative aspect-square rounded-full transition-transform',
                          'hover:scale-105 focus:outline-none',
                          isActive && 'ring-2 ring-offset-2 ring-offset-slate-600 ring-indigo-500',
                        )}
                        style={{ backgroundColor: color }}>
                        {isActive && (
                          <span className='absolute inset-0 flex items-center justify-center'>
                            <CheckIcon
                              className='w-5 h-5 text-white drop-shadow'
                              strokeWidth={2.5}
                            />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
