import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAudioBlobDuration } from '../utils/audio';

interface UseVoiceRecorderReturn {
  isRecordingCancelled: boolean;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioLevel: number; // ✅ For live waveform
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  resetRecording: () => void;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecordingCancelled, setIsRecordingCancelled] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // track audio/voice recording state
  const [isPaused, setIsPaused] = useState(false); // track audio/voice pausing state
  const [recordingTime, setRecordingTime] = useState(0); // track audio/voice recording time
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // ✅ Current audio level
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ✅ Analyze audio level for live waveform
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || (isPaused && isRecordingCancelled)) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

    setAudioLevel(normalizedLevel);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isPaused, isRecordingCancelled]);

  const startRecording = useCallback(async () => {
    try {
      setIsRecordingCancelled(false);
      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // ✅ Create audio context for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start analyzing audio
      analyzeAudio();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });

        // FIX: Don't set these to null here! We need them for the preview state.
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        const duration = await getAudioBlobDuration(blob);
        setAudioDuration(duration);

        // Cleanup hardware/streams
        streamRef.current?.getTracks().forEach((track) => track.stop());
        audioContextRef.current?.close();
      };

      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      console.log('🎙️ Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  }, [analyzeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
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

      console.log('⏹️ Recording stopped');
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setAudioLevel(0);

      console.log('⏸️ Recording paused');
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Resume audio analysis
      analyzeAudio();

      console.log('▶️ Recording resumed');
    }
  }, [isRecording, isPaused, analyzeAudio]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setAudioLevel(0);
    chunksRef.current = [];
  }, [audioUrl]);

  const cancelRecording = useCallback(() => {
    // 1. Stop the physical recorder first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // 2. Stop all mic tracks immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // 3. Clear all intervals and animation frames
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // 4. RESET ALL STATES TO INITIAL
    setIsRecording(false);
    setIsRecordingCancelled(true); // This tells the UI to hide
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null); // This is the most important line to restore the text input
    setAudioLevel(0);
    chunksRef.current = [];
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
        if (audioContextRef.current) {
          audioContextRef.current.close();
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
    audioLevel, // ✅ Export audio level
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecording,
    audioDuration,
  };
};
