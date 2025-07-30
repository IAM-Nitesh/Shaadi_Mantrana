'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../services/auth-service';
import { MatchingService, type LikedProfile, type MutualMatch } from '../../services/matching-service';
import { matchesCountService } from '../../services/matches-count-service';
import { ImageUploadService } from '../../services/image-upload-service';
import CustomIcon from '../../components/CustomIcon';
import { gsap } from 'gsap';
import Image from 'next/image';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import StandardHeader from '../../components/StandardHeader';
import FilterModal, { type FilterState } from '../dashboard/FilterModal';
import configService from '../../services/configService';
import ModernNavigation from '../../components/ModernNavigation';

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
  const [profileImages, setProfileImages] = useState<Map<string, string>>(new Map());
  const [matchesCount, setMatchesCount] = useState(0);
  const [error, setError] = useState('');
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
      
      // Fetch profile images for all profiles
      const allProfiles = [
        ...mutualMatchesData.matches.map((match: any) => match.profile),
        ...likedProfilesData.likedProfiles.map((liked: any) => liked.profile)
      ];
      await fetchProfileImages(allProfiles);
      
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

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
                     newFilters.ageRange[1] !== 60;
    
    setHasActiveFilters(hasActive);
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
        console.warn('⚠️ Failed to load profile images:', error);
      }
    }
  };

  // Check onboarding completion
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/');
          return;
        }

        const response = await fetch(`${configService.apiBaseUrl}/api/profiles/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const profile = await response.json();
          
          // Check if profile is complete (100% required)
          const completeness = profile.profileCompleteness || 0;
          const hasProfilePicture = profile.profile?.images;
          
          if (completeness < 100 || !hasProfilePicture) {
            setShowProfileIncomplete(true);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    }

    checkOnboarding();
  }, [router]);

  // GSAP animations
  useEffect(() => {
    if (headerRef.current && tabsRef.current) {
      gsap.fromTo(headerRef.current, 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      );
      
      gsap.fromTo(tabsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
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

  // Animate content when data loads
  useEffect(() => {
    if (contentRef.current && !loading) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading, mutualMatches, likedProfiles]);

  // Profile card hover animations
  useEffect(() => {
    const cards = document.querySelectorAll('.profile-card');
    
    cards.forEach(card => {
      const handleMouseEnter = () => {
        gsap.to(card, {
          scale: 1.02,
          duration: 0.2,
          ease: "power2.out"
        });
      };
      
      const handleMouseLeave = () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.2,
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
          
          <Link 
            href="/profile"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <CustomIcon name="ri-user-settings-line" className="mr-2" />
            Complete Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <StandardHeader />
      
      {/* Header */}
      <div ref={headerRef} className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Matches</h1>
            <p className="text-gray-600">Connect with your matches</p>
          </div>
          
          <button
            onClick={() => setShowFilter(true)}
            className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
              hasActiveFilters 
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-300'
            }`}
          >
            <CustomIcon name="ri-filter-3-line" className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className="px-4 mb-6">
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
              Requests ({likedProfiles.length})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <HeartbeatLoader />
          </div>
        ) : (
          <>
            {activeTab === 'matches' && (
              <div className="space-y-4">
                {mutualMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <CustomIcon name="ri-heart-line" className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Matches Yet</h3>
                    <p className="text-gray-500 mb-6">Start swiping to find your perfect match!</p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                    >
                      <CustomIcon name="ri-compass-line" className="mr-2" />
                      Start Discovering
                    </Link>
                  </div>
                ) : (
                  mutualMatches.map((match) => (
                    <div key={match.connectionId} className="profile-card bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden">
                            {profileImages.get(match.profile._id) ? (
                              <Image
                                src={profileImages.get(match.profile._id)!}
                                alt={match.profile.profile.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <CustomIcon name="ri-user-line" className="text-2xl text-gray-400" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CustomIcon name="ri-check-line" className="text-white text-xs" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {match.profile.profile.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {(match.profile.profile as any).location || 'Location not specified'}
                          </p>
                        </div>
                        
                        <Link
                          href={`/chat/${match.connectionId}`}
                          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                        >
                          <CustomIcon name="ri-chat-3-line" className="text-xl" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                {likedProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <CustomIcon name="ri-user-add-line" className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Requests Yet</h3>
                    <p className="text-gray-500 mb-6">Profiles you like will appear here</p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                    >
                      <CustomIcon name="ri-compass-line" className="mr-2" />
                      Start Discovering
                    </Link>
                  </div>
                ) : (
                  likedProfiles.map((likedProfile) => (
                    <div key={likedProfile.likeId} className="profile-card bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden">
                            {profileImages.get(likedProfile.profile._id) ? (
                              <Image
                                src={profileImages.get(likedProfile.profile._id)!}
                                alt={likedProfile.profile.profile.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <CustomIcon name="ri-user-line" className="text-2xl text-gray-400" />
                            )}
                          </div>
                          {likedProfile.isMutualMatch && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center">
                              <CustomIcon name="ri-heart-fill" className="text-red-500 text-xs" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {likedProfile.profile.profile.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {(likedProfile.profile.profile as any).location || 'Location not specified'}
                          </p>
                        </div>
                        
                        {likedProfile.isMutualMatch ? (
                          <Link
                            href={`/chat/${likedProfile.connectionId}`}
                            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                          >
                            <CustomIcon name="ri-chat-3-line" className="text-xl" />
                          </Link>
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                            <CustomIcon name="ri-time-line" className="text-gray-400 text-xl" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Modern Bottom Navigation */}
      <ModernNavigation 
        items={[
          { href: '/dashboard', icon: 'ri-heart-line', label: 'Discover', activeIcon: 'ri-heart-fill' },
          { 
            href: '/matches', 
            icon: 'ri-chat-3-line', 
            label: 'Matches',
            ...(matchesCount > 0 && { badge: matchesCount })
          },
          { href: '/profile', icon: 'ri-user-line', label: 'Profile' },
          { href: '/settings', icon: 'ri-settings-line', label: 'Settings' },
        ]}
      />
    </div>
  );
}