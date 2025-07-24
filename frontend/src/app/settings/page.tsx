'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import { AuthService } from '../../services/auth-service';
import { gsap } from 'gsap';

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
        setShowLogoutConfirm(false);
        // --- Premium GSAP Animation for Logout Overlay ---
        const tl = gsap.timeline();
        // 1. Animate ripple circles: scale in, fade in, then pulse
        tl.fromTo('.ripple-circle', {
          scale: 0.7,
          opacity: 0
        }, {
          scale: 1.1,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          stagger: 0.08
        })
        // 2. Animate logo: scale in, rotate, fade in
        .fromTo('.ripple-center img', {
          scale: 0.7,
          opacity: 0,
          rotate: 0
        }, {
          scale: 1.1,
          opacity: 1,
          rotate: 10,
          duration: 0.5,
          ease: 'expo.out',
        }, '-=0.3')
        .to('.ripple-center img', {
          rotate: 0,
          scale: 1,
          duration: 0.3,
          ease: 'sine.inOut',
        }, '-=0.2')
        // 3. Fade in the message at the end
        .to('.animate-premium-message', {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=0.1')
        // 4. Pulse effect for ripples and logo (subtle, premium)
        .to('.ripple-circle', {
          scale: 1.13,
          duration: 0.7,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
          stagger: 0.08
        }, '-=0.2')
        .to('.ripple-center img', {
          scale: 1.07,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        }, '-=0.5')
        // 5. Optional: Play a soft chime or whoosh audio cue
        .call(() => {
          // Uncomment and provide a valid audio file if desired
          // const audio = new Audio('/audio/logout-chime.mp3');
          // audio.volume = 0.2;
          // audio.play();
        })
        // 6. Exit and redirect
        .to('.logout-overlay', {
          opacity: 0,
          scale: 1.05,
          y: -30,
          duration: 0.7,
          delay: 0.7,
          ease: 'power2.in',
          onComplete: () => {
            window.location.href = '/';
          }
        });
      } else {
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
      setShowLogoutConfirm(false);
      alert('Logout failed. Please try again.');
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

      {/* Premium Circular Ripple Collapse Logout Overlay */}
      <div className="logout-overlay fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/95 via-rose-50/90 to-pink-50/95 backdrop-blur-2xl">
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          {/* Animated Ripple Circles */}
          <div className="ripple-container absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`ripple-circle absolute rounded-full border-2 border-rose-300/40`}
                style={{
                  width: `${120 + i * 80}px`,
                  height: `${120 + i * 80}px`,
                  left: `calc(50% - ${(120 + i * 80) / 2}px)`,
                  top: `calc(50% - ${(120 + i * 80) / 2}px)`
                }}
              />
            ))}
          </div>
          {/* Central Logo with GSAP animation */}
          <div className="ripple-center bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 shadow-2xl rounded-full flex items-center justify-center" style={{ width: 120, height: 120 }}>
            {/* Use the Shaadi Matra logo SVG */}
            <img src="/icon.svg" alt="Shaadi Matra Logo" className="w-20 h-20 animate-premium-logo" />
          </div>
          {/* Success Message (fades in at the end of animation) */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center opacity-0 animate-premium-message">
            <h3 className="logout-title text-2xl font-bold text-slate-800 mb-2 drop-shadow-lg">
              Successfully Logged Out!
            </h3>
            <p className="logout-subtitle text-slate-600 text-sm leading-relaxed">
              Your session has been securely ended.<br />
              Taking you back to the login screen...
            </p>
            <div className="logout-dots flex items-center justify-center space-x-2 mt-6">
              <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
            </div>
          </div>
          {/* Optional: Play a soft chime or whoosh audio cue here for extra premiumness */}
        </div>
      </div>
    </div>
  );
}

