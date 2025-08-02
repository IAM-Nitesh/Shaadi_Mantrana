'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import ServerAuthGuard from '../../components/ServerAuthGuard';
import ToastService from '../../services/toastService';
import StandardHeader from '../../components/StandardHeader';
import SmoothNavigation from '../../components/SmoothNavigation';
import { matchesCountService } from '../../services/matches-count-service';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import { useServerAuth } from '../../hooks/useServerAuth';

function SettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useServerAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Commented out for future release
  /*
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
  */

  // Add state to control logout animation overlay
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);

  // Authentication is now handled by ServerAuthGuard
  // No need for local authentication state management

  // Subscribe to matches count updates
  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });
    
    // Initial fetch
    matchesCountService.fetchCount();
    
    return unsubscribe;
  }, []);

  // Save settings to localStorage whenever they change - Commented out for future release
  /*
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privacy', JSON.stringify(privacy));
  }, [privacy]);
  */

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
    }, "-=0.3");
  };

  const confirmLogout = async () => {
    try {
      // Hide confirmation modal first
      setShowLogoutConfirm(false);
      
      // Use server-side logout
      await logout();
      
      // If we reach here, logout was successful
      // The logout function handles state updates internally
      
      // Create an enhanced GSAP logout animation sequence with heart animations
      const tl = gsap.timeline();
      
      // Phase 1: Hide the page loading indicator immediately
      tl.set('.fixed.left-0.right-0.z-\\[60\\]', {
        display: 'none'
      })
      
      // Phase 2: Fade out settings content with rotation
      .to('.settings-container', {
        opacity: 0,
        scale: 0.95,
        y: -20,
        rotation: -1,
        duration: 0.7,
        ease: "power2.inOut"
      })
      
      // Phase 3: Show logout overlay with entrance animation
      .set('.logout-overlay', {
        display: 'flex',
        opacity: 0,
        scale: 0.9,
        zIndex: 9999 // Ensure it's above everything including PageLoadingIndicator
      })
      .to('.logout-overlay', {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.2)"
      })
      
      // Phase 4: Animate central success circle with bounce
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
      
      // Phase 5: Animate central heart icon
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
      
      // Phase 6: Animate floating hearts with staggered entrance
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
      
      // Phase 7: Add floating animation to hearts
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
      
      // Phase 8: Animate text elements
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
      
      // Phase 9: Add particle floating animations
      .to('.logout-circle .absolute.animate-bounce', {
        y: "-=8",
        x: "+=3",
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.3
      }, "-=3")
      
      // Phase 10: Final exit and redirect
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
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const cancelLogout = () => {
    // Enhanced exit animation with multiple elements
    const tl = gsap.timeline();
    
    // Animate elements out in reverse order
    tl.to('.logout-confirm-modal button', {
      y: 20,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      stagger: 0.05
    })
    
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

  // Commented out for future release
  /*
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
  */

  // Show loading screen only during logout process, not for authentication check
  // The ServerAuthGuard will handle authentication loading
  if (!isAuthenticated) {
    return null; // Let ServerAuthGuard handle the loading state
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

            {/* Bottom decorative dots - Removed red dots */}
          </div>
        </div>
      )}

      {/* Logout Animation Overlay */}
      <div className="logout-overlay fixed inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
        
        {/* Animated Hearts Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Heart 1 */}
          <div className="floating-heart absolute" style={{ left: '10%', top: '20%' }}>
            <div className="w-6 h-6 text-red-400 opacity-80">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 2 */}
          <div className="floating-heart absolute" style={{ right: '15%', top: '30%' }}>
            <div className="w-5 h-5 text-pink-400 opacity-70">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 3 */}
          <div className="floating-heart absolute" style={{ left: '20%', bottom: '25%' }}>
            <div className="w-4 h-4 text-rose-400 opacity-90">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 4 */}
          <div className="floating-heart absolute" style={{ right: '25%', bottom: '35%' }}>
            <div className="w-5 h-5 text-red-500 opacity-60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Subtle Background Orbs */}
        <div className="absolute top-20 -left-20 w-48 h-48 bg-gradient-to-br from-rose-200/10 to-pink-200/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 -right-20 w-52 h-52 bg-gradient-to-br from-purple-200/10 to-rose-200/10 rounded-full blur-2xl"></div>
        
        {/* Main Content Container */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden group">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
          
          <div className="relative z-10">
            {/* Brand Logo */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                  Shaadi
                </span>
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent ml-2">
                  Mantrana
                </span>
              </h1>
              <p className="text-slate-600 text-sm">
                Your journey to forever starts here
              </p>
            </div>
            
            {/* Brand Logo */}
            <div className="logout-circle flex items-center justify-center mx-auto mb-6 relative">
              {/* Brand Logo */}
              <div className="logout-checkmark">
                <img src="/icon.svg" alt="Shaadi Mantrana" className="w-64 h-64 heartbeat-animation" />
              </div>
            </div>
            
            {/* Success Message */}
            <div className="mb-6">
              <h2 className="logout-title text-xl font-bold text-slate-800 mb-2">Successfully Logged Out!</h2>
              <p className="logout-subtitle text-slate-600 text-sm">
                Thank you for using Shaadi Mantrana. We hope you found your perfect match!
              </p>
            </div>
            
            {/* Loading Dots - Removed red dots */}
            
            {/* Redirect Message */}
            <p className="text-slate-500 text-xs">
              Redirecting to login screen...
            </p>
          </div>
          
          {/* No decorative circles */}
        </div>
      </div>

      {/* Main Content (hide when animation is active) */}
      {!showLogoutAnimation && (
        <div className="settings-container">
          {/* Header */}
          <StandardHeader 
            title="Settings"
            showBackButton={true}
            backHref="/dashboard"
          />

          {/* Content */}
          <div className="pt-20 pb-24 px-4 space-y-4">
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

            {/* Notifications - Commented out for future release */}
            {/* 
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
            */}

            {/* Privacy - Commented out for future release */}
            {/* 
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
            */}

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
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <ServerAuthGuard requireAuth={true}>
      <SettingsContent />
    </ServerAuthGuard>
  );
}