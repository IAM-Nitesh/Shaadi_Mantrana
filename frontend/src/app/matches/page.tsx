'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
;
import { useRouter } from 'next/navigation';
import { MatchingService, type LikedProfile, type MutualMatch } from '../../services/matching-service';
import { matchesCountService } from '../../services/matches-count-service';
import { ImageUploadService } from '../../services/image-upload-service';
import CustomIcon from '../../components/CustomIcon';
import { safeGsap } from '../../components/SafeGsap';
// HeartbeatLoader removed (unused)
import FilterModal, { type FilterState } from '../dashboard/FilterModal';
import { config as configService } from '../../services/configService';
import { userNavItems } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuardV2 } from '../../components/AuthGuardV2';
import ToastService from '../../services/toastService';
import CelebratoryMatchToast from '../../components/CelebratoryMatchToast';
import { MatchesListSkeleton } from '../../components/SkeletonLoader';
import { ProfileImage } from '../../components/LazyImage';
// import { usePullToRefresh } from '../../hooks/usePullToRefresh';
// import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import logger from '../../utils/logger';
import posthog from 'posthog-js';

// Helper to decode JWT and get current user ID (for backward compatibility)
function getCurrentUserId() {
  try {
    // This function is kept for backward compatibility but should be replaced
    // with server-side authentication checks
    return null;
  } catch {
    return null;
  }
}

function MatchesContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileIncomplete, setShowProfileIncomplete] = useState(false);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [hasShownMatchToast, setHasShownMatchToast] = useState(false);
  

  const [profileImages, setProfileImages] = useState<Map<string, string>>(new Map());
  const [matchesCount, setMatchesCount] = useState(0);
  const [error, setError] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 70],
    selectedProfessions: [],
    selectedCountry: '',
    selectedState: ''
  });

  // Enhanced mobile features - temporarily disabled for build
  // const { haptics } = useHapticFeedback();
  // const { containerRef: pullToRefreshRef, isRefreshing } = usePullToRefresh({
  //   onRefresh: async () => {
  //     haptics.light();
  //     await fetchMatches();
  //   },
  //   enabled: true,
  // });

  // GSAP refs for animations
  const tabsRef = useRef<HTMLDivElement>(null);
  const fetchCalledRef = useRef(false);

  // Fetch matches with caching
  async function fetchMatches() {
    try {
      setLoading(true);
      setError('');
      
      const [mutualMatchesData, likedProfilesData] = await Promise.all([
        MatchingService.getMutualMatches(),
        MatchingService.getLikedProfiles()
      ]);
      
      setMutualMatches(mutualMatchesData.matches);
      setLikedProfiles(likedProfilesData.likedProfiles);
      
      // Update matches count with the actual count from server
      matchesCountService.setCount(mutualMatchesData.matches.length);
      
      // Show match celebration if user has matches and hasn't shown toast yet
      if (mutualMatchesData.matches.length > 0 && !hasShownMatchToast) {
        // Only show celebration if at least one match needs the toast
        const matchesNeedingToast = mutualMatchesData.matches.filter((m: any) => m.shouldShowToast);
        if (matchesNeedingToast.length > 0) {
          setShowMatchCelebration(true);
          setHasShownMatchToast(true);

          // Mark toast as seen for each match that needed it (non-blocking)
          (async () => {
            try {
              const ids = matchesNeedingToast.map((m: any) => m.profile?._id).filter(Boolean);
              await Promise.allSettled(ids.map((id: string) => MatchingService.markMatchToastSeen(id)));
            } catch (e) {
              logger.warn('Failed to mark match toasts as seen', e);
            }
          })();

          // Hide celebration after 3 seconds
          setTimeout(() => {
            setShowMatchCelebration(false);
          }, 3000);
        }
      }
      
      // Fetch profile images for all profiles
      const allProfiles = [
        ...mutualMatchesData.matches.map((match: any) => match.profile),
        ...likedProfilesData.likedProfiles.map((liked: any) => liked.profile)
      ];
      await fetchProfileImages(allProfiles);
      
          } catch (error) {
        setError('Failed to load matches. Please try again.');
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    // Clear cache to ensure fresh data
    MatchingService.clearMatchesCache();
    
    // Reset fetch flag
    fetchCalledRef.current = false;
    
    fetchMatches();
  }, []);

  // Handle filter application
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setShowFilter(false);
    
    // Update active filters indicator
    const hasActive = newFilters.selectedProfessions.length > 0 ||
                     !!newFilters.selectedCountry ||
                     !!newFilters.selectedState ||
                     newFilters.ageRange[0] !== 18 ||
                     newFilters.ageRange[1] !== 70;
    
    setHasActiveFilters(hasActive);
    posthog.capture('filter_applied', {
      has_active_filters: hasActive,
      age_min: newFilters.ageRange[0],
      age_max: newFilters.ageRange[1],
      profession_count: newFilters.selectedProfessions.length,
      country: newFilters.selectedCountry || null,
      state: newFilters.selectedState || null,
    });
  };

  // Fetch profile images for a list of profiles
  const fetchProfileImages = async (profiles: any[]) => {
    const userIds = profiles
      .map(profile => profile.profile?._id || profile._id)
      .filter(Boolean);

    if (userIds.length > 0) {
      try {
        const signedUrls = await ImageUploadService.getBatchSignedUrls(userIds);
        const newProfileImages = new Map<string, string>();
        signedUrls.forEach((url, userId) => {
          if (url) {
            newProfileImages.set(userId, url);
          }
        });
        setProfileImages(prev => new Map([...prev, ...newProfileImages]));
      } catch (error) {
        logger.warn('⚠️ Failed to load profile images:', error);
      }
    }
  };

  // Check onboarding completion
  useEffect(() => {
    async function checkAccess() {
      try {
        logger.debug('🔍 Matches: Checking access control...');
        
        // Use server-side authentication data
        if (!user) {
          logger.debug('🚫 No user data available - waiting for user data');
          return; // Don't show popup yet, wait for user data
        }

        // Access Control Logic: Only allow access if profileCompleteness is 100%
        const profileCompleteness = user.profileCompleteness || 0;
        
        logger.debug('🔍 Matches: Access control check:', {
          profileCompleteness,
          userEmail: user.email,
          userRole: user.role,
          isApproved: user.isApprovedByAdmin,
          isFirstLogin: user.isFirstLogin
        });
        
        // Check if profile is complete (should be 100 for complete profiles)
        if (profileCompleteness < 100) {
          logger.debug('🚫 Access denied: Profile incomplete - redirecting to profile');
          router.replace('/profile');
          return;
        } else {
          logger.debug('✅ Access granted: Profile complete - proceeding to matches');
          setShowProfileIncomplete(false);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error checking matches access:', error);
        router.replace('/profile');
      }
    }

    // Only run check if user is available
    if (user) {
      checkAccess();
    }
  }, [user, router]);

  // GSAP animations - simplified to remove bounce effects
  useEffect(() => {
    if (tabsRef.current) {
      safeGsap.fromTo?.(tabsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, []);

  // Subscribe to matches count updates
  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });
    
    // Initial fetch
    matchesCountService.fetchCount();
    
    return unsubscribe;
  }, []);

  // Remove content animation to prevent bounce effects
  // useEffect(() => {
  //   if (contentRef.current && !loading) {
  // commented GSAP usage removed in favor of safeGsap
  //   }
  // }, [loading, mutualMatches, likedProfiles]);

  // Profile card hover animations - simplified
  useEffect(() => {
    const cards = document.querySelectorAll('.profile-card');
    
    cards.forEach(card => {
      const handleMouseEnter = () => {
        safeGsap.to?.(card, {
          scale: 1.01, // Reduced scale for subtler effect
          duration: 0.15, // Faster animation
          ease: "power2.out"
        });
      };
      
      const handleMouseLeave = () => {
        safeGsap.to?.(card, {
          scale: 1,
          duration: 0.15, // Faster animation
          ease: "power2.out"
        });
      };
      
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [mutualMatches, likedProfiles]);

  const handleKeepSwiping = useCallback(() => {
    // Continue viewing matches - no action needed, just close the toast
    logger.debug('User chose to continue viewing matches');
  }, []);

  const handleStartChat = useCallback(() => {
    // Stay on matches page to start chatting
    logger.debug('User chose to start chatting');
  }, []);

  // GSAP animation for filter modal

  if (showProfileIncomplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CustomIcon name="ri-user-heart-line" className="text-6xl text-pink-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">
              Please complete 100% of your profile before accessing other features. This helps us provide you with better matches.
            </p>
          </div>
          
          <a 
            href="/profile"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <CustomIcon name="ri-user-settings-line" className="mr-2" />
            Complete Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      
      {/* Main Content */}
  <div className="px-4 relative z-10" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}>
        <h1 className="text-4xl font-heading text-gray-900 mb-6 px-2">Matches</h1>
        {/* Tabs */}
        <div ref={tabsRef} className="mb-6">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'matches'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center">
                <CustomIcon name="ri-heart-fill" className="mr-2" />
                Matches ({mutualMatches.length})
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center">
                <CustomIcon name="ri-user-add-line" className="mr-2" />
                Likes ({likedProfiles.length})
              </div>
            </button>
          </div>
        </div>

        {/* Content with Pull-to-Refresh */}
        <div className="android-scroll">
          {loading ? (
            <MatchesListSkeleton />
          ) : (
            <>
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {mutualMatches.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                        <CustomIcon name="ri-heart-line" className="text-4xl text-pink-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Matches Yet</h3>
                      <p className="text-gray-600 mb-6">Start swiping to find your perfect match!</p>
                      <a
                        href="/dashboard"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Start Discovering
                      </a>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {mutualMatches.map((match, index) => (
                        <a
                          key={match.connectionId}
                          href={`/chat?id=${match.connectionId}`}
                          onClick={() => posthog.capture('match_chat_started', { connection_id: match.connectionId })}
                          className="profile-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] cursor-pointer hover:border-pink-200"
                          style={{
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden shadow-lg">
                                {profileImages.get(match.profile._id) ? (
                                  <ProfileImage
                                    src={profileImages.get(match.profile._id)!}
                                    alt={match.profile.profile.name}
                                    size="lg"
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <CustomIcon name="ri-user-line" className="text-3xl text-gray-400" />
                                )}
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center">
                                <CustomIcon name="ri-heart-fill" className="text-red-500 text-xs" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-1">
                                {match.profile.profile.name}
                              </h3>
                              {match.profile.profile.profession && (
                                <p className="text-sm text-gray-500 mb-3">
                                  {match.profile.profile.profession}
                                </p>
                              )}
                              <div className="flex items-center text-xs text-gray-400">
                                Matched on {new Date(match.matchDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-center w-14 h-14 text-pink-500">
                              <CustomIcon name="ri-chat-3-line" className="text-xl" />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="space-y-4">
                  {likedProfiles.length === 0 ? (
                    <div className="text-center py-12">
                      <CustomIcon name="ri-user-add-line" className="text-6xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Likes Yet</h3>
                      <p className="text-gray-500 mb-6">Profiles you like will appear here</p>
                      <a
                        href="/dashboard"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                      >
                        Start Discovering
                      </a>
                    </div>
                  ) : (
                    likedProfiles.map((likedProfile) => (
                      likedProfile.isMutualMatch ? (
                        <a
                          key={likedProfile.likeId}
                          href={`/chat?id=${likedProfile.connectionId}`}
                                                     className="profile-card bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer hover:border-pink-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden">
                                {profileImages.get(likedProfile.profile._id) ? (
                                  <ProfileImage
                                    src={profileImages.get(likedProfile.profile._id)!}
                                    alt={likedProfile.profile.profile.name}
                                    size="md"
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <CustomIcon name="ri-user-line" className="text-2xl text-gray-400" />
                                )}
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center">
                                <CustomIcon name="ri-heart-fill" className="text-red-500 text-xs" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-1">
                                {likedProfile.profile.profile.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Liked on {likedProfile.likeDate ? new Date(likedProfile.likeDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'Date not available'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-center w-12 h-12 text-pink-500">
                              <CustomIcon name="ri-chat-3-line" className="text-xl" />
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div key={likedProfile.likeId} className="profile-card bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden">
                                {profileImages.get(likedProfile.profile._id) ? (
                                  <ProfileImage
                                    src={profileImages.get(likedProfile.profile._id)!}
                                    alt={likedProfile.profile.profile.name}
                                    size="md"
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <CustomIcon name="ri-user-line" className="text-2xl text-gray-400" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-1">
                                {likedProfile.profile.profile.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Liked on {likedProfile.likeDate ? new Date(likedProfile.likeDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'Date not available'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                              <CustomIcon name="ri-heart-line" className="text-gray-400 text-xl" />
                            </div>
                          </div>
                        </div>
                      )
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilters}
          currentFilters={filters}
        />
      )}

      {/* Match Celebration Animation */}
      {showMatchCelebration && (
        <CelebratoryMatchToast
          isVisible={showMatchCelebration}
          onClose={() => setShowMatchCelebration(false)}
          onKeepSwiping={handleKeepSwiping}
          onStartChat={handleStartChat}
          matchName={`${mutualMatches.length} new match${mutualMatches.length > 1 ? 'es' : ''}`}
        />
      )}

      {/* Bottom Navigation is handled globally in layout.tsx */}
    </div>
  );
}

export default function Matches() {
  return (
    <AuthGuardV2 requiresCompleteProfile={true}>
      <MatchesContent />
    </AuthGuardV2>
  );
}