'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SwipeCard from './SwipeCard';
import FilterModal, { FilterState } from './FilterModal';
import { ProfileService, Profile } from '../../services/profile-service';
import { MatchingService, type DiscoveryProfile } from '../../services/matching-service';
import { matchesCountService } from '../../services/matches-count-service';
import { ImageUploadService } from '../../services/image-upload-service';
import CustomIcon from '../../components/CustomIcon';
import SmoothNavigation from '../../components/SmoothNavigation';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import MatchAnimation from '../../components/MatchAnimation';
import StandardHeader from '../../components/StandardHeader';
import ServerAuthGuard from '../../components/ServerAuthGuard';

import { gsap } from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';

function DashboardContent() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [dailyLikeCount, setDailyLikeCount] = useState(0);
  const [remainingLikes, setRemainingLikes] = useState(5);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 40],
    selectedProfessions: [],
    selectedCountry: '',
    selectedState: ''
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchName, setMatchName] = useState('');
  const [matchesCount, setMatchesCount] = useState(0);

  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

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
      console.log('🔄 Dashboard: Loading discovery profiles...');
      const discoveryData = await MatchingService.getDiscoveryProfiles();
      console.log('✅ Dashboard: Discovery profiles loaded:', discoveryData);
      
      // Debug: Log the first profile structure
      if (discoveryData.profiles.length > 0) {
        console.log('🔍 Dashboard: First profile structure:', {
          id: discoveryData.profiles[0]._id,
          name: discoveryData.profiles[0].profile?.name,
          profession: discoveryData.profiles[0].profile?.profession,
          occupation: discoveryData.profiles[0].profile?.occupation,
          currentResidence: discoveryData.profiles[0].profile?.currentResidence,
          nativePlace: discoveryData.profiles[0].profile?.nativePlace,
          education: discoveryData.profiles[0].profile?.education,
          interests: discoveryData.profiles[0].profile?.interests,
          interestsType: typeof discoveryData.profiles[0].profile?.interests,
          interestsLength: discoveryData.profiles[0].profile?.interests?.length,
          about: discoveryData.profiles[0].profile?.about
        });
        
        // Log all profiles interests
        discoveryData.profiles.forEach((profile, index) => {
          console.log(`🎯 Profile ${index + 1} interests:`, {
            name: profile.profile?.name,
            interests: profile.profile?.interests,
            type: typeof profile.profile?.interests,
            length: profile.profile?.interests?.length
          });
        });
      }
      
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
          console.log(`🖼️ Preloading signed URLs for ${userIds.length} profiles`);
          // Preload signed URLs in background for instant loading
          ImageUploadService.preloadSignedUrls(userIds);
        } else {
          console.log('ℹ️ No profiles with images found for preloading');
        }
      }
    } catch (err: unknown) {
      console.error('❌ Dashboard: Error loading profiles:', err);
      if (err instanceof Error) {
        if (err.message.includes('Authentication failed') || err.message.includes('401')) {
          console.log('🚫 Dashboard: Authentication failed, redirecting to home');
          router.push('/');
          return;
        }
        
        // Handle specific error cases
        if (err.message.includes('No profiles available')) {
          console.log('📭 Dashboard: No profiles available, showing empty state');
          setProfiles([]);
          setError('');
          return;
        }
        
        if (err.message.includes('Daily like limit reached')) {
          console.log('🚫 Dashboard: Daily limit reached');
          setProfiles([]);
          setDailyLimitReached(true);
          setError('');
          return;
        }
        
        setError(err.message || 'Failed to load profiles');
      } else {
        setError('Failed to load profiles');
      }
      // Don't throw the error to prevent app crashes
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load profiles on component mount
  useEffect(() => {
    console.log('✅ Dashboard: User authenticated and profile complete, loading profiles...');
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
      
      // Initial setup - hide elements
      gsap.set(elements, { 
        opacity: 0, 
        y: 50 
      });
      
      // Entrance animation timeline
      const tl = gsap.timeline({ delay: 0.2 });
      
      if (headerRef.current) {
        tl.to(headerRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.4)"
        });
      }
      
      if (cardRef.current) {
        tl.to(cardRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "elastic.out(1, 0.8)"
        }, "-=0.4");
      }
      
      if (controlsRef.current) {
        tl.to(controlsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.3");
      }
      
      // Animate action buttons if they exist
      const actionButtons = document.querySelectorAll('.action-button');
      if (actionButtons.length > 0) {
        tl.fromTo('.action-button', {
          scale: 0,
          rotation: -180
        }, {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: 0.1
        }, "-=0.2");
      }

      // Add hover animations to action buttons
      actionButtons.forEach((button) => {
        const element = button as HTMLElement;
        
        const handleMouseEnter = () => {
          gsap.to(element, {
            scale: 1.1,
            y: -5,
            duration: 0.3,
            ease: "back.out(1.7)"
          });
        };
        
        const handleMouseLeave = () => {
          gsap.to(element, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      });
      
      // Add pulse animations
      gsap.to('.pulse-indicator', {
        scale: 1.2,
        opacity: 0.7,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
      
      gsap.to('.pulse-badge', {
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
        // Animate loading state
        gsap.fromTo('.loading-container', {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        });
        
        gsap.fromTo('.loading-spinner', {
          rotation: 0
        }, {
          rotation: 360,
          duration: 1,
          ease: "none",
          repeat: -1
        });
        
        gsap.fromTo(['.loading-title', '.loading-subtitle'], {
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
        // Animate error state
        gsap.fromTo('.error-container', {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        });
        
        gsap.fromTo('.error-icon', {
          scale: 0.5,
          rotation: -45
        }, {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.8)",
          delay: 0.2
        });
        
        gsap.fromTo(['.error-title', '.error-message', '.retry-button'], {
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

  // GSAP animation for filter modal
  useEffect(() => {
    if (showFilter) {
      gsap.fromTo('.filter-modal', {
        scale: 0.8,
        opacity: 0,
        y: 50
      }, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.4)"
      });
    }
  }, [showFilter]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    try {
      if (direction === 'right') {
        // Like the profile
        const likeResponse = await MatchingService.likeProfile(currentProfile._id);
        console.log('Like response:', likeResponse);
        
        if (likeResponse.isMutualMatch) {
          // Show match notification
          console.log('🎉 It\'s a match!');
          setMatchName(currentProfile.profile.name || 'Someone');
          setShowMatchAnimation(true);
          
          // Update matches count immediately for better UX
          matchesCountService.incrementCount();
        }
        
        // Update daily like count
        setDailyLikeCount(likeResponse.dailyLikeCount);
        setRemainingLikes(likeResponse.remainingLikes);
      } else {
        // Pass on the profile
        await MatchingService.passProfile(currentProfile._id);
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
      // Don't block the UI for interaction recording failures
      // Don't throw the error to prevent app crashes
    }

    // Move to next profile regardless of interaction recording success
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Profiles will be reloaded automatically due to useEffect
  };

  // Filter profiles based on current filters (client-side backup)
  const filteredProfiles = profiles.filter(profile => {
    const ageInRange = profile.profile.age >= filters.ageRange[0] && profile.profile.age <= filters.ageRange[1];
    const professionMatch = filters.selectedProfessions.length === 0 || 
                           filters.selectedProfessions.includes(profile.profile.profession);
    
    return ageInRange && professionMatch;
  });

  const hasActiveFilters = filters.selectedProfessions.length > 0 || 
                          filters.selectedCountry !== '' || 
                          filters.selectedState !== '' ||
                          filters.ageRange[0] !== 18 || 
                          filters.ageRange[1] !== 40;


  return (
    <>
      
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden page-wrapper">
      {/* Background Pattern with enhanced animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-pink-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <StandardHeader 
        showFilter={true}
        onFilterClick={() => setShowFilter(true)}
        hasActiveFilters={!!filters.selectedCountry || !!filters.selectedState || filters.selectedProfessions.length > 0}
      />

      {/* Main Content */}
            {/* Main Content with enhanced transitions */}
      <div className="pt-20 pb-24 px-4 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <HeartbeatLoader 
              logoSize="xxxxl"
              textSize="xl"
              text="Finding Your Perfect Matches" 
              className="mb-4"
            />
            <p className="text-gray-600 mt-2">Please wait while we curate profiles for you...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="error-container w-24 h-24 mx-auto mb-6 bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center shadow-lg">
              <CustomIcon name="ri-error-warning-line" className="error-icon text-3xl text-red-500" />
            </div>
            <h3 className="error-title text-xl font-semibold text-gray-800 mb-2">Unable to Load Profiles</h3>
            <p className="error-message text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadProfiles}
              className="retry-button bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CustomIcon name="ri-user-line" className="text-6xl text-gray-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Profiles Found</h3>
            <p className="text-gray-600 mb-6">There are no profiles available at the moment. Please check back later!</p>
            <button
              onClick={loadProfiles}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Refresh
            </button>
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
            <p className="text-gray-600 mb-6">You've seen all available profiles. Check back later for new matches!</p>
            <button
              onClick={loadProfiles}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Modern Bottom Navigation */}
      <SmoothNavigation 
        items={[
          { href: '/dashboard', icon: 'ri-heart-line', label: 'Discover', activeIcon: 'ri-heart-fill' },
          { 
            href: '/matches', 
            icon: 'ri-chat-3-line', 
            label: 'Matches',
            activeIcon: 'ri-chat-3-fill',
            ...(matchesCount > 0 && { badge: matchesCount })
          },
          { href: '/profile', icon: 'ri-user-line', label: 'Profile', activeIcon: 'ri-user-fill' },
          { href: '/settings', icon: 'ri-settings-line', label: 'Settings', activeIcon: 'ri-settings-fill' },
        ]}
      />

      {/* Filter Modal */}
      {showFilter && (
        <FilterModal 
          onClose={() => setShowFilter(false)} 
          onApply={handleApplyFilters}
          currentFilters={filters}
        />
      )}

      {/* Match Animation */}
      <MatchAnimation
        isVisible={showMatchAnimation}
        onClose={() => setShowMatchAnimation(false)}
        matchName={matchName}
      />

      {/* Onboarding Animation/Modal */}
      {/* Removed onboarding overlay/modal and message from dashboard */}
    </div>
    </>
  );
}

export default function Dashboard() {
  console.log('🔍 Dashboard: Component called');
  
  return (
    <ServerAuthGuard requireAuth={true} requireCompleteProfile={true}>
      <DashboardContent />
    </ServerAuthGuard>
  );
}