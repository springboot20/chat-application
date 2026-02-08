import { createContext, useState, useCallback, useMemo, ReactNode, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks';
import { setSelectedStatusToView, setStatusWindow } from '../features/status/status.slice';
import sanitizeHtml from 'sanitize-html';
import {
  StatusGroup,
  useAddNewMediaStatusMutation,
  useAddNewTextStatusMutation,
} from '../features/status/status.api.slice';

type StatusWindow = 'create-status' | 'view-status' | null;

const MEDIA_TYPES = ['text', 'image', 'video'] as const;
const MAX_CHARS = 500;

export type MediaContentType = (typeof MEDIA_TYPES)[number];

const BACKGROUND_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#3b82f6',
  '#14b8a6',
  '#f97316',
  '#a855f7',
];

const randomlySelectColor = () =>
  BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)];

type StatusContextValue = {
  statusWindow: StatusWindow;
  mediaContentType: MediaContentType | null;
  selectedTextBackground: string;
  MEDIA_TYPES: readonly MediaContentType[];
  MAX_CHARS: number;
  selectedStatusToView: StatusGroup | null;
  colors: typeof BACKGROUND_COLORS;
  textContent: string;
  captions: CaptionsType;
  activeVideoFileIndex: number;
  selectedVideoFiles: File[];
  selectedFiles: File[];
  activeFileIndex: number;
  activeStatusIndex: number;
  progress: number;
  isAddingNewMediaStatus: boolean;
  isAddingNewTextStatus: boolean;

  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setSelectedVideoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  editorRef: React.RefObject<HTMLDivElement>;
  setTextContent: React.Dispatch<React.SetStateAction<string>>;
  setActiveFileIndex: React.Dispatch<React.SetStateAction<number>>;
  setActiveVideoFileIndex: React.Dispatch<React.SetStateAction<number>>;
  setActiveStatusIndex: React.Dispatch<React.SetStateAction<number>>;
  setCaptions: React.Dispatch<React.SetStateAction<CaptionsType>>;
  setProgress: React.Dispatch<React.SetStateAction<number>>;

  onContentChange: (event: React.FormEvent<HTMLDivElement> | string) => void;
  setMediaContentType: (type: MediaContentType | null) => void;
  handleStatusWindowChange: (status: StatusWindow) => void;
  handleSelectedTextBackground: (background: string) => void;
  closeMediaContent: () => void;
  handlePostStatus: () => Promise<void>;
  handleSelectedStatusToView: (
    selectedStatusToView: StatusGroup | null,
    startIndex?: number,
  ) => void;
};

type CaptionEntry = {
  id: string; // Use the filename or a timestamp
  text: string;
};

type CaptionsType = {
  image?: Array<CaptionEntry>;
  video?: Array<CaptionEntry>;
};

