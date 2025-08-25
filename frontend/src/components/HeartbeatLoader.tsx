import React from 'react';
import Image from 'next/image';

interface HeartbeatLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'xxxxl' | 'xxxxxl';
  logoSize?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'xxxxl' | 'xxxxxl';
  textSize?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'xxxxl' | 'xxxxxl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const HeartbeatLoader: React.FC<HeartbeatLoaderProps> = ({ 
  size = 'xl',
  logoSize,
  textSize,
  className = '', 
  text = 'Loading...',
  showText = true 
}) => {
  // Use logoSize if provided, otherwise fall back to size
  const actualLogoSize = logoSize || size;
  // Use textSize if provided, otherwise fall back to size
  const actualTextSize = textSize || size;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
    xxl: 'w-32 h-32',
    xxxl: 'w-40 h-40',
    xxxxl: 'w-48 h-48',
    xxxxxl: 'w-56 h-56'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    xxl: 'text-xl',
    xxxl: 'text-2xl',
    xxxxl: 'text-3xl',
    xxxxxl: 'text-4xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[actualLogoSize]} animate-heartbeat`}>
        <Image
          src="/icon.svg"
          alt="Shaadi Mantrana"
          width={512}
          height={512}
          className="w-full h-full"
          priority
        />
      </div>
      {showText && (
        <p className={`mt-2 text-gray-600 font-medium ${textSizes[actualTextSize]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default HeartbeatLoader; 