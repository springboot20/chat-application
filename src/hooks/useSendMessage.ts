import { useCallback, useState } from 'react';
import { sendRequest } from '../api';

interface SendPayload {
  chatId: string;
  data: { [key: string]: any };
  messageId?: string; // only for replies
}

/**
 * Per-file progress map: fileIndex → 0–100
 * Derived from overall upload progress weighted by each file's byte size.
 *
 * Why weighted by size?
 *   A 10MB file and a 10KB file in the same FormData upload at different
 *   real speeds. Splitting by size gives each preview a progress bar that
 *   tracks its own contribution to the total bytes sent.
 */
export type FileProgressMap = Map<number, number>;

export const useSendMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgressMap>(new Map());

  const sendMessage = useCallback(async ({ chatId, data, messageId }: SendPayload) => {
    setIsLoading(true);

    // Build per-file size weights upfront
    const files: File[] = Array.isArray(data.attachments) ? data.attachments : [];
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

    // Byte boundaries: [start, end) for each file index within the total upload
    const fileBoundaries = files.map((f, i) => {
      const start = files.slice(0, i).reduce((s, ff) => s + ff.size, 0);
      return { start, end: start + f.size };
    });

    // Initialise all files at 0%
    setFileProgress(new Map(files.map((_, i) => [i, 0])));

    try {
      const { response } = await sendRequest({
        chatId,
        data,
        messageId,
        onProgress: (overallPct) => {
          // overallPct is 0–100 of total bytes sent so far
          const bytesSent = (overallPct / 100) * totalBytes;

          setFileProgress(() => {
            const next = new Map<number, number>();

            if (files.length === 0) return next;

            fileBoundaries.forEach(({ start, end }, i) => {
              const fileBytes = end - start;
              if (fileBytes === 0) {
                next.set(i, 100);
                return;
              }
              // How many of this file's bytes have been sent?
              const fileSent = Math.min(Math.max(bytesSent - start, 0), fileBytes);
              next.set(i, Math.round((fileSent / fileBytes) * 100));
            });

            return next;
          });
        },
      });

      return response;
    } finally {
      setIsLoading(false);
      // Show 100% briefly before clearing
      setFileProgress((prev) => new Map([...prev].map(([k]) => [k, 100])));
      setTimeout(() => setFileProgress(new Map()), 800);
    }
  }, []);

  const overallProgress =
    fileProgress.size === 0
      ? 0
      : Math.round([...fileProgress.values()].reduce((s, v) => s + v, 0) / fileProgress.size);

  return {
    sendMessage,
    fileProgress, // Map<fileIndex, 0–100> — pass index to DocumentPreview
    overallProgress, // single number for e.g. UploadProgressBar
    isLoading,
  };
};
