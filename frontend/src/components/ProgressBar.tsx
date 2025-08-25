import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number; // from 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  // Determine color based on progress percentage
  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'red';
    if (progress < 50) return 'orange';
    if (progress < 75) return 'yellow';
    return 'green';
  };

  const color = getProgressColor(progress);

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.bar} ${styles[color]}`} 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};

export default ProgressBar; 