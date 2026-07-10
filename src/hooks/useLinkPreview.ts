import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";
import {
  LinkPreview,
  useLazyGetLinkPreviewQuery,
} from "../features/chats/chat.slice";

const URL_REGEX = /(https?:\/\/[^\s]+)/i;

export function useLinkPreview(message: string) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const previousUrl = useRef<string>("");
  const [trigger, result] = useLazyGetLinkPreviewQuery();

  const detectedUrl = useMemo(() => {
    return message?.match(URL_REGEX)?.[0] ?? null;
  }, [message]);

  const debouncedUrl = useDebounce(detectedUrl, 700);

  useEffect(() => {
    if (!debouncedUrl) {
      setPreview(null);
      previousUrl.current = "";
      return;
    }

    if (previousUrl.current === debouncedUrl) return;

    previousUrl.current = debouncedUrl;

    trigger(debouncedUrl)
      .unwrap()
      .then((res) => {
        setPreview(res.data);
      });
  }, [debouncedUrl, trigger]);

  console.log(preview);

  return {
    detectedUrl,
    // preview: result.data?.data,
    preview,
    isLoading: result.isFetching,
  };
}
