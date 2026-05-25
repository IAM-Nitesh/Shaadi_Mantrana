import React from 'react';

interface ProgressBarProps {
  progress: number; // from 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  // Determine color based on progress percentage
  const getProgressColor = (progress: number) => {
    if (progress < 40) return 'bg-royal-crimson';
    if (progress < 80) return 'bg-royal-gold-light';
    return 'bg-royal-gold';
  };

  const colorClass = getProgressColor(progress);

  return (
    <div className="w-full h-2 bg-royal-glass-border rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-300 ${colorClass}`} 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};

export default ProgressBar; 