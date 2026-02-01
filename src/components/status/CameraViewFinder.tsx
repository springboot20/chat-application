import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils';

interface CameraProps {
  onCapture: (file: File) => void;
  mode: 'image' | 'video';
}

export default function CameraViewfinder({ onCapture, mode }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // ✅ Use ref instead

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializing, setIsInitializing] = useState(true);

  const initCamera = useCallback(async () => {
    // ✅ Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsInitializing(true);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      });

      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      // TODO: Show user-friendly error message
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, mode]);

  // ✅ Only run when facingMode or mode changes
  useEffect(() => {
    initCamera();

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [facingMode, initCamera, mode]); // ✅ Removed initCamera and stream from deps

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    setSeconds(0);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      onCapture(new File([blob], `vid_${Date.now()}.mp4`, { type: 'video/mp4' }));
      stopTimer();
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    // ✅ Fixed timer logic
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (next >= 30) {
          stopRecording(); // Auto-stop at 30s
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      // Un-mirror for the saved file
      ctx?.translate(canvas.width, 0);
      ctx?.scale(-1, 1);
    }

    ctx?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        }
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <div className='relative h-full w-full bg-black overflow-hidden'>
      {/* ✅ Show loading state */}
      {isInitializing && (
        <div className='absolute inset-0 flex items-center justify-center bg-black z-50'>
          <div className='text-white text-sm'>Initializing camera...</div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
      />

      {/* Recording Indicator & Timer */}
      {isRecording && (
        <div className='absolute top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-black/50 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10'>
          <div className='relative flex items-center justify-center'>
            <div className='size-3 bg-red-600 rounded-full animate-ping absolute' />
            <div className='size-3 bg-red-500 rounded-full relative' />
          </div>
          <span className='text-white font-nunito font-bold tabular-nums'>
            {formatTime(seconds)} / 0:30
          </span>
        </div>
      )}

      <div className='absolute bottom-10 inset-x-0 flex items-center justify-evenly z-50'>
        <button
          type='button'
          onClick={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
          className='p-3 bg-white/10 backdrop-blur-md rounded-full text-white'
          aria-label='Switch camera'>
          <ArrowPathIcon className='size-6' />
        </button>

        <button
          type='button'
          onMouseDown={mode === 'video' ? startRecording : undefined}
          onMouseUp={mode === 'video' ? stopRecording : undefined}
          onTouchStart={mode === 'video' ? startRecording : undefined}
          onTouchEnd={mode === 'video' ? stopRecording : undefined}
          onClick={mode === 'image' ? capturePhoto : undefined}
          className={classNames(
            'size-20 rounded-full border-4 transition-all flex items-center justify-center',
            isRecording ? 'border-red-500 scale-110 bg-red-500/20' : 'border-white',
          )}
          aria-label={mode === 'image' ? 'Capture photo' : 'Record video'}>
          <div
            className={classNames(
              'transition-all',
              mode === 'image'
                ? 'size-14 bg-white rounded-full'
                : isRecording
                  ? 'size-8 bg-red-500 rounded-sm'
                  : 'size-14 bg-red-500 rounded-full',
            )}
          />
        </button>

        <div className='size-12' />
      </div>
    </div>
  );
}
