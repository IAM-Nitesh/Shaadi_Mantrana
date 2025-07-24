'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import { AuthService } from '../../services/auth-service';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [notifications, setNotifications] = useState({
    newMatches: true,
    messages: true,
    marketing: false
  });

  const [privacy, setPrivacy] = useState({
    readReceipts: true,
    showDistance: true,
    shareProfile: false,
    ageVisible: true
  });

  // Add state to control logout animation overlay
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
    
    // Load saved settings from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    const savedPrivacy = localStorage.getItem('privacy');
    
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy));
    }
  }, [router]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privacy', JSON.stringify(privacy));
  }, [privacy]);

  const handleLogout = () => {
    // Show custom confirmation modal with enhanced GSAP animation
    setShowLogoutConfirm(true);
    
    // Enhanced entrance animation with multiple elements
    const tl = gsap.timeline();
    
    // Initial setup - make modal invisible
    gsap.set('.logout-confirm-modal', {
      opacity: 0,
      scale: 0.6,
      y: 60,
      rotation: -5
    });
    
    // Animate backdrop
    tl.fromTo('.fixed.inset-0.bg-black\\/50', {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })
    
    // Main modal entrance with bounce
    .to('.logout-confirm-modal', {
      opacity: 1,
      scale: 1,
      y: 0,
      rotation: 0,
      duration: 0.6,
      ease: "back.out(1.4)"
    }, "-=0.1")
    
    // Animate decorative elements
    .fromTo('.logout-confirm-modal h3', {
      y: 30,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.3")
    
    .fromTo('.logout-confirm-modal p', {
      y: 20,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.2")
    
    // Animate decorative line and dot
    .fromTo('.logout-confirm-modal .w-24.h-px', {
      scaleX: 0,
      opacity: 0
    }, {
      scaleX: 1,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.2")
    
    .fromTo('.logout-confirm-modal .w-2.h-2.bg-rose-300', {
      scale: 0,
      opacity: 0
    }, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "back.out(2)"
    }, "-=0.3")
    
    // Animate buttons with stagger
    .fromTo('.logout-confirm-modal button', {
      y: 40,
      opacity: 0,
      scale: 0.8
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.2)",
      stagger: 0.1
    }, "-=0.3")
    
    // Animate bottom dots
    .fromTo('.logout-confirm-modal .w-1\\.5.h-1\\.5, .logout-confirm-modal .w-1.h-1', {
      scale: 0,
      opacity: 0
    }, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.5)",
      stagger: 0.1
    }, "-=0.2");
  };

  const confirmLogout = () => {
    try {
      // Use AuthService to handle logout
      const result = AuthService.logout();
      
      if (result.success) {
        // Hide confirmation modal first
        setShowLogoutConfirm(false);
        
        // Create an enhanced GSAP logout animation sequence with heart animations
        const tl = gsap.timeline();
        
        // Phase 1: Fade out settings content with rotation
        tl.to('.settings-container', {
          opacity: 0,
          scale: 0.95,
          y: -20,
          rotation: -1,
          duration: 0.7,
          ease: "power2.inOut"
        })
        
        // Phase 2: Show logout overlay with entrance animation
        .set('.logout-overlay', {
          display: 'flex',
          opacity: 0,
          scale: 0.9
        })
        .to('.logout-overlay', {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.2)"
        })
        
        // Phase 3: Animate central success circle with bounce
        .fromTo('.logout-circle', {
          scale: 0,
          rotation: -180,
          opacity: 0
        }, {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1,
          ease: "elastic.out(1, 0.6)"
        }, "-=0.3")
        
        // Phase 4: Animate central heart icon
        .fromTo('.logout-checkmark', {
          scale: 0,
          opacity: 0,
          rotation: -90
        }, {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(2)"
        }, "-=0.5")
        
        // Phase 5: Animate floating hearts with staggered entrance
        .fromTo('.floating-heart', {
          scale: 0,
          opacity: 0,
          y: 20,
          rotation: -45
        }, {
          scale: 1,
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(1.5)",
          stagger: {
            amount: 0.8,
            from: "random"
          }
        }, "-=0.6")
        
        // Phase 6: Add floating animation to hearts
        .to('.floating-heart', {
          y: "-=10",
          rotation: "+=15",
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: {
            amount: 1,
            from: "random"
          }
        }, "-=0.3")
        
        // Phase 7: Animate text elements
        .fromTo('.logout-title', {
          y: 30,
          opacity: 0,
          scale: 0.9
        }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out"
        }, "-=1.5")
        
        .fromTo('.logout-subtitle', {
          y: 20,
          opacity: 0
        }, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.3")
        
        // Phase 8: Enhanced loading dots animation with pulsing effect
        .fromTo('.logout-dots span', {
          scale: 0.3,
          opacity: 0.2
        }, {
          scale: 1.3,
          opacity: 1,
          duration: 0.4,
          ease: "power2.inOut",
          stagger: 0.15,
          repeat: 4,
          yoyo: true
        }, "-=0.2")
        
        // Phase 9: Add continuous floating animation to decorative elements
        .fromTo('.logout-overlay .absolute.border', {
          scale: 0,
          opacity: 0,
          rotation: -180
        }, {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.8,
          ease: "elastic.out(1, 0.4)",
          stagger: 0.2
        }, "-=2")
        
        .to('.logout-overlay .absolute.border', {
          rotation: "+=360",
          duration: 8,
          ease: "none",
          repeat: -1
        }, "-=0.5")
        
        // Phase 10: Add particle floating animations
        .to('.logout-circle .absolute.animate-bounce', {
          y: "-=8",
          x: "+=3",
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.3
        }, "-=3")
        
        // Phase 11: Final exit and redirect
        .to('.logout-overlay', {
          opacity: 0,
          scale: 1.05,
          y: -30,
          duration: 0.7,
          delay: 1.5,
          ease: "power2.in",
          onComplete: () => {
            // Force redirect to home page
            window.location.href = '/';
          }
        });
        
      } else {
        // Enhanced error handling with GSAP animation
        setShowLogoutConfirm(false);
        gsap.to('.settings-container', {
          keyframes: {
            "0%": { x: 0 },
            "25%": { x: -10 },
            "50%": { x: 10 },
            "75%": { x: -5 },
            "100%": { x: 0 }
          },
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            alert('⚠️ There was an issue logging out. Please try again.');
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Error shake animation
      setShowLogoutConfirm(false);
      gsap.to('.settings-container', {
        keyframes: {
          "0%": { x: 0 },
          "25%": { x: -10 },
          "50%": { x: 10 },
          "75%": { x: -5 },
          "100%": { x: 0 }
        },
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          alert('⚠️ There was an issue logging out. Please try again.');
        }
      });
    }
  };

  const cancelLogout = () => {
    // Enhanced exit animation with multiple elements
    const tl = gsap.timeline();
    
    // Animate elements out in reverse order
    tl.to('.logout-confirm-modal .w-1\\.5.h-1\\.5, .logout-confirm-modal .w-1.h-1', {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      stagger: 0.05
    })
    
    .to('.logout-confirm-modal button', {
      y: 20,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      stagger: 0.05
    }, "-=0.1")
    
    .to('.logout-confirm-modal .w-2.h-2.bg-rose-300', {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in"
    }, "-=0.2")
    
    .to('.logout-confirm-modal .w-24.h-px', {
      scaleX: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    }, "-=0.2")
    
    .to('.logout-confirm-modal h3, .logout-confirm-modal p', {
      y: -20,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      stagger: 0.05
    }, "-=0.2")
    
    .to('.logout-confirm-modal', {
      opacity: 0,
      scale: 0.7,
      y: 50,
      rotation: 3,
      duration: 0.4,
      ease: "power2.in"
    }, "-=0.2")
    
    .to('.fixed.inset-0.bg-black\\/50', {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        setShowLogoutConfirm(false);
      }
    }, "-=0.2");
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply the setting to the app functionality
    if (key === 'newMatches' && !value) {
      // Disable new match notifications
    }
    if (key === 'messages' && !value) {
      // Disable message notifications
    }
  };

  const updatePrivacySetting = (key: string, value: boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply the setting to the app functionality
  };

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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="logout-confirm-modal bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-rose-100/60">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-3">
                Ready to log out?
              </h3>
              <p className="text-slate-600 text-base leading-relaxed font-medium text-center">
                We'll miss you! You can always come back by signing in again.
              </p>
            </div>

            {/* Decorative Elements - Removed pink circles */}
            <div className="relative mb-8">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={cancelLogout}
                className="flex-1 bg-rose-50/80 backdrop-blur-sm text-rose-700 py-4 px-6 rounded-xl font-semibold hover:bg-rose-100/80 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border border-rose-200/60 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Stay
                </span>
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="flex items-center justify-center relative z-10">
                  Log out
                </span>
              </button>
            </div>

            {/* Bottom decorative dots */}
            <div className="flex items-center justify-center space-x-2 mt-6">
              <div className="w-1.5 h-1.5 bg-rose-300 rounded-full opacity-60"></div>
              <div className="w-1 h-1 bg-pink-300 rounded-full opacity-40"></div>
              <div className="w-1.5 h-1.5 bg-rose-300 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Animation Overlay (Framer Motion only) */}
      <AnimatePresence>
        {showLogoutAnimation && (
          <motion.div
            key="logout-logo"
            className="fixed inset-0 flex flex-col items-center justify-center z-50"
            style={{ background: 'rgba(255,255,255,0.95)', border: '4px solid red' }}
          >
            <h1 style={{ color: 'black', zIndex: 100 }}>LOGOUT OVERLAY TEST</h1>
            <img src="/favicon.svg" alt="App Logo" className="w-28 h-28 mb-6 z-10" />
            <div className="w-full text-center z-10">
              <h3 className="text-2xl font-bold text-rose-600">Successfully Logged Out!</h3>
              <p className="text-gray-500 mt-2">Redirecting to login...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content (hide when animation is active) */}
      {!showLogoutAnimation && (
        <div className="settings-container">
          {/* Header */}
          <div className="fixed top-0 w-full bg-white z-40 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
                  <CustomIcon name="ri-arrow-left-line" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">Settings</h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 pb-24 px-4 space-y-4">
            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-sm transform hover:scale-105 transition-all duration-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Account</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-user-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Edit Profile</span>
                  </div>
                  <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Notifications</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-heart-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">New Matches</span>
                  </div>
                  <button
                    onClick={() => updateNotificationSetting('newMatches', !notifications.newMatches)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      notifications.newMatches ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-md ${
                        notifications.newMatches ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-message-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Messages</span>
                  </div>
                  <button
                    onClick={() => updateNotificationSetting('messages', !notifications.messages)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      notifications.messages ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-md ${
                        notifications.messages ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Privacy</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-map-pin-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Show Distance</span>
                  </div>
                  <button
                    onClick={() => updatePrivacySetting('showDistance', !privacy.showDistance)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      privacy.showDistance ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-md ${
                        privacy.showDistance ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-calendar-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Show Age</span>
                  </div>
                  <button
                    onClick={() => updatePrivacySetting('ageVisible', !privacy.ageVisible)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      privacy.ageVisible ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-md ${
                        privacy.ageVisible ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Support</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <Link href="/help" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-question-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Help & Support</span>
                  </div>
                  <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
                </Link>
                <Link href="/terms" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-file-text-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Terms of Service</span>
                  </div>
                  <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
                </Link>
                <Link href="/privacy" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CustomIcon name="ri-shield-line" className="text-gray-600" />
                    </div>
                    <span className="text-gray-800">Privacy Policy</span>
                  </div>
                  <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Enhanced Logout Button */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={handleLogout}
                className="logout-button w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white py-4 font-semibold hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group shadow-lg hover:shadow-xl"
                onMouseEnter={() => {
                  gsap.to('.logout-button', {
                    scale: 1.02,
                    boxShadow: '0 10px 25px rgba(244, 63, 94, 0.3)',
                    duration: 0.3,
                    ease: "power2.out"
                  });
                  gsap.to('.logout-text', {
                    x: 3,
                    duration: 0.3,
                    ease: "power2.out"
                  });
                }}
                onMouseLeave={() => {
                  gsap.to('.logout-button', {
                    scale: 1,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    duration: 0.3,
                    ease: "power2.out"
                  });
                  gsap.to('.logout-text', {
                    x: 0,
                    duration: 0.3,
                    ease: "power2.out"
                  });
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                {/* Button content */}
                <div className="flex items-center justify-center relative z-10">
                  <span className="logout-text font-semibold">Logout</span>
                </div>
                
                {/* Ripple effect background */}
                <div className="absolute inset-0 bg-rose-400/20 scale-0 group-active:scale-100 rounded-xl transition-transform duration-200"></div>
              </button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-0 py-0 shadow-lg">
            <div className="grid grid-cols-4 h-16">
              <Link href="/dashboard" className="flex flex-col items-center justify-center text-gray-400 transition-all duration-200 hover:bg-gray-50">
                <CustomIcon name="ri-heart-line" className="text-lg" />
                <span className="text-xs mt-1">Discover</span>
              </Link>
              <Link href="/matches" className="flex flex-col items-center justify-center text-gray-400 transition-all duration-200 hover:bg-gray-50">
                <CustomIcon name="ri-chat-3-line" className="text-lg" />
                <span className="text-xs mt-1">Matches</span>
              </Link>
              <Link href="/profile" className="flex flex-col items-center justify-center text-gray-400 transition-all duration-200 hover:bg-gray-50">
                <CustomIcon name="ri-user-line" className="text-lg" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
              <Link href="/settings" className="flex flex-col items-center justify-center text-rose-500 transition-all duration-200 hover:bg-rose-50">
                <CustomIcon name="ri-settings-line" className="text-lg" />
                <span className="text-xs mt-1">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}