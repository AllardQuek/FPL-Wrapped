'use client';

interface GradeDisplayProps {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
}

const gradeColors = {
  A: 'grade-a',
  B: 'grade-b',
  C: 'grade-c',
  D: 'grade-d',
  F: 'grade-f',
};

const gradeLabels = {
  A: 'Excellent',
  B: 'Good',
  C: 'Average',
  D: 'Below Average',
  F: 'Poor',
};

const sizes = {
  sm: 'text-4xl',
  md: 'text-6xl',
  lg: 'text-8xl',
  xl: 'text-9xl',
};

export function GradeDisplay({ grade, size = 'lg', showLabel = true, label }: GradeDisplayProps) {
  return (
    <div className="text-center">
      <div className={`font-black ${sizes[size]} ${gradeColors[grade]} animate-scale-in`}>
        {grade}
      </div>
      {showLabel && (
        <p className="text-white/60 text-lg mt-2 animate-fade-in delay-200">
          {label || gradeLabels[grade]}
        </p>
      )}
    </div>
  );
}



