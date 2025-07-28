'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../services/auth-service';
import { MatchingService, type LikedProfile, type MutualMatch } from '../../services/matching-service';
import { matchesCountService } from '../../services/matches-count-service';
import CustomIcon from '../../components/CustomIcon';
import { gsap } from 'gsap';
import Image from 'next/image';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import StandardHeader from '../../components/StandardHeader';
import FilterModal, { type FilterState } from '../dashboard/FilterModal';

// Helper to decode JWT and get current user ID
function getCurrentUserId() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload._id || payload.id || null;
  } catch {
    return null;
  }
}

export default function Matches() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('matches');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileIncomplete, setShowProfileIncomplete] = useState(false);
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 60],
    selectedProfessions: [],
    selectedCountry: '',
    selectedState: ''
  });

  // GSAP refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);

    // Fetch liked profiles and mutual matches
    async function fetchMatches() {
      // Check authentication before making API calls
      if (!AuthService.isAuthenticated()) {
        console.log('🚫 Matches: User not authenticated, skipping match fetch');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch liked profiles (for Request tab)
        const likedData = await MatchingService.getLikedProfiles();
        setLikedProfiles(likedData.likedProfiles);

        // Fetch mutual matches (for Matches tab)
        const matchesData = await MatchingService.getMutualMatches();
        setMutualMatches(matchesData.matches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setLikedProfiles([]);
        setMutualMatches([]);
        // Don't throw the error to prevent app crashes
      }
      setLoading(false);
    }

    fetchMatches();
  }, []);

  // Handle filter application
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setShowFilter(false);
    
    // Update active filters indicator
    const hasActive = newFilters.selectedProfessions.length > 0 ||
                     newFilters.selectedCountry !== '' ||
                     newFilters.selectedState !== '' ||
                     newFilters.ageRange[0] !== 18 ||
                     newFilters.ageRange[1] !== 60;
    setHasActiveFilters(hasActive);
  };

  // Handle unmatch
  const handleUnmatch = async (profileId: string) => {
    const profile = mutualMatches.find(m => m.profile._id === profileId) || 
                   likedProfiles.find(l => l.profile._id === profileId);
    const profileName = profile?.profile.profile?.name || 'this person';
    
    if (!confirm(`Are you sure you want to unmatch from ${profileName}? This action cannot be undone.`)) {
      return;
    }

    setUnmatchingId(profileId);
    try {
      await MatchingService.unmatchProfile(profileId);
      
      // Remove from both lists
      setLikedProfiles(prev => prev.filter(p => p.profile._id !== profileId));
      setMutualMatches(prev => prev.filter(m => m.profile._id !== profileId));
      
      // Update global matches count
      matchesCountService.fetchCount();
      
      // Show success message
      alert('Successfully unmatched!');
    } catch (error) {
      console.error('Error unmatching:', error);
      alert('Failed to unmatch. Please try again.');
    } finally {
      setUnmatchingId(null);
    }
  };

  useEffect(() => {
    async function checkOnboarding() {
      let isFirstLogin = false;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('isFirstLogin');
        if (stored !== null) {
          isFirstLogin = stored === 'true';
        } else {
          // Fallback: fetch profile
          const userProfile = await import('../../services/profile-service').then(m => m.ProfileService.getUserProfile());
          isFirstLogin = !!userProfile?.isFirstLogin;
        }
      }
      
      // Check profile completion
      const profileCompletion = localStorage.getItem('profileCompletion');
      const completion = profileCompletion ? parseInt(profileCompletion) : 0;
      
      // Allow access if profile completion is 75% or higher
      if (isFirstLogin && completion < 75) {
        router.replace('/profile');
      }
      setShowProfileIncomplete(isFirstLogin && completion < 75);
      
      // If profile is 75%+ complete, ensure onboarding is marked as seen
      if (completion >= 75) {
        console.log('✅ Matches page: Profile 75%+ complete, marking onboarding as seen');
        localStorage.setItem('hasSeenOnboarding', 'true');
        localStorage.setItem('isFirstLogin', 'false');
      }
    }
    checkOnboarding();
  }, [router]);

  // GSAP animations on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if refs are properly assigned before animating
      const elements = [headerRef.current, tabsRef.current, contentRef.current].filter(Boolean);
      
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
      
      if (tabsRef.current) {
        tl.to(tabsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.4");
      }
      
      if (contentRef.current) {
        tl.to(contentRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "elastic.out(1, 0.8)"
        }, "-=0.3");
      }
      
      // Animate match cards if they exist
      const matchCards = document.querySelectorAll('.match-card');
      if (matchCards.length > 0) {
        try {
          tl.fromTo('.match-card', {
            opacity: 0,
            y: 30,
            scale: 0.95
          }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.4)",
            stagger: 0.15
          }, "-=0.4");
        } catch (error) {
          // Silently handle GSAP errors
        }
      }

      // Add hover animations to match cards
      matchCards.forEach((card) => {
        const element = card as HTMLElement;
        if (!element) return; // Safety check
        
        const handleMouseEnter = () => {
          try {
            gsap.to(element, {
              scale: 1.02,
              y: -5,
              duration: 0.3,
              ease: "power2.out"
            });
          } catch (error) {
            // Silently handle GSAP errors
          }
        };
        
        const handleMouseLeave = () => {
          try {
            gsap.to(element, {
              scale: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          } catch (error) {
            // Silently handle GSAP errors
          }
        };
        
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      });
    }
  }, []);

  // GSAP animation for tab changes
  useEffect(() => {
    if (contentRef.current) {
      // Check if match cards exist before animating
      const matchCards = document.querySelectorAll('.match-card');
      if (matchCards.length > 0) {
        try {
          gsap.fromTo('.match-card', {
            opacity: 0,
            y: 20
          }, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.1
          });
        } catch (error) {
          // Silently handle GSAP errors
        }
      }
    }
  }, [activeTab]);

  // Show loading screen while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            size="lg" 
            text="Checking Authentication" 
            className="mb-4"
          />
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-pink-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.1),transparent_50%)]"></div>

      {/* Show message if profile is incomplete */}
      {showProfileIncomplete && (
        <div className="text-center py-4 bg-yellow-100 text-yellow-800 font-semibold rounded mb-4">
          Please complete your profile first before using this feature.
        </div>
      )}

      {/* Header */}
      <StandardHeader
        showFilter={true}
        onFilterClick={() => setShowFilter(true)}
        hasActiveFilters={hasActiveFilters}
        showProfileLink={true}
      />

      {/* Tab Switcher */}
      <div ref={tabsRef} className="relative z-10 pt-16 px-4 pb-4">
        <div className="flex bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/20">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'matches' 
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg' 
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-white/50'
            }`}
          >
            Matches ({mutualMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'requests' 
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg' 
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-white/50'
            }`}
          >
            Requests ({likedProfiles.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 px-4 pb-24">
        {activeTab === 'matches' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <HeartbeatLoader 
                size="lg" 
                text="Loading Your Matches" 
                className="mb-4"
              />
              <p className="text-gray-600 mt-2">Please wait while we fetch your matches...</p>
            </div>
          ) : mutualMatches.length > 0 ? (
              <div className="space-y-4">
                {mutualMatches.map((match) => (
                  <Link key={match.connectionId} href={`/chat/${match.connectionId}`}>
                    <div className="match-card p-6 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Image
                            src={match.profile.profile?.images?.[0] || '/default-profile.svg'}
                            alt={match.profile.profile?.name || 'Profile'}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover object-top shadow-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-neutral-800 truncate">
                              {match.profile.profile?.name || 'Unknown'}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleUnmatch(match.profile._id);
                              }}
                              disabled={unmatchingId === match.profile._id}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                              title="Unmatch"
                            >
                              <CustomIcon 
                                name={unmatchingId === match.profile._id ? "ri-loader-4-line" : "ri-close-line"} 
                                className={`text-lg ${unmatchingId === match.profile._id ? 'animate-spin' : ''}`}
                              />
                            </button>
                          </div>
                          <div className="flex items-center space-x-3 mb-2">
                            <p className="text-sm text-neutral-600 flex items-center space-x-1">
                              <CustomIcon name="ri-calendar-line" className="w-3 h-3" />
                              <span>{match.profile.profile?.age}</span>
                            </p>
                            <p className="text-sm text-neutral-600 flex items-center space-x-1">
                              <CustomIcon name="ri-briefcase-line" className="w-3 h-3" />
                              <span className="truncate">{match.profile.profile?.profession}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <CustomIcon name="ri-heart-line" className="text-6xl text-gray-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">You don't have any matches</h3>
                <p className="text-gray-600 mb-6">Start swiping to find your perfect match!</p>
                <Link
                  href="/dashboard"
                  className="inline-block bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Start Matching
                </Link>
              </div>
            )
        ) : (
          loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <HeartbeatLoader 
                size="lg" 
                text="Loading Your Requests" 
                className="mb-4"
              />
              <p className="text-gray-600 mt-2">Please wait while we fetch your requests...</p>
            </div>
          ) : likedProfiles.length > 0 ? (
            <div className="space-y-4">
              {likedProfiles.map((likedProfile) => (
                <div key={likedProfile.likeId} className="match-card p-6 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Image
                        src={likedProfile.profile.profile?.images?.[0] || '/default-profile.svg'}
                        alt={likedProfile.profile.profile?.name || 'Profile'}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover object-top shadow-lg"
                      />
                      {likedProfile.isMutualMatch && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CustomIcon name="ri-heart-fill" className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-neutral-800 truncate">
                          {likedProfile.profile.profile?.name || 'Unknown'}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {likedProfile.isMutualMatch && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Match!
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(likedProfile.likeDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="text-sm text-neutral-600 flex items-center space-x-1">
                          <CustomIcon name="ri-calendar-line" className="w-3 h-3" />
                          <span>{likedProfile.profile.profile?.age}</span>
                        </p>
                        <p className="text-sm text-neutral-600 flex items-center space-x-1">
                          <CustomIcon name="ri-briefcase-line" className="w-3 h-3" />
                          <span className="truncate">{likedProfile.profile.profile?.profession}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          likedProfile.type === 'super_like' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {likedProfile.type === 'super_like' ? 'Super Like' : 'Like'}
                        </span>
                        {likedProfile.isMutualMatch && (
                          <Link
                            href={`/chat/${likedProfile.connectionId || 'temp'}`}
                            className="px-3 py-1 bg-rose-500 text-white text-xs rounded-full font-medium hover:bg-rose-600 transition-colors duration-200"
                          >
                            Chat
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <CustomIcon name="ri-heart-line" className="text-6xl text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Requests Yet</h3>
              <p className="text-gray-600 mb-6">Start swiping right to send requests to profiles you like!</p>
              <Link
                href="/dashboard"
                className="inline-block bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Start Swiping
              </Link>
            </div>
          )
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 h-16">
          <Link 
            href="/dashboard" 
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 transition-colors duration-200 active:bg-gray-50"
          >
            <CustomIcon name="ri-heart-line" className="text-xl mb-1" />
            <span className="text-xs">Discover</span>
          </Link>
          <Link 
            href="/matches" 
            className="flex flex-col items-center justify-center text-rose-500 transition-colors duration-200 active:bg-rose-50 relative"
          >
            <CustomIcon name="ri-chat-3-line" className="text-xl mb-1" />
            <span className="text-xs">Matches</span>
            {mutualMatches.length > 0 && (
              <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-0 translate-y-0">
                {mutualMatches.length}
              </div>
            )}
          </Link>
          <Link 
            href="/profile" 
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 transition-colors duration-200 active:bg-gray-50"
          >
            <CustomIcon name="ri-user-line" className="text-xl mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
          <Link 
            href="/settings" 
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 transition-colors duration-200 active:bg-gray-50"
          >
            <CustomIcon name="ri-settings-line" className="text-xl mb-1" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}