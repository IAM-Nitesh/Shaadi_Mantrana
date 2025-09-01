'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SwipeCard from './SwipeCard';
import FilterModal, { FilterState } from './FilterModal';
import { ProfileService, Profile } from '../../services/profile-service';
import { MatchingService, type DiscoveryProfile } from '../../services/matching-service';
import { matchesCountService } from '../../services/matches-count-service';
import { ImageUploadService } from '../../services/image-upload-service';
import CustomIcon from '../../components/CustomIcon';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import ServerAuthGuard from '../../components/ServerAuthGuard';
import CelebratoryMatchToast from '../../components/CelebratoryMatchToast';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAndroidBackButton } from '../../hooks/useAndroidBackButton';
import { useServerAuth } from '../../hooks/useServerAuth';
import ToastService from '../../services/toastService';

import { safeGsap } from '../../components/SafeGsap';
import { AnimatePresence, motion } from 'framer-motion';
import logger from '../../utils/logger';

function DashboardContent() {
  const router = useRouter();
  const { user } = useServerAuth();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [interactedProfiles, setInteractedProfiles] = useState<Set<string>>(new Set());
  const [dailyLikeCount, setDailyLikeCount] = useState(0);
  const [remainingLikes, setRemainingLikes] = useState(5);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 70],
    selectedProfessions: [],
    selectedCountry: '',
    selectedState: ''
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchName, setMatchName] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [matchesCount, setMatchesCount] = useState(0);

  // Enhanced mobile features
  const { haptics } = useHapticFeedback();
  const { goBack } = useAndroidBackButton({
    onBack: () => {
      if (showFilter) {
        setShowFilter(false);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    }
  });

  // Pull-to-refresh functionality
  const { containerRef: pullToRefreshRef, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      haptics.light();
      await loadProfiles();
    },
    enabled: true,
  });

  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Initialize user state from ServerAuthGuard
  useEffect(() => {
    // Authentication and profile completeness checks are now handled by ServerAuthGuard
    logger.debug('✅ Dashboard: Component mounted with authenticated user');
  }, []);

  // Reset interacted profiles when profiles change
  useEffect(() => {
    setInteractedProfiles(new Set());
  }, [profiles]);

  // Subscribe to matches count updates
  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });
    
    // Initial fetch
    matchesCountService.fetchCount();
    
    return unsubscribe;
  }, []);

  // Move loadProfiles above useEffect hooks
  const loadProfiles = useCallback(async () => {
    // Authentication is already checked in the main useEffect, so we can proceed directly
    setLoading(true);
    setError('');
    
    try {
      const discoveryData = await MatchingService.getDiscoveryProfiles();
      

      
      setProfiles(discoveryData.profiles);
      setDailyLikeCount(discoveryData.dailyLikeCount);
      setRemainingLikes(discoveryData.remainingLikes);
      setDailyLimitReached(discoveryData.dailyLimitReached);
      setCurrentIndex(0);

      // Batch load signed URLs for profile images
      if (discoveryData.profiles.length > 0) {
        const userIds = discoveryData.profiles
          .filter(profile => {
            const images = profile.profile.images;
            if (!images) return false;
            
            // Handle both array and string cases
            if (Array.isArray(images)) {
              return images.length > 0 && images[0] && images[0].trim().length > 0;
            } else if (typeof images === 'string') {
              return images.trim().length > 0;
            }
            
            return false;
          })
          .map(profile => profile._id);
        
        if (userIds.length > 0) {
          // Preload signed URLs in background for instant loading
          ImageUploadService.preloadSignedUrls(userIds);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Authentication failed') || err.message.includes('401')) {
          router.push('/');
          return;
        }
        
        // Handle specific error cases
        if (err.message.includes('No profiles available')) {
          setProfiles([]);
          setError('');
          return;
        }
        
        if (err.message.includes('Daily like limit reached')) {
          logger.debug('🚫 Dashboard: Daily limit reached');
          setProfiles([]);
          setDailyLimitReached(true);
          setError('');
          return;
        }
        
        setError(err.message || 'Failed to load profiles');
      } else {
        setError('An unexpected error occurred');
      }
      // Don't throw the error to prevent app crashes
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load profiles on component mount
  useEffect(() => {
    logger.debug('✅ Dashboard: User authenticated and profile complete, loading profiles...');
    loadProfiles();
  }, []);

  // Reload profiles when filters change
  useEffect(() => {
    if (profiles.length > 0) {
      loadProfiles();
    }
  }, [filters, profiles.length]); // Removed loadProfiles from dependencies

  // GSAP animations on component mount and data load
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && profiles.length > 0) {
      // Check if refs are properly assigned before animating
      const elements = [headerRef.current, cardRef.current, controlsRef.current].filter(Boolean);
      
      if (elements.length === 0) return; // Exit if no elements are ready
      
      // Initial setup - hide elements (use safe wrapper)
      safeGsap.set?.(elements, { 
        opacity: 0, 
        y: 50 
      });
      
      // Simplified entrance animation timeline (use safe wrapper)
      const tl = safeGsap.timeline?.({ delay: 0.1 });
      
      if (headerRef.current) {
  tl?.to?.(headerRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
      
      if (cardRef.current) {
  tl?.to?.(cardRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out"
        }, "-=0.2");
      }
      
      if (controlsRef.current) {
  tl?.to?.(controlsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.1");
      }
      
      // Animate action buttons if they exist
      const actionButtons = document.querySelectorAll('.action-button');
      if (actionButtons.length > 0) {
        tl?.fromTo?.('.action-button', {
          scale: 0,
          rotation: -90
        }, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.05
        }, "-=0.1");
      }

  // Add hover animations to action buttons
      actionButtons.forEach((button) => {
        const element = button as HTMLElement;
        
        const handleMouseEnter = () => {
          safeGsap.to?.(element, {
            scale: 1.05,
            y: -2,
            duration: 0.15,
            ease: "power2.out"
          });
        };
        
        const handleMouseLeave = () => {
          safeGsap.to?.(element, {
            scale: 1,
            y: 0,
            duration: 0.15,
            ease: "power2.out"
          });
        };
        
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      });
      
      // Add pulse animations
      safeGsap.to?.('.pulse-indicator', {
        scale: 1.2,
        opacity: 0.7,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
      
      safeGsap.to?.('.pulse-badge', {
        scale: 1.1,
        duration: 1.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }
  }, [loading, profiles]);

  // GSAP animations for loading and error states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (loading) {
        // Animate loading state (use safe wrapper to avoid missing-target warnings)
        safeGsap.fromTo?.('.loading-container', {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        });
        
        safeGsap.fromTo?.('.loading-spinner', {
          rotation: 0
        }, {
          rotation: 360,
          duration: 1,
          ease: "none",
          repeat: -1
        });
        
        safeGsap.fromTo?.(['.loading-title', '.loading-subtitle'], {
          opacity: 0,
          y: 20
        }, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.2,
          delay: 0.3
        });
      } else if (error) {
        // Animate error state (safe)
        safeGsap.fromTo?.('.error-container', {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        });
        
        safeGsap.fromTo?.('.error-icon', {
          scale: 0.5,
          rotation: -45
        }, {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.8)",
          delay: 0.2
        });
        
        safeGsap.fromTo?.(['.error-title', '.error-message', '.retry-button'], {
          opacity: 0,
          y: 20
        }, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
          delay: 0.4
        });
      }
    }
  }, [loading, error]);

  const handleKeepSwiping = useCallback(() => {
    // Continue swiping - no action needed, just close the toast
    logger.debug('User chose to keep swiping');
  }, []);

  const handleStartChat = useCallback(() => {
    // Fallback navigation to matches page if no connectionId
    router.push('/matches');
  }, [router]);

  // GSAP animation for filter modal
  useEffect(() => {
    if (showFilter) {
      safeGsap.fromTo?.('.filter-modal', { scale: 0.8, opacity: 0, y: 50 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' });
    }
  }, [showFilter]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    // Add haptic feedback
    haptics.swipeLeft();

    // Block likes (right-swipes) if daily limit is reached
    if (direction === 'right' && (dailyLimitReached || remainingLikes <= 0)) {
      // Show brief message and do not perform like
      ToastService.error('Try again tomorrow');
      return;
    }
    
    // Check if profile has already been interacted with in this session
    if (interactedProfiles.has(currentProfile._id)) {
      logger.debug('Profile already interacted with in this session, moving to next profile');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
      return;
    }
    
    // Mark profile as interacted with
    setInteractedProfiles(prev => new Set(prev).add(currentProfile._id));
    
    try {
      if (direction === 'right') {
        // Like the profile
        const likeResponse = await MatchingService.likeProfile(currentProfile._id);
        logger.debug('Like response:', likeResponse);
        
        // Check if profile was already liked
        if (likeResponse.alreadyLiked) {
          // Move to next profile without showing any error
        } else if (likeResponse.isMutualMatch) {
          // Show match notification only if shouldShowToast is true
          if (likeResponse.shouldShowToast) {
                    haptics.match(); // Add haptic feedback for matches
        setMatchName(currentProfile.profile.name || 'Someone');
        setConnectionId(likeResponse.connectionId || likeResponse.connection?._id || '');
        setShowMatchAnimation(true);
        
        // Mark the match toast as seen for this user
        try {
          const result = await MatchingService.markMatchToastSeen(currentProfile._id);
          if (!result.success) {
            // Silently handle failure
          }
        } catch (error) {
          // Don't block the UI if this fails
        }
                  }
          
          // Update matches count immediately for better UX
          matchesCountService.incrementCount();
        }
        
        // Update daily like count (only if not already liked)
        if (!likeResponse.alreadyLiked) {
          setDailyLikeCount(likeResponse.dailyLikeCount);
          setRemainingLikes(likeResponse.remainingLikes);
        }
      } else {
        // Pass on the profile
        await MatchingService.passProfile(currentProfile._id);
      }
    } catch (error) {
      // Provide user feedback for specific errors
      if (error instanceof Error) {
        if (error.message.includes('Profile already liked')) {
          // Profile already liked - just move to next profile without showing error
        } else if (error.message.includes('Daily limit reached')) {
          // Daily limit reached - show user feedback
          // You could add a toast notification here if you have a toast system
        } else if (error.message.includes('Authentication failed')) {
          // Authentication error - redirect to login
          window.location.href = '/login';
          return;
        }
      }
      
      // Don't block the UI for interaction recording failures
      // Don't throw the error to prevent app crashes
    }

    // Move to next profile regardless of interaction recording success
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleApplyFilters = (newFilters: FilterState, callback?: () => void) => {
    setFilters(newFilters);
    
    // Execute callback after state update if provided
    if (callback) {
      // Use setTimeout to ensure state update is processed
      setTimeout(callback, 50);
    }
    
    // Profiles will be reloaded automatically due to useEffect
  };

  // Filter profiles based on current filters (client-side backup)
  const filteredProfiles = profiles.filter(profile => {
    // Age filter
    const ageInRange = profile.profile?.age ? profile.profile.age >= filters.ageRange[0] && profile.profile.age <= filters.ageRange[1] : true;

    // Profession filter
    const professionMatch = filters.selectedProfessions.length === 0 ||
                           (profile.profile?.profession && filters.selectedProfessions.includes(profile.profile.profession));
    
    // Location filter
    let locationMatch = true;
    if (filters.selectedCountry || filters.selectedState) {
      const profileLocation = profile.profile.currentResidence || profile.profile.nativePlace || '';
      const profileLocationLower = profileLocation.toLowerCase();
      
      if (filters.selectedCountry && filters.selectedState) {
        // Both country and state are selected
        locationMatch = profileLocationLower.includes(filters.selectedCountry.toLowerCase()) ||
                       profileLocationLower.includes(filters.selectedState.toLowerCase());
      } else if (filters.selectedCountry) {
        // Only country is selected
        locationMatch = profileLocationLower.includes(filters.selectedCountry.toLowerCase());
      } else if (filters.selectedState) {
        // Only state is selected
        locationMatch = profileLocationLower.includes(filters.selectedState.toLowerCase());
      }
    }
    
    return ageInRange && professionMatch && locationMatch;
  });

  const hasActiveFilters = filters.selectedProfessions.length > 0 || 
                          filters.selectedCountry !== '' || 
                          filters.selectedState !== '' ||
                          filters.ageRange[0] !== 18 || 
                          filters.ageRange[1] !== 70;


  return (
    <>
      
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden page-wrapper">
      {/* Background Pattern with enhanced animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-pink-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.1),transparent_50%)]"></div>
      

      {/* Main Content with Pull-to-Refresh */}
  <div ref={pullToRefreshRef} className="px-4 relative z-10 android-scroll" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="text-center py-20">
            <div className="error-container w-24 h-24 mx-auto mb-6 bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center shadow-lg">
              <CustomIcon name="ri-error-warning-line" className="error-icon text-3xl text-red-500" />
            </div>
            <h3 className="error-title text-xl font-semibold text-gray-800 mb-2">Unable to Load Profiles</h3>
            <p className="error-message text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">Pull down to refresh and try again.</p>

          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CustomIcon name="ri-user-line" className="text-6xl text-gray-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {hasActiveFilters ? 'No Profiles Match Your Filters' : 'No Profiles Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more profiles.' 
                : 'There are no profiles available at the moment. Pull down to refresh and check for new profiles!'
              }
            </p>

          </div>
        ) : currentIndex < filteredProfiles.length ? (
          <div ref={cardRef} className="max-w-sm mx-auto">
            <SwipeCard
              profile={{
                _id: filteredProfiles[currentIndex]._id,
                profile: {
                  ...filteredProfiles[currentIndex].profile,
                  images: Array.isArray(filteredProfiles[currentIndex].profile.images) 
                    ? filteredProfiles[currentIndex].profile.images[0] || ''
                    : filteredProfiles[currentIndex].profile.images || ''
                },
                verification: filteredProfiles[currentIndex].verification
              }}
              onSwipe={handleSwipe}
            />
            
            {/* Enhanced Action Buttons */}
            <div ref={controlsRef} className="flex justify-center space-x-8 mt-6">
              <button
                onClick={() => handleSwipe('left')}
                className="action-button w-16 h-16 bg-white border-3 border-gray-400 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-500 transition-all duration-300 mobile-touch-feedback"
              >
                <CustomIcon name="ri-close-line" className="text-2xl" />
              </button>
              <button
                onClick={() => handleSwipe('right')}
                className="action-button w-16 h-16 bg-white border-3 border-rose-500 rounded-full shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-600 transition-all duration-300 mobile-touch-feedback"
              >
                <CustomIcon name="ri-heart-line" className="text-3xl text-rose-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 border border-green-200 rounded-2xl flex items-center justify-center shadow-lg">
              <CustomIcon name="ri-check-circle-line" className="text-3xl text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No More Profiles</h3>
            <p className="text-gray-600 mb-6">You've seen all available profiles. Pull down to refresh and check for new matches!</p>

          </div>
        )}
      </div>


      {/* Filter Modal */}
      {showFilter && (
        <FilterModal 
          onClose={() => setShowFilter(false)} 
          onApply={handleApplyFilters}
          currentFilters={filters}
        />
      )}

      {/* Match Animation */}
      <CelebratoryMatchToast
        isVisible={showMatchAnimation}
        onClose={() => setShowMatchAnimation(false)}
        onKeepSwiping={handleKeepSwiping}
        onStartChat={handleStartChat}
        matchName={matchName}
        connectionId={connectionId}
      />

      {/* Onboarding Animation/Modal */}
      {/* Removed onboarding overlay/modal and message from dashboard */}
    </div>
    </>
  );
}

export default function Dashboard() {

  
  return (
    <ServerAuthGuard requireAuth={true} requireCompleteProfile={true}>
      <DashboardContent />
    </ServerAuthGuard>
  );
}