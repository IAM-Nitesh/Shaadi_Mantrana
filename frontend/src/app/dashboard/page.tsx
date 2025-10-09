'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuardV2 } from '../../components/AuthGuardV2';
import { useAuth } from '../../contexts/AuthContext';
// Navigation is now handled globally in layout.tsx
import SwipeCard from './SwipeCard';
import { safeGsap } from '../../components/SafeGsap';

// Mock profile data for demonstration
const mockProfiles = [
  {
    _id: '1',
    profile: {
      name: 'Priya Sharma',
      age: 28,
      profession: 'Software Engineer',
      images: '/api/placeholder/400/600',
      about: 'Love traveling, reading books, and exploring new cuisines. Looking for someone who shares similar interests.',
      interests: ['Travel', 'Reading', 'Cooking', 'Photography'],
      education: 'B.Tech Computer Science',
      nativePlace: 'Mumbai, India',
      currentResidence: 'Mumbai, India'
    },
    verification: {
      isVerified: true
    }
  },
  {
    _id: '2',
    profile: {
      name: 'Arjun Singh',
      age: 30,
      profession: 'Doctor',
      images: '/api/placeholder/400/600',
      about: 'Passionate about helping others. Love music, sports, and good conversations.',
      interests: ['Music', 'Sports', 'Medicine', 'Travel'],
      education: 'MBBS',
      nativePlace: 'Delhi, India',
      currentResidence: 'Delhi, India'
    },
    verification: {
      isVerified: true
    }
  },
  {
    _id: '3',
    profile: {
      name: 'Sneha Patel',
      age: 26,
      profession: 'Marketing Manager',
      images: '/api/placeholder/400/600',
      about: 'Creative soul who loves art, dance, and making a difference in the world.',
      interests: ['Art', 'Dance', 'Marketing', 'Social Work'],
      education: 'MBA Marketing',
      nativePlace: 'Bangalore, India',
      currentResidence: 'Bangalore, India'
    },
    verification: {
      isVerified: true
    }
  }
];

function DashboardContent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profiles, setProfiles] = useState(mockProfiles);
  const [likesRemaining, setLikesRemaining] = useState(20);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    console.log('🚪 Dashboard: Logging out...');
    await logout();
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (direction === 'right' && likesRemaining > 0) {
      setLikesRemaining(prev => prev - 1);
      console.log('❤️ Liked profile:', profiles[currentProfileIndex]?.name);
    } else if (direction === 'left') {
      console.log('👎 Passed profile:', profiles[currentProfileIndex]?.name);
    } else if (direction === 'up') {
      console.log('⭐ Super liked profile:', profiles[currentProfileIndex]?.name);
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
        {currentProfile ? (
          <SwipeCard 
            profile={currentProfile} 
            onSwipe={handleSwipe}
            isAnimating={isAnimating}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-heart-line text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No more profiles</h3>
            <p className="text-gray-600 mb-6">Check back later for new matches!</p>
            <button
              onClick={() => setCurrentProfileIndex(0)}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Over
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