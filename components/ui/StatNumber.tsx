'use client';

import { useEffect, useState } from 'react';

interface StatNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  positive?: boolean; // true = green for positive, red for negative
}

export function StatNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
  className = '',
  positive,
}: StatNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = displayValue.toFixed(decimals);
  
  let colorClass = '';
  if (positive !== undefined) {
    if (value > 0) colorClass = positive ? 'text-[#00ff87]' : 'text-[#e90052]';
    else if (value < 0) colorClass = positive ? 'text-[#e90052]' : 'text-[#00ff87]';
  }

  return (
    <span className={`${className} ${colorClass} tabular-nums`}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}



