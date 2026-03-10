import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className='flex space-x-2 w-full h-screen fixed inset-0 bg-zinc-700/50 z-50 justify-center items-center'>
      <div aria-label='Loading...' role='status'>
        <svg className='h-12 w-12 animate-spin' viewBox='3 3 18 18'>
          <path
            className='fill-white'
            d='M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z'></path>
          <path
            className='fill-secondary'
            d='M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z'></path>
        </svg>
      </div>
    </div>
  );
};

export const LinearProgress: React.FC<{ progress: number; color?: string }> = ({
  progress,
  color = '#25d366',
}) => (
  <div className='w-full h-0.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mt-1'>
    <div
      className='h-full rounded-full transition-all duration-200'
      style={{ width: `${progress}%`, backgroundColor: color }}
    />
  </div>
);

export const ProgressRing: React.FC<{
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}> = ({
  progress,
  size = 44,
  strokeWidth = 3,
  color = '#25d366',
  bgColor = 'rgba(255,255,255,0.25)',
  children,
}) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className='relative flex items-center justify-center'
      style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className='-rotate-90 absolute inset-0'>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>
      <div className='relative z-10 flex items-center justify-center'>{children}</div>
    </div>
  );
};
