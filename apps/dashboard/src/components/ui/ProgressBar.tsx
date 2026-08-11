import React from 'react';

interface ProgressBarProps {
  value: number; // 0 - 100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full h-1.5 bg-[#db4942]/15 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-[#db4942] transition-all duration-300 rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
