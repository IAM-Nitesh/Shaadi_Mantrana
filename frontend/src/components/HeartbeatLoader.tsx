import React from 'react';
import RoyalLoader from './RoyalLoader';

interface HeartbeatLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  className?: string;
}

/**
 * @deprecated Use RoyalLoader instead. 
 * This component now acts as a wrapper for RoyalLoader to support the new themed UI.
 */
const HeartbeatLoader: React.FC<HeartbeatLoaderProps> = ({ 
  size = 'lg',
  text = 'Loading...',
  showText = true,
  className = '', 
}) => {
  return (
    <div className={className}>
      <RoyalLoader 
        size={size as any} 
        text={text} 
        showText={showText} 
      />
    </div>
  );
};

export default HeartbeatLoader;