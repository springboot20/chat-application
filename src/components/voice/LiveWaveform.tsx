import React, { useEffect, useRef } from "react";

interface LiveWaveformProps {
  audioLevel: number;
  isRecording: boolean;
  isPaused: boolean;
}

export const LiveWaveform: React.FC<LiveWaveformProps> = ({
  audioLevel,
  isRecording,
  isPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const ampRef = useRef<number[]>([]);
  const phaseRef = useRef(0);

  // ✅ Live values via refs — the draw loop reads these without needing to restart
  const audioLevelRef = useRef(audioLevel);
  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const SMOOTHING = 0.95;
  const MIN_HEIGHT = 0.14;
  const SAMPLE_COUNT = 120;
  const CYCLES_PER_SAMPLE = 1.2;
  const MAX_HEIGHT_RATIO = 0.85;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = container;

      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;

      const ctx = canvas.getContext("2d");
      ctx?.scale(dpr, dpr);

      if (ampRef.current.length === 0) {
        ampRef.current = new Array(SAMPLE_COUNT).fill(MIN_HEIGHT);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ✅ Single persistent loop — mounted once, never torn down by prop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      if (
        isRecordingRef.current &&
        !isPausedRef.current &&
        ampRef.current.length
      ) {
        ampRef.current.shift();

        const jitter = MIN_HEIGHT + Math.random() * 0.15;
        const latestVal = Math.max(audioLevelRef.current, jitter);
        const prev = ampRef.current[ampRef.current.length - 1] ?? MIN_HEIGHT;
        const smoothed = prev * SMOOTHING + latestVal * (1 - SMOOTHING);

        ampRef.current.push(smoothed);
        phaseRef.current += 0.35;
      }

      const centerY = height / 2;
      const samples = ampRef.current;
      const n = samples.length;

      if (n > 1) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = isPausedRef.current ? "#8696A0" : "#00a884";

        const pointsPerSample = 6;
        const totalPoints = (n - 1) * pointsPerSample;

        for (let i = 0; i <= totalPoints; i++) {
          const t = i / pointsPerSample;
          const idx = Math.floor(t);
          const frac = t - idx;
          const a0 = samples[idx];
          const a1 = samples[Math.min(idx + 1, n - 1)];
          const envelope = a0 + (a1 - a0) * frac;

          const x = (i / totalPoints) * width;
          const angle =
            (i / pointsPerSample) * Math.PI * 2 * CYCLES_PER_SAMPLE +
            phaseRef.current;
          const y =
            centerY - Math.sin(angle) * envelope * height * MAX_HEIGHT_RATIO;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
};
