import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { useStatusStories } from '../../hooks/useStatusStories';
import { Fragment, useCallback, useRef, useState } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '../../context/ThemeContext';

export default function CaptionInputComponent({
  file,
  type,
}: {
  file: File;
  type: 'image' | 'video';
}) {
  const { setCaptions, captions } = useStatusStories();
  const captionRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const [openEmoji, setOpenEmoji] = useState(false);

  const toggleEmojiPicker = (e: React.MouseEvent) => {
    e.preventDefault(); // This is the magic line
    setOpenEmoji((prev) => !prev);
  };

  const insertEmoji = useCallback(
    (emojiData: EmojiClickData, fileId: string, mediaType: 'image' | 'video') => {
      const caption = captionRef.current;
      if (!caption) return;

      const start = caption.selectionStart || 0;
      const end = caption.selectionEnd || 0;

      setCaptions((prev) => {
        const currentList = prev[mediaType] || [];
        // Check if entry exists
        const exists = currentList.find((item) => item.id === fileId);

        let newList;
        if (exists) {
          newList = currentList.map((item) => {
            if (item.id === fileId) {
              const currentText = item.text || '';
              return {
                ...item,
                text: currentText.slice(0, start) + emojiData.emoji + currentText.slice(end),
              };
            }
            return item;
          });
        } else {
          newList = [...currentList, { id: fileId, text: emojiData.emoji }];
        }

        return { ...prev, [mediaType]: newList };
      });

      // Small UX improvement: Refocus after emoji selection
      setTimeout(() => {
        caption.focus();
        caption.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
      }, 0);
    },
    [setCaptions],
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const fileId = file?.name;

    setCaptions((prev: any) => {
      const currentList = prev[type] || [];
      const exists = currentList?.find((item: any) => item.id === fileId);

      let newList;

      if (exists) {
        newList = currentList?.map((item: any) =>
          item.id === fileId ? { ...item, text: newText } : item,
        );
      } else {
        // If the entry doesn't exist in state yet, add it!
        newList = [...currentList, { id: fileId, text: newText }];
      }

      return { ...prev, [type]: newList };
    });
  };  

  return (
    <Fragment>
      {openEmoji && (
        <div className='bottom-20 absolute left-6 z-[999]'>
          <EmojiPicker
            className='absolute min-w-[300px] sm:min-w-[500px]'
            searchPlaceHolder='search for emoji'
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(data) => {
              insertEmoji(data, String(file?.name), type);
              setOpenEmoji(false);
            }}
          />
        </div>
      )}

      <div className='flex items-center justify-between bg-gray-900/60 backdrop-blur-md h-16 overflow-hidden rounded-full border border-white/10 shrink-0'>
        <Fragment>
          <button
            onClick={toggleEmojiPicker}
            className='cursor-pointer h-8 w-8 lg:h-12 lg:w-12 shrink-0 mb-1'
            type='button'
            title='Add emoji'>
            <span className='flex items-center justify-center h-full w-full dark:bg-transparent bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg transition-colors'>
              <FaceSmileIcon className='h-6 dark:text-white/60' />
            </span>
          </button>

          <input
            type='text'
            ref={captionRef}
            value={captions[type]?.find((c: any) => c.id === String(file?.name))?.text || ''}
            onChange={handleTextChange}
            placeholder='Add a caption...'
            className='flex-1 h-full bg-transparent outline-none border-none text-white focus:ring-0 px-2 py-1'
          />
        </Fragment>
      </div>
    </Fragment>
  );
}
