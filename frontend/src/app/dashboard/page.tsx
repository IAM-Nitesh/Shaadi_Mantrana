'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuardV2 } from '../../components/AuthGuardV2';
import { useAuth } from '../../contexts/AuthContext';
// Navigation is now handled globally in layout.tsx
import SwipeCard from './SwipeCard';
import { safeGsap } from '../../components/SafeGsap';
import { DiscoveryProfile, MatchingService } from '../../services/matching-service';
import logger from '../../utils/logger';
import posthog from 'posthog-js';
import RoyalLoader from '../../components/RoyalLoader';
import ToastService from '../../services/toastService';
import { Icon } from '../../components/IconSystem';
import { RippleButton } from '../../components/RippleButton';

function DashboardContent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [likesRemaining, setLikesRemaining] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(true);
  
  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    logger.info('Dashboard: logging out');
    await logout();
  };

  const fetchDiscoveryProfiles = async () => {
    try {
      setIsFetchingProfiles(true);
      const discovery = await MatchingService.getDiscoveryProfiles(1, 20);
      setProfiles(discovery.profiles || []);
      setLikesRemaining(discovery.remainingLikes || 0);
      setCurrentProfileIndex(0);
    } catch (error) {
      logger.error('Dashboard: failed to fetch discovery profiles', error);
      setProfiles([]);
      setLikesRemaining(0);
    } finally {
      setIsFetchingProfiles(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryProfiles();
  }, []);

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile?._id) {
      setIsAnimating(false);
      return;
    }
    
    try {
      if (direction === 'right' && likesRemaining > 0) {
        const result = await MatchingService.likeProfile(currentProfile._id, 'like');
        setLikesRemaining(result.remainingLikes ?? Math.max(likesRemaining - 1, 0));
        posthog.capture('profile_swiped', { action: 'like', likes_remaining: result.remainingLikes });
        // Fact: Royal feedback (Action 254)
        ToastService.success('Sacred interest preserved');
      } else if (direction === 'left') {
        await MatchingService.passProfile(currentProfile._id);
        posthog.capture('profile_swiped', { action: 'pass' });
      } else if (direction === 'up' && likesRemaining > 0) {
        const result = await MatchingService.likeProfile(currentProfile._id, 'super_like');
        setLikesRemaining(result.remainingLikes ?? Math.max(likesRemaining - 1, 0));
        posthog.capture('profile_swiped', { action: 'super_like', likes_remaining: result.remainingLikes });
        // Fact: Royal feedback (Action 254)
        ToastService.success('Sacred interest preserved');
      }
    } catch (error) {
      logger.warn('Dashboard: swipe action failed', error);
      posthog.captureException(error);
    }
    
    // Move to next profile
    setTimeout(() => {
      setCurrentProfileIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  // GSAP animations
  useEffect(() => {
    if (!containerRef.current || !headerRef.current || !cardRef.current) return;

    try {
      // Set initial states
      safeGsap.set?.([headerRef.current, cardRef.current], {
        opacity: 0,
        y: 30
      });

      // Animate elements in
      const tl = safeGsap.timeline?.();
      if (!tl) return;

      tl.to?.(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      })
      .to?.(cardRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.3");

    } catch (error) {
      console.error('❌ Dashboard: Animation error:', error);
    }
  }, []);

  if (!user) {
    return null;
  }

  const currentProfile = profiles[currentProfileIndex];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-royal-obsidian relative overflow-hidden"
      style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 2rem)' }}
    >
      {/* Subtle gold gradient background - no moving mandala */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)]" />
      {/* Mobile Header */}
      <div ref={headerRef} className="relative z-10 p-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-royal-gold">Discovery</h1>
          </div>
        </div>
      </div>

      {/* Swipe Cards Container */}
      <div ref={cardRef} className="relative flex-1 px-4 pb-20">
        {isFetchingProfiles ? (
          <div className="flex flex-col items-center justify-center h-96 w-full px-4">
            <RoyalLoader variant="skeleton" className="w-full max-w-sm h-[60vh] rounded-[2rem]" />
          </div>
        ) : currentProfile ? (
          <SwipeCard 
            profile={currentProfile} 
            onSwipe={handleSwipe}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center relative z-10">
            <div className="w-24 h-24 bg-royal-gold/10 border-2 border-royal-gold rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <Icon name="ri-heart-line" size="3xl" className="text-royal-gold" />
            </div>
            <h3 className="text-2xl font-playfair font-bold text-royal-gold mb-2">Majestic Journey Pause</h3>
            <p className="text-royal-gold-light/60 mb-8 max-w-xs font-inter">Your royal connections are being curated. Check back soon for new matches!</p>
            <button
              onClick={fetchDiscoveryProfiles}
              className="px-8 py-3 bg-royal-gold text-royal-obsidian font-bold rounded-full shadow-lg hover:bg-royal-gold-light transition-all duration-300"
            >
              Refresh Profiles
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentProfile && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center space-x-4">
            {/* Close Button (Pass - Left Swipe) */}
            <RippleButton
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              hapticFeedback="medium"
              className="w-16 h-16 bg-royal-glass border border-royal-glass-border rounded-full shadow-lg flex items-center justify-center hover:bg-royal-glass/20 transition-all duration-300 disabled:opacity-50"
            >
              <Icon name="ri-close-line" size="xl" className="text-royal-gold" />
            </RippleButton>
            
            {/* Heart Button (Like - Right Swipe) */}
            <RippleButton
              onClick={() => handleSwipe('right')}
              disabled={isAnimating || likesRemaining <= 0}
              hapticFeedback="medium"
              className="w-16 h-16 bg-royal-glass border border-royal-glass-border rounded-full shadow-lg flex items-center justify-center hover:bg-royal-glass/20 transition-all duration-300 disabled:opacity-50"
            >
              <Icon name="ri-heart-line" size="xl" className="text-royal-gold" />
            </RippleButton>
          </div>
        </div>
      )}

      {/* Bottom Navigation is handled globally in layout.tsx */}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuardV2 requiresCompleteProfile={false}>
      <DashboardContent />
    </AuthGuardV2>
  );
}