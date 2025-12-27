'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'green' | 'pink' | 'yellow' | 'white';
  height?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  delay?: number;
}

const colorClasses = {
  green: 'bg-[#00ff87]',
  pink: 'bg-[#e90052]',
  yellow: 'bg-yellow-400',
  white: 'bg-white',
};

const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  color = 'green',
  height = 'md',
  showValue = true,
  label,
  delay = 0,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.min(100, Math.max(0, value)));
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2 text-sm">
          {label && <span className="text-white/60">{label}</span>}
          {showValue && <span className="text-white font-medium">{value.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full ${heightClasses[height]} overflow-hidden`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}



