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
      } else if (direction === 'left') {
        await MatchingService.passProfile(currentProfile._id);
      } else if (direction === 'up' && likesRemaining > 0) {
        const result = await MatchingService.likeProfile(currentProfile._id, 'super_like');
        setLikesRemaining(result.remainingLikes ?? Math.max(likesRemaining - 1, 0));
      }
    } catch (error) {
      logger.warn('Dashboard: swipe action failed', error);
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
      className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden"
      style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 2rem)' }}
    >
      {/* Mobile Header */}
      <div ref={headerRef} className="relative z-10 p-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
            <p className="text-sm text-gray-600">{likesRemaining} likes remaining today</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <i className="ri-logout-box-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Cards Container */}
      <div ref={cardRef} className="relative flex-1 px-4 pb-20">
        {isFetchingProfiles ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mb-4" />
            <p className="text-gray-600">Loading profiles...</p>
          </div>
        ) : currentProfile ? (
          <SwipeCard 
            profile={currentProfile} 
            onSwipe={handleSwipe}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-heart-line text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No more profiles</h3>
            <p className="text-gray-600 mb-6">Check back later for new matches!</p>
            <button
              onClick={fetchDiscoveryProfiles}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
            <button
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <i className="ri-close-line text-2xl text-gray-600"></i>
            </button>
            
            <button
              onClick={() => handleSwipe('up')}
              disabled={isAnimating || likesRemaining <= 0}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <i className="ri-star-line text-2xl text-white"></i>
            </button>
            
            <button
              onClick={() => handleSwipe('right')}
              disabled={isAnimating || likesRemaining <= 0}
              className="w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <i className="ri-heart-line text-2xl text-white"></i>
            </button>
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