import React from 'react';

interface ProgressBarProps {
  progress: number; // from 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  // Determine color based on progress percentage
  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const colorClass = getProgressColor(progress);

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-300 ${colorClass}`} 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};

export default ProgressBar; 