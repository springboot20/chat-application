import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getAudioBlobDuration } from "../utils/audio";

interface UseVoiceRecorderReturn {
  isRecordingCancelled: boolean;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioLevel: number; // For live waveform
  drag: { x: number; y: number }; // ✅ Drag progress for mic UI
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  resetRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  setDrag: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  durationRef: React.MutableRefObject<number>;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecordingCancelled, setIsRecordingCancelled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // ✅ For drag-following mic
  const [drag, setDrag] = useState({ x: 0, y: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const pendingCancelRef = useRef(false);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const durationRef = useRef(0);

  // ✅ Analyze audio level for live waveform
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || isPaused) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average =
      dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    setAudioLevel(normalizedLevel);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isPaused]);

  const startRecording = useCallback(async () => {
    try {
      setIsRecordingCancelled(false);
      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // ✅ If cancelled while permission/setup was pending, tear down immediately
      if (pendingCancelRef.current) {
        pendingCancelRef.current = false;
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      // Setup AudioContext for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      analyzeAudio();

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onpause = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm;codecs=opus",
        });

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        const duration = await getAudioBlobDuration(blob);
        setAudioDuration(duration);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm;codecs=opus",
        });

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        const duration = await getAudioBlobDuration(blob);
        durationRef.current = duration;
        setAudioDuration(duration);

        // Cleanup
        streamRef.current?.getTracks().forEach((t) => t.stop());

        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          try {
            await audioContextRef.current.close();
          } catch (e) {
            console.warn("AudioContext already closed or closing", e);
          }
        }

        stopResolverRef.current?.(blob); // ✅ signal "blob is actually ready"
        stopResolverRef.current = null;
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      console.log("🎙️ Recording started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  }, [analyzeAudio]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        stopResolverRef.current = resolve;
        mediaRecorderRef.current.stop();

        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        // Nothing actually started yet — flag it so the pending stream gets killed
        pendingCancelRef.current = true;
        resolve(audioBlob);
      }
    });
  }, [audioBlob]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setAudioLevel(0);

      console.log("⏸️ Recording paused");
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && !isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Resume audio analysis
      analyzeAudio();

      console.log("▶️ Recording resumed");
    }
  }, [isRecording, isPaused, analyzeAudio]);

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setAudioLevel(0);

    chunksRef.current = [];
    setDrag({ x: 0, y: 0 });
  }, [audioUrl]);

  const cancelRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      pendingCancelRef.current = true; // If recording hasn't started yet, flag it to cancel when it does
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);

    setIsRecording(false);
    setIsRecordingCancelled(true);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioLevel(0);
    chunksRef.current = [];
    setDrag({ x: 0, y: 0 });
    console.log("❌ Recording cancelled");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          audioContextRef.current.close().catch((err) => {
            console.warn("Error closing AudioContext on unmount:", err);
          });
        }
      } catch (error) {
        console.log(error);
      }
    };
  }, [audioUrl]);

  return {
    isRecordingCancelled,
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    audioLevel,
    audioDuration,
    drag,
    setDrag, // ✅ Expose drag state for UI
    startRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecording,
    stopRecording,
    durationRef
  };
};
