'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import CustomIcon from './CustomIcon';
import RoyalIcon from './RoyalIcon';
import { useAuth } from '../contexts/AuthContext';
// Avoid importing server-only auth service in client components
import { safeGsap } from './SafeGsap';
import ToastService from '../services/toastService';

export default function AdminBottomNavigation() {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Only show on admin pages
  if (!pathname?.startsWith('/admin')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Call the centralized logout method
      await logout();

      // Handle the beautiful logout animation and redirect
      const canAnimate = typeof document !== 'undefined' && (
        document.querySelector('.admin-content') || document.querySelector('.logout-overlay')
      );

      if (canAnimate) {
        const tl = safeGsap.timeline?.();

        tl?.to?.('.admin-content', {
          opacity: 0,
          scale: 0.95,
          y: -20,
          duration: 0.6,
          ease: 'power2.inOut'
        });

        tl?.set?.('.logout-overlay', { display: 'flex', opacity: 0, scale: 0.9, zIndex: 9999 });
        tl?.to?.('.logout-overlay', { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.2)' });

        tl?.fromTo?.('.logout-circle', { scale: 0, rotation: -180, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.6)' }, '-=0.3');
        tl?.fromTo?.('.logout-checkmark', { scale: 0, opacity: 0, rotation: -90 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: 'back.out(2)' }, '-=0.5');

        tl?.fromTo?.('.logout-title', { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, '-=1.5');
        tl?.fromTo?.('.logout-subtitle', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3');

        tl?.to?.('.logout-circle .absolute.animate-bounce', { y: '-=8', x: '+=3', duration: 1.5, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.3 }, '-=3');

        tl?.to?.('.logout-overlay', { opacity: 0, scale: 1.05, y: -30, duration: 0.7, delay: 1.5, ease: 'power2.in', onComplete: () => { window.location.href = '/'; } });
      } else {
        // Fallback for when animation elements are not available
        safeGsap.set?.('.logout-overlay', { display: 'flex', opacity: 0, scale: 0.9, zIndex: 9999 });
        safeGsap.to?.('.logout-overlay', { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.2)' });
        setTimeout(() => { window.location.href = '/'; }, 1600);
      }
    } catch {
      // Enhanced error handling with user feedback
      safeGsap.to?.('.admin-content', {
        keyframes: [ { x: -10 }, { x: 10 }, { x: -5 }, { x: 0 } ],
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          ToastService.error('⚠️ There was an issue logging out. Please try again.');
        }
      });
    }
  };

  return (
    <>
      <div role="navigation" aria-label="Admin bottom navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-royal-glass backdrop-blur-sm border-t border-royal-glass-border shadow-lg" style={{ height: 'calc(var(--bottom-nav-height, 5rem) + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-full px-4">
          <Link
            href="/admin/dashboard"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/dashboard' 
                ? 'text-royal-gold font-semibold' 
                : 'text-white/80 font-inter hover:text-royal-gold'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/dashboard' 
                ? 'bg-royal-gold/10 text-royal-gold shadow-md' 
                : 'hover:bg-royal-gold/5'
            }`}>
              <CustomIcon name="ri-home-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Dashboard</span>
          </Link>

          <Link
            href="/admin/users"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/users' 
                ? 'text-royal-gold font-semibold' 
                : 'text-white/80 font-inter hover:text-royal-gold'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/users' 
                ? 'bg-royal-gold/10 text-royal-gold shadow-md' 
                : 'hover:bg-royal-gold/5'
            }`}>
              <CustomIcon name="ri-group-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Users</span>
          </Link>

          <Link
            href="/admin/phone-invitations"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/phone-invitations' 
                ? 'text-royal-gold font-semibold' 
                : 'text-white/80 font-inter hover:text-royal-gold'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/phone-invitations' 
                ? 'bg-royal-gold/10 text-royal-gold shadow-md' 
                : 'hover:bg-royal-gold/5'
            }`}>
              <CustomIcon name="ri-mail-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Invitations</span>
          </Link>

          <Link
            href="/admin/data-safety"
            className={`flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 ${
              pathname === '/admin/data-safety' 
                ? 'text-royal-gold font-semibold' 
                : 'text-white/80 font-inter hover:text-royal-gold'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              pathname === '/admin/data-safety' 
                ? 'bg-royal-gold/10 text-royal-gold shadow-md' 
                : 'hover:bg-royal-gold/5'
            }`}>
              <CustomIcon name="ri-shield-check-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Data Safety</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center space-y-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 text-white/80 hover:text-royal-gold"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 hover:bg-royal-gold/10">
              <CustomIcon name="ri-logout-box-r-line" className="text-xl" />
            </div>
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Animation Overlay */}
  <div className="logout-overlay fixed inset-0 bg-royal-obsidian backdrop-blur-sm z-[9999] hidden items-center justify-center p-4" style={{ display: 'none' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
        
        {/* Animated Hearts Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Heart 1 */}
          <div className="floating-heart absolute" style={{ left: '10%', top: '20%' }}>
            <div className="w-6 h-6 text-royal-gold opacity-80">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 2 */}
          <div className="floating-heart absolute" style={{ right: '15%', top: '30%' }}>
            <div className="w-5 h-5 text-royal-gold-light opacity-70">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 3 */}
          <div className="floating-heart absolute" style={{ left: '20%', bottom: '25%' }}>
            <div className="w-4 h-4 text-royal-gold opacity-90">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 4 */}
          <div className="floating-heart absolute" style={{ right: '25%', bottom: '35%' }}>
            <div className="w-5 h-5 text-royal-crimson opacity-60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Main Content Container */}
        <div className="bg-royal-glass backdrop-blur-xl border border-royal-glass-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden group">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-royal-gold/5 to-royal-gold-light/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
          
          <div className="relative z-10">
            {/* Brand Logo */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                <span className="bg-gradient-to-r from-royal-gold via-royal-gold-light to-royal-gold bg-clip-text text-transparent">
                  Shaadi
                </span>
                <span className="bg-gradient-to-r from-royal-gold via-royal-gold-light to-royal-gold bg-clip-text text-transparent ml-2">
                  Mantrana
                </span>
              </h1>
              <p className="text-white/80 font-inter text-sm">
                Your journey to forever starts here
              </p>
            </div>
            
            {/* Success Circle */}
            <div className="logout-circle flex items-center justify-center mx-auto mb-6 relative">
              <div className="logout-checkmark">
                <RoyalIcon size="6xl" className="animate-pulse drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
              </div>
            </div>
            
            {/* Success Message */}
            <div className="mb-6">
              <h2 className="logout-title text-xl font-bold text-royal-gold font-playfair mb-2">Successfully Logged Out!</h2>
              <p className="logout-subtitle text-white/80 font-inter text-sm">
                Thank you for using Shaadi Mantrana. We hope you found your perfect match!
              </p>
            </div>
            
            {/* Loading dots removed */}
            
            {/* Redirect Message */}
            <p className="text-royal-gold/60 font-inter text-xs mt-4">
              Redirecting to home page...
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
 