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
import RoyalLoader from '../../components/RoyalLoader';
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



  return (
    <div className="min-h-screen bg-royal-obsidian">
      
      {/* Main Content */}
  <div className="px-4 relative z-10" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}>
        <h1 className="text-4xl font-heading text-royal-gold mb-6 px-2">Matches</h1>
        {/* Tabs */}
        <div ref={tabsRef} className="mb-6">
          <div className="flex bg-royal-gold/5 border border-royal-gold/10 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'matches'
                   ? 'bg-royal-gold text-royal-obsidian shadow-lg'
                  : 'text-royal-gold-light/60 hover:text-royal-gold'
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
                   ? 'bg-royal-gold text-royal-obsidian shadow-lg'
                  : 'text-royal-gold-light/60 hover:text-royal-gold'
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
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-6 bg-royal-gold/5 border border-royal-gold/10 rounded-2xl shadow-lg">
                  <RoyalLoader variant="skeleton" className="w-20 h-20 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <RoyalLoader variant="skeleton" className="w-3/5 h-5 rounded-md" />
                    <RoyalLoader variant="skeleton" className="w-2/5 h-4 rounded-md" />
                    <RoyalLoader variant="skeleton" className="w-4/5 h-3.5 rounded-md" />
                  </div>
                  <RoyalLoader variant="skeleton" className="w-14 h-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {mutualMatches.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-royal-gold/20 to-royal-gold/5 border border-royal-gold/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                        <CustomIcon name="ri-heart-line" className="text-4xl text-royal-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-royal-gold mb-2">No Matches Yet</h3>
                      <p className="text-royal-gold-light/60 mb-8">Start swiping to find your perfect match!</p>
                      <a
                        href="/dashboard"
                        className="button-royal shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] px-8"
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
                          data-testid="profile-card"
                          onClick={() => posthog.capture('match_chat_started', { connection_id: match.connectionId })}
                          className="profile-card bg-royal-gold/5 rounded-2xl shadow-lg border border-royal-gold/10 p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] cursor-pointer hover:border-royal-gold/30"
                          style={{
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-royal-gold/20 to-royal-gold/10 flex items-center justify-center overflow-hidden shadow-lg border border-royal-gold/20">
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
                              <h3 className="font-semibold text-royal-gold mb-1">
                                {match.profile.profile.name}
                              </h3>
                              {match.profile.profile.profession && (
                                <p className="text-sm text-royal-gold-light/60 mb-3">
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
                            
                            <div className="flex items-center justify-center w-14 h-14 text-royal-gold/80 hover:text-royal-gold transition-colors">
                              <CustomIcon name="ri-chat-3-line" className="text-2xl" />
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
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-royal-gold/20 to-royal-gold/5 border border-royal-gold/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                        <CustomIcon name="ri-user-add-line" className="text-4xl text-royal-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-royal-gold mb-2">No Likes Yet</h3>
                      <p className="text-royal-gold-light/60 mb-8">Profiles you like will appear here</p>
                      <a
                        href="/dashboard"
                        className="button-royal shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] px-8"
                      >
                        Start Discovering
                      </a>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                    {likedProfiles.map((likedProfile) => (
                      likedProfile.isMutualMatch ? (
                        <a
                          key={likedProfile.likeId}
                          href={`/chat?id=${likedProfile.connectionId}`}
                          data-testid="profile-card"
                          className="profile-card bg-royal-gold/5 rounded-2xl shadow-lg border border-royal-gold/10 p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] cursor-pointer hover:border-royal-gold/30"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-royal-gold/20 to-royal-gold/10 flex items-center justify-center overflow-hidden shadow-lg border border-royal-gold/20">
                                {profileImages.get(likedProfile.profile._id) ? (
                                  <ProfileImage
                                    src={profileImages.get(likedProfile.profile._id)!}
                                    alt={likedProfile.profile.profile.name}
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
                              <h3 className="font-semibold text-royal-gold mb-1">
                                {likedProfile.profile.profile.name}
                              </h3>
                              <p className="text-sm text-royal-gold-light/60">
                                Liked on {likedProfile.likeDate ? new Date(likedProfile.likeDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'Date not available'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-center w-14 h-14 text-royal-gold/80 hover:text-royal-gold transition-colors">
                              <CustomIcon name="ri-chat-3-line" className="text-2xl" />
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div key={likedProfile.likeId} data-testid="profile-card" className="profile-card bg-royal-gold/5 rounded-2xl shadow-lg border border-royal-gold/10 p-6 transition-all duration-300 hover:shadow-xl">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-royal-gold/20 to-royal-gold/10 flex items-center justify-center overflow-hidden shadow-lg border border-royal-gold/20">
                                {profileImages.get(likedProfile.profile._id) ? (
                                  <ProfileImage
                                    src={profileImages.get(likedProfile.profile._id)!}
                                    alt={likedProfile.profile.profile.name}
                                    size="lg"
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <CustomIcon name="ri-user-line" className="text-3xl text-gray-400" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-royal-gold mb-1">
                                {likedProfile.profile.profile.name}
                              </h3>
                              <p className="text-sm text-royal-gold-light/60">
                                Liked on {likedProfile.likeDate ? new Date(likedProfile.likeDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'Date not available'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-center w-14 h-14 bg-royal-obsidian/40 border border-royal-gold/20 rounded-full">
                              <CustomIcon name="ri-heart-line" className="text-royal-gold/50 text-2xl" />
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                    </div>
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