'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import RoyalLoader from './RoyalLoader';

interface AuthGuardV2Props {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  requiresCompleteProfile?: boolean;
}

export const AuthGuardV2: React.FC<AuthGuardV2Props> = ({ 
  children, 
  requiredRole, 
  requiresCompleteProfile = false 
}) => {
  const { user, isAuthenticated, isLoading, redirectTo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      console.log('⏳ AuthGuardV2: Loading authentication status...');
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      console.warn('🚫 AuthGuardV2: Not authenticated, redirecting to login');
      router.replace('/');
      return;
    }

    // Check role requirement
    if (requiredRole && user?.role !== requiredRole) {
      console.warn(`🚫 AuthGuardV2: Role mismatch. Required: ${requiredRole}, Got: ${user?.role}`);
      
      // Redirect based on user's actual role
      if (user?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/profile');
      }
      return;
    }

    // Enforce profile completion for dashboard and matches pages (business rule)
    const currentPath = pathname || '';
    const requiresFullProfile = currentPath.includes('/dashboard') || currentPath.includes('/matches');
    
    if (requiresFullProfile && user && (user?.profileCompleteness ?? 0) < 100) {
      console.warn(`🚫 AuthGuardV2: Access to ${currentPath} requires 100% profile completion (current: ${user?.profileCompleteness ?? 0}%)`);
      router.replace('/profile');
      return;
    }

    // Check profile completeness requirement passed via prop
    if (requiresCompleteProfile && user && (user?.profileCompleteness ?? 0) < 100) {
      console.warn('📝 AuthGuardV2: Profile incomplete, redirecting to profile page');
      router.replace('/profile');
      return;
    }

    // Check if user needs to be redirected based on auth state
    if (redirectTo && pathname !== redirectTo && !pathname?.includes('/admin')) {
      console.log(`🔀 AuthGuardV2: Redirecting to ${redirectTo}`);
      router.replace(redirectTo);
      return;
    }

    console.log('✅ AuthGuardV2: User authorized to access page');
  }, [isAuthenticated, isLoading, user, requiredRole, requiresCompleteProfile, redirectTo, router, pathname]);

  // Show loading state
  if (isLoading || !isAuthenticated) {
    return (
      <RoyalLoader
        variant="grand"
        size="xl"
        fullScreen
        text="Verifying Majestic Authority..."
      />
    );
  }

  // Render protected content
  return <>{children}</>;
};