export const StatusContext = createContext<StatusContextValue | null>(null);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const { statusWindow } = useAppSelector((state) => state.statusStories);
  const [textContent, setTextContent] = useState('');
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [mediaContentType, setMediaContentType] = useState<MediaContentType | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);

  const [addNewMediaStatus, { isLoading: isAddingNewMediaStatus }] = useAddNewMediaStatusMutation();
  const [addNewTextStatus, { isLoading: isAddingNewTextStatus }] = useAddNewTextStatusMutation();

  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeVideoFileIndex, setActiveVideoFileIndex] = useState(0);

  const { selectedStatusToView } = useAppSelector((state) => state.statusStories);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const [captions, setCaptions] = useState<CaptionsType>({
    image: [],
    video: [],
  });

  const [selectedTextBackground, setSelectedTextBackground] = useState(randomlySelectColor());

  const onContentChange = useCallback((event: React.FormEvent<HTMLDivElement> | string) => {
    const sanitizeConf = {
      allowedTags: ['b', 'i', 'a', 'p'],
      allowedAttributes: { a: ['href'] },
    };

    let rawContent = '';

    if (typeof event === 'string') {
      rawContent = event;
    } else if (event?.currentTarget) {
      // ContentEditable sends the text via textContent or innerHTML
      rawContent = event.currentTarget.textContent || '';
    }

    const sanitizedHTMLContent = sanitizeHtml(rawContent, sanitizeConf);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHTMLContent;
    const textContent = tempDiv.textContent || '';

    if (textContent.length > MAX_CHARS) {
      // Truncate to MAX_CHARS
      const truncated = textContent.slice(0, MAX_CHARS);
      setTextContent(sanitizeHtml(truncated, sanitizeConf));
      return;
    }

    setTextContent(sanitizedHTMLContent);
  }, []);

  const handleSelectedTextBackground = useCallback(
    (background: string) => setSelectedTextBackground(background),
    [],
  );

  const resetCreationState = useCallback(() => {
    setTextContent('');
    setMediaContentType(null);
    setSelectedFiles([]);
    setActiveFileIndex(0);
    setCaptions({ image: [], video: [] });
    setSelectedTextBackground(randomlySelectColor());
  }, []);

  const handleStatusWindowChange = useCallback(
    (status: StatusWindow) => {
      // If closing, clean up everything
      if (status === null) {
        resetCreationState();
        dispatch(setSelectedStatusToView({ selectedStatusToView: null }));
      }
      dispatch(setStatusWindow({ statusWindow: status }));
    },
    [dispatch, resetCreationState],
  );

  const handleSelectedStatusToView = useCallback(
    (statusGroup: StatusGroup | null, startIndex: number = 0) => {
      dispatch(setSelectedStatusToView({ selectedStatusToView: statusGroup }));
      setProgress(0);
      // Use the provided startIndex instead of always resetting to 0
      setActiveStatusIndex(startIndex);
      dispatch(setStatusWindow({ statusWindow: statusGroup ? 'view-status' : null }));
    },
    [dispatch],
  );

  const closeMediaContent = useCallback(() => {
    setMediaContentType(null);
    setSelectedFiles([]); // Reset files on close
    setActiveFileIndex(0);
  }, []);

  const handlePostStatus = useCallback(async () => {
    if (mediaContentType === 'text') {
      const payload = {
        type: mediaContentType,
        text: textContent,
        backgroundColor: selectedTextBackground,
      };

      await addNewTextStatus(payload).unwrap();
      return;
    }
    const formData = new FormData();

    const overallFiles = [...selectedFiles, ...selectedVideoFiles];

    // 1. Prepare Metadata based on your Mongoose Schema structure
    const metadata = overallFiles.map((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';

      // Find the caption for this specific file in your state
      const fileCaption = captions[type]?.find((c: any) => c.id === file.name)?.text || '';

      return {
        type: file.type.startsWith('video/') ? 'video' : 'image',
        caption: fileCaption,
        fileName: file.name, // Used by the backend to link the file to this object
      };
    });

    // 2. Append files to FormData
    overallFiles.forEach((file) => {
      formData.append('statusMedias', file);
    });

    // 3. Append the metadata as a string
    formData.append('metadata', JSON.stringify(metadata));

    try {
      await addNewMediaStatus(formData).unwrap();

      await Promise.all([
        Promise.resolve(setTimeout(() => resetCreationState(), 2500)),
        Promise.resolve(setTimeout(() => handleStatusWindowChange(null), 3000)),
      ]);
    } catch (error) {
      console.error('Upload failed', error);
    }
  }, [
    addNewMediaStatus,
    addNewTextStatus,
    captions,
    mediaContentType,
    selectedFiles,
    selectedTextBackground,
    selectedVideoFiles,
    textContent,
    handleStatusWindowChange,
  ]);

  const value = useMemo<StatusContextValue>(
    () => ({
      statusWindow,
      mediaContentType,
      selectedTextBackground,
      setMediaContentType,
      handleStatusWindowChange,
      handleSelectedTextBackground,
      closeMediaContent,
      MEDIA_TYPES,
      setTextContent,
      textContent,
      editorRef,
      colors: BACKGROUND_COLORS,
      onContentChange,

      selectedFiles,
      setSelectedFiles,
      activeFileIndex,
      setActiveFileIndex,
      setCaptions,
      captions,
      selectedVideoFiles,
      setSelectedVideoFiles,

      activeVideoFileIndex,
      setActiveVideoFileIndex,

      MAX_CHARS,
      handlePostStatus,
      handleSelectedStatusToView,
      selectedStatusToView,
      activeStatusIndex,
      setActiveStatusIndex,
      progress,
      setProgress,
      isAddingNewMediaStatus,
      isAddingNewTextStatus,
    }),
    [
      statusWindow,
      mediaContentType,
      selectedTextBackground,
      handleStatusWindowChange,
      handleSelectedTextBackground,
      closeMediaContent,
      textContent,
      onContentChange,
      selectedFiles,
      activeFileIndex,
      captions,
      selectedVideoFiles,
      setSelectedVideoFiles,

      activeVideoFileIndex,
      setActiveVideoFileIndex,
      handlePostStatus,
      handleSelectedStatusToView,
      selectedStatusToView,
      activeStatusIndex,
      setActiveStatusIndex,
      progress,
      setProgress,
      isAddingNewMediaStatus,
      isAddingNewTextStatus,
    ],
  );

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
};
