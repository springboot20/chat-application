import { MediaContentType } from '../../../context/StatusContext';
import { useStatusStories } from '../../../hooks/useStatusStories';
import { classNames } from '../../../utils';

type MediaContentTypeButtonProps = {
  handleMediaContentTypeChange: (type: MediaContentType) => void;
  type: MediaContentType;
  isSelected: boolean;
};

export const MediaContentTypes = () => {
  const { MEDIA_TYPES, mediaContentType, setMediaContentType } = useStatusStories();

  return (
    <div className='flex items-center gap-x-3'>
      {MEDIA_TYPES.map((type) => {
        return (
          <MediaContentTypeButton
            key={type}
            type={type}
            isSelected={mediaContentType === type}
            handleMediaContentTypeChange={(type) => setMediaContentType(type)}
          />
        );
      })}
    </div>
  );
};

const MediaContentTypeButton: React.FC<MediaContentTypeButtonProps> = ({
  handleMediaContentTypeChange,
  type,
  isSelected,
}) => {
  return (
    <button
      type='button'
      className={classNames(
        'capitalize text-sm font-medium font-nunito rounded-3xl px-6 py-1.5 dark:text-white transition-colors dark:hover:bg-gray-600/30',
        isSelected && 'dark:bg-gray-600/30',
      )}
      onClick={() => handleMediaContentTypeChange(type)}>
      <span>{type}</span>
    </button>
  );
};
