'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

export function Skeleton({ 
  className = '', 
  width = '100%', 
  height = '20px', 
  rounded = 'md',
  animate = true 
}: SkeletonProps) {
  const roundedClass = useMemo(() => {
    switch (rounded) {
      case 'none': return '';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case 'full': return 'rounded-full';
      default: return 'rounded-md';
    }
  }, [rounded]);

  const Component = animate ? motion.div : 'div';
  const animateProps = animate ? {
    animate: {
      opacity: [0.6, 1, 0.6],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as any,
    },
  } : {};

  return (
    <Component
      className={`bg-gray-200 ${roundedClass} ${className}`}
      style={{ width, height }}
      {...animateProps}
    />
  );
}

// Profile Card Skeleton
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      {/* Profile Image */}
      <div className="flex justify-center">
        <Skeleton width="120px" height="120px" rounded="full" />
      </div>
      
      {/* Name */}
      <div className="text-center">
        <Skeleton width="60%" height="24px" className="mx-auto mb-2" />
        <Skeleton width="40%" height="16px" className="mx-auto" />
      </div>
      
      {/* Details */}
      <div className="space-y-3">
        <Skeleton width="100%" height="16px" />
        <Skeleton width="80%" height="16px" />
        <Skeleton width="90%" height="16px" />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-4">
        <Skeleton width="60px" height="60px" rounded="full" />
        <Skeleton width="60px" height="60px" rounded="full" />
      </div>
    </div>
  );
}

// Chat Message Skeleton
export function ChatMessageSkeleton({ isOwn = false }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isOwn 
            ? 'bg-gray-200 rounded-br-md' 
            : 'bg-gray-100 rounded-bl-md'
        }`}>
          <Skeleton width="200px" height="16px" className="mb-2" />
          <Skeleton width="150px" height="12px" />
        </div>
      </div>
    </div>
  );
}

// Navigation Skeleton
export function NavigationSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
      <div className="flex justify-around">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1">
            <Skeleton width="24px" height="24px" rounded="none" />
            <Skeleton width="40px" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg">
      <Skeleton width="48px" height="48px" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="16px" />
        <Skeleton width="40%" height="14px" />
      </div>
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton width="200px" height="32px" />
        <Skeleton width="150px" height="20px" />
      </div>
      
      {/* Profile Card */}
      <ProfileCardSkeleton />
      
      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Skeleton width="80px" height="80px" rounded="full" />
        <Skeleton width="80px" height="80px" rounded="full" />
        <Skeleton width="80px" height="80px" rounded="full" />
      </div>
    </div>
  );
}

// Matches List Skeleton
export function MatchesListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
} 