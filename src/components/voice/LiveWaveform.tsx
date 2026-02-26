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
  console.log({ isRecording });
  console.log({ isPaused });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  // Increase number of bars for a denser look
  const barsRef = useRef<number[]>(new Array(60).fill(0));

  const SMOOTHING = 0.6; // Less smoothing for more reactive look
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

      if (isRecording && !isPaused) {
        // Shift bars to create "scrolling" effect from right to left
        barsRef.current.shift();

        const latestVal = Math.max(audioLevel, MIN_HEIGHT);
        const prev = barsRef.current[barsRef.current.length - 1] || 0;
        const smoothed = prev * SMOOTHING + latestVal * (1 - SMOOTHING);

        barsRef.current.push(smoothed);
      }

      const barWidth = width / barsRef.current.length;
      const centerY = height / 2;
      const spacing = 1.5; // Tighter spacing for WhatsApp look

      // Draw bars
      barsRef.current.forEach((level, index) => {
        // Calculate height based on level.
        // WhatsApp bars are quite tall and thin
        const barHeight = level * height * 0.8;
        const x = index * barWidth;
        const y = centerY - barHeight / 2;

        // Use WhatsApp-like colors (light gray background, blue/indigo for active)
        ctx.fillStyle = isPaused ? '#9CA3AF' : '#00a884'; // Teal green for active recording
        ctx.beginPath();
        // Use roundRect for pill-shaped bars
        ctx.roundRect(
          x + spacing,
          y,
          barWidth - spacing * 2,
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

  return <canvas ref={canvasRef} width={400} height={40} className='w-full h-full' />;
};
