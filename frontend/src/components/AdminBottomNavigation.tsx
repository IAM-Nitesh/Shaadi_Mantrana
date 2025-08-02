'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CustomIcon from './CustomIcon';
import { ServerAuthService } from '../services/server-auth-service';
import { gsap } from 'gsap';
import ToastService from '../services/toastService';

export default function AdminBottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Only show on admin pages
  if (!pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Use ServerAuthService to handle logout
      const result = await ServerAuthService.logout();
      
      if (result.success) {
        // Create an enhanced GSAP logout animation sequence with heart animations
        const tl = gsap.timeline();
        
        // Phase 1: Hide the page loading indicator immediately
        tl.set('.fixed.left-0.right-0.z-\\[60\\]', {
          display: 'none'
        })
        
        // Phase 2: Fade out admin content with rotation
        .to('.admin-content', {
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
        
        // Phase 9: Border animations removed for cleaner logout experience
        
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
        gsap.to('.admin-content', {
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
            ToastService.error('⚠️ There was an issue logging out. Please try again.');
          }
        });
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Error shake animation
      gsap.to('.admin-content', {
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
          ToastService.error('⚠️ There was an issue logging out. Please try again.');
        }
      });
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-4 px-4">
          <Link
            href="/admin/dashboard"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/dashboard' 
                ? 'text-blue-600 font-semibold' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/dashboard' 
                ? 'bg-blue-100 text-blue-600 shadow-md' 
                : 'hover:bg-gray-100'
            }`}>
              <CustomIcon name="ri-dashboard-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Dashboard</span>
          </Link>

          <Link
            href="/admin/users"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/users' 
                ? 'text-blue-600 font-semibold' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/users' 
                ? 'bg-blue-100 text-blue-600 shadow-md' 
                : 'hover:bg-gray-100'
            }`}>
              <CustomIcon name="ri-user-settings-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Users</span>
          </Link>

          <Link
            href="/admin/email-invitations"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/email-invitations' 
                ? 'text-blue-600 font-semibold' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/email-invitations' 
                ? 'bg-blue-100 text-blue-600 shadow-md' 
                : 'hover:bg-gray-100'
            }`}>
              <CustomIcon name="ri-mail-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Invitations</span>
          </Link>

          <Link
            href="/admin/data-safety"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/data-safety' 
                ? 'text-blue-600 font-semibold' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/data-safety' 
                ? 'bg-blue-100 text-blue-600 shadow-md' 
                : 'hover:bg-gray-100'
            }`}>
              <CustomIcon name="ri-shield-check-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Data Safety</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 text-red-600 hover:text-red-700"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 hover:bg-red-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>

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
            
            {/* Success Circle */}
            <div className="logout-circle flex items-center justify-center mx-auto mb-6 relative">
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
            
            {/* Loading dots removed */}
            
            {/* Redirect Message */}
            <p className="text-slate-500 text-xs mt-4">
              Redirecting to home page...
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 