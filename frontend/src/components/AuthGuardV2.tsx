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
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      console.log('⏳ AuthGuardV2: Loading authentication status...');
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated && mounted) {
      const isLoginPage = pathname === '/' || pathname === '/login';
      if (!isLoginPage) {
        console.warn('🚫 AuthGuardV2: Not authenticated, redirecting to login');
        router.replace('/login');
      }
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

    // Short-circuit for Admin role - Admins are exempt from profile completeness checks
    if (user?.role === 'admin') {
      console.log('👑 AuthGuardV2: Admin authority recognized. Bypassing completeness checks.');
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

    // (Removed strict redirectTo enforcement. Protected pages manage their own access.)

    console.log('✅ AuthGuardV2: User authorized to access page');
  }, [isAuthenticated, isLoading, user, requiredRole, requiresCompleteProfile, redirectTo, router, pathname, mounted]);

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted) return null;

  // Show loading state ONLY during the active check
  if (isLoading) {
    return (
      <RoyalLoader
        variant="grand"
        size="xl"
        fullScreen
        text="Verifying Majestic Authority..."
      />
    );
  }

  // If not authenticated, the useEffect will handle redirect. 
  // Return null to avoid showing a "flash" of content or a stuck loader.
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};
