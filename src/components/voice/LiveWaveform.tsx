import React, { useEffect, useRef } from 'react';

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
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>(new Array(48).fill(0));

  const SMOOTHING = 0.85;
  const MIN_HEIGHT = 0.05;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas || !ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Shift bars to the left
      barsRef.current.shift();

      const nextValue =
        isRecording && !isPaused
          ? Math.max(audioLevel, MIN_HEIGHT)
          : barsRef.current[barsRef.current.length - 1] * 0.95;

      // smooth incoming value
      const prev = barsRef.current[barsRef.current.length - 1] || 0;
      barsRef.current.push(prev * SMOOTHING + nextValue * (1 - SMOOTHING));

      const barWidth = width / barsRef.current.length;
      const centerY = height / 2;

      // Draw bars
      barsRef.current.forEach((level, index) => {
        const barHeight = level * height * 0.9;
        const x = index * barWidth;
        const y = centerY - barHeight / 2;

        ctx.fillStyle = isPaused ? '#9CA3AF' : '#6366F1';
        ctx.beginPath();
        ctx.roundRect(
          x + 1,
          y,
          barWidth - 3,
          barHeight,
          999, // capsule style
        );
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isRecording, isPaused]);

  return <canvas ref={canvasRef} width={300} height={60} className='w-full h-full' />;
};
