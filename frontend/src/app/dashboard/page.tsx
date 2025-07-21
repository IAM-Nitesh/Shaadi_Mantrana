'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SwipeCard from './SwipeCard';
import FilterModal, { FilterState } from './FilterModal';
import { ProfileService, Profile } from '../../services/profile-service';
import { AuthService } from '../../services/auth-service';
import CustomIcon from '../../components/CustomIcon';
import ModernNavigation from '../../components/ModernNavigation';
import { gsap } from 'gsap';

export default function Dashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [matches, setMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 40],
    selectedProfessions: [],
    selectedCountry: '',
    selectedState: ''
  });

  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  // Check authentication on component mount and load profiles
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
    loadProfiles();
  }, [router]);

  // Reload profiles when filters change
  useEffect(() => {
    if (profiles.length > 0) {
      loadProfiles();
    }
  }, [filters]);

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

  const loadProfiles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const filterCriteria = {
        ageRange: filters.ageRange,
        selectedProfessions: filters.selectedProfessions,
        selectedLocations: filters.selectedCountry || filters.selectedState ? 
          [filters.selectedCountry, filters.selectedState].filter(Boolean) : [],
        selectedEducation: [],
        selectedInterests: []
      };

      const fetchedProfiles = await ProfileService.getProfiles(filterCriteria);
      setProfiles(fetchedProfiles);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    const action = direction === 'right' ? 'like' : 'dislike';
    
    try {
      // Record interaction with backend
      await ProfileService.recordInteraction(currentProfile.id, action);
      
      if (direction === 'right') {
        setMatches(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
      // Don't block the UI for interaction recording failures
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
    const ageInRange = profile.age >= filters.ageRange[0] && profile.age <= filters.ageRange[1];
    const professionMatch = filters.selectedProfessions.length === 0 || 
                           filters.selectedProfessions.includes(profile.profession);
    const locationMatch = (filters.selectedCountry === '' && filters.selectedState === '') ||
                         (filters.selectedCountry !== '' && profile.location.includes(filters.selectedCountry)) ||
                         (filters.selectedState !== '' && profile.location.includes(filters.selectedState));
    
    return ageInRange && professionMatch && locationMatch;
  });

  const hasActiveFilters = filters.selectedProfessions.length > 0 || 
                          filters.selectedCountry !== '' || 
                          filters.selectedState !== '' ||
                          filters.ageRange[0] !== 18 || 
                          filters.ageRange[1] !== 40;
  // Show loading screen while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden page-wrapper">
      {/* Background Pattern with enhanced animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-pink-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <div ref={headerRef} className="fixed top-0 w-full backdrop-blur-lg bg-white/90 border-b border-white/20 shadow-xl z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <h1 className="text-xl font-bold tracking-wide leading-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                <span className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent font-extrabold letter-spacing-tight">
                  Shaadi
                </span>
                <span className="bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent font-light ml-1 letter-spacing-wide">
                  Mantra
                </span>
              </h1>
              <div className="flex items-center justify-start space-x-1 mt-1">
                <div className="w-6 h-0.5 bg-gradient-to-r from-gray-400 to-rose-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full pulse-indicator"></div>
                <div className="w-3 h-0.5 bg-gradient-to-r from-rose-400 to-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilter(true)}
              className="w-10 h-10 flex items-center justify-center text-neutral-600 relative bg-white border border-neutral-200 rounded-2xl shadow-sm hover-lift"
            >
              <CustomIcon name="ri-filter-3-line" />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-rose-500 rounded-full pulse-badge flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                </div>
              )}
            </button>
            <Link href="/profile" className="w-10 h-10 flex items-center justify-center bg-white border-2 border-rose-500 rounded-2xl shadow-lg hover:bg-rose-50">
              <CustomIcon name="ri-user-line" className="text-rose-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
            {/* Main Content with enhanced transitions */}
      <div className="pt-20 pb-24 px-4 relative z-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="loading-container w-16 h-16 mx-auto mb-6 bg-rose-100 border border-rose-200 rounded-2xl flex items-center justify-center shadow-lg">
              <div className="loading-spinner w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full"></div>
            </div>
            <h3 className="loading-title text-lg font-semibold text-gray-800">Finding Your Perfect Matches</h3>
            <p className="loading-subtitle text-gray-600 mt-2">Please wait while we curate profiles for you...</p>
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
        ) : currentIndex < filteredProfiles.length ? (
          <div ref={cardRef} className="max-w-sm mx-auto">
            <SwipeCard
              profile={filteredProfiles[currentIndex]}
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
              className="bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-300 shadow-lg"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Modern Bottom Navigation */}
      <ModernNavigation 
        items={[
          { href: '/dashboard', icon: 'ri-heart-line', label: 'Discover', activeIcon: 'ri-heart-fill' },
          { 
            href: '/matches', 
            icon: 'ri-chat-3-line', 
            label: matches > 0 ? `Matches (${matches})` : 'Matches'
          },
          { href: '/profile', icon: 'ri-user-line', label: 'Profile' },
          { href: '/settings', icon: 'ri-settings-line', label: 'Settings' },
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
    </div>
  );
}