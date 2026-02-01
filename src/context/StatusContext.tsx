import { createContext, useState, useCallback, useMemo, ReactNode, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/redux.hooks';
import { setStatusWindow } from '../features/status/status.slice';
import sanitizeHtml from 'sanitize-html';

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
  setMediaContentType: (type: MediaContentType | null) => void;
  handleStatusWindowChange: (status: StatusWindow) => void;
  handleSelectedTextBackground: (background: string) => void;
  closeMediaContent: () => void;
  MEDIA_TYPES: readonly MediaContentType[];
  MAX_CHARS: number;
  colors: typeof BACKGROUND_COLORS;
  setTextContent: React.Dispatch<React.SetStateAction<string>>;
  textContent: string;
  editorRef: React.RefObject<HTMLDivElement>;
  onContentChange: (event: React.FormEvent<HTMLDivElement> | string) => void;

  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  selectedVideoFiles: File[];
  setSelectedVideoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  activeFileIndex: number;
  activeVideoFileIndex: number;
  setActiveFileIndex: React.Dispatch<React.SetStateAction<number>>;
  setActiveVideoFileIndex: React.Dispatch<React.SetStateAction<number>>;
  captions: CaptionsType;
  setCaptions: React.Dispatch<React.SetStateAction<CaptionsType>>;
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

  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeVideoFileIndex, setActiveVideoFileIndex] = useState(0);

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

  const handleStatusWindowChange = useCallback(
    (status: StatusWindow) => {
      dispatch(setStatusWindow({ statusWindow: status }));
      setMediaContentType(null); // reset when switching window
    },
    [dispatch],
  );

  const closeMediaContent = useCallback(() => {
    setMediaContentType(null);
    setSelectedFiles([]); // Reset files on close
    setActiveFileIndex(0);
  }, []);

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
    ],
  );

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
};
