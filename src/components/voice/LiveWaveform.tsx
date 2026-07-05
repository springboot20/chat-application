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

  // Amplitude history — one "envelope" sample per scroll step
  const ampRef = useRef<number[]>([]);
  const phaseRef = useRef(0);

  const SMOOTHING = 0.65;
  const MIN_HEIGHT = 0.04;

  // How many envelope samples we keep (coarse — controls scroll speed/history length)
  const SAMPLE_COUNT = 120;
  // How many oscillations of the sine carrier per envelope sample (visual density)
  const CYCLES_PER_SAMPLE = 1.3;
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

      if (isRecording && !isPaused && ampRef.current.length) {
        ampRef.current.shift();

        const jitter = MIN_HEIGHT + Math.random() * 0.15;
        const latestVal = Math.max(audioLevel, jitter);
        const prev = ampRef.current[ampRef.current.length - 1] ?? MIN_HEIGHT;
        const smoothed = prev * SMOOTHING + latestVal * (1 - SMOOTHING);

        ampRef.current.push(smoothed);

        // advance carrier phase only while actively recording, so it "flows"
        phaseRef.current += 0.35;
      }

      const centerY = height / 2;
      const samples = ampRef.current;
      const n = samples.length;

      if (n > 1) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = isPaused ? "#8696A0" : "#00a884";

        // finer resolution than the amplitude samples, for a smooth curve
        const pointsPerSample = 6;
        const totalPoints = (n - 1) * pointsPerSample;

        for (let i = 0; i <= totalPoints; i++) {
          const t = i / pointsPerSample; // fractional index into samples[]
          const idx = Math.floor(t);
          const frac = t - idx;

          const a0 = samples[idx];
          const a1 = samples[Math.min(idx + 1, n - 1)];
          const envelope = a0 + (a1 - a0) * frac; // interpolated amplitude

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
  }, [audioLevel, isRecording, isPaused]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
};
