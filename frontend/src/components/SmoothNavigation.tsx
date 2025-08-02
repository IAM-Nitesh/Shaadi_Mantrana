'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomIcon from './CustomIcon';
import { useServerAuth } from '../hooks/useServerAuth';
import { usePageTransition } from './PageTransitionProvider';
import { useOptimizedNavigation } from '../hooks/useOptimizedNavigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  activeIcon?: string;
  badge?: number;
}

interface SmoothNavigationProps {
  items: NavItem[];
  className?: string;
}

export default function SmoothNavigation({ items, className = '' }: SmoothNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, isAuthenticated } = useServerAuth();
  const { setTransitioning } = usePageTransition();
  const { navigateTo, preloadRoute } = useOptimizedNavigation();

  // Preload routes for better performance
  useEffect(() => {
    items.forEach(item => {
      if (item.href !== pathname) {
        preloadRoute(item.href);
      }
    });
  }, [items, pathname, preloadRoute]);

  const handleNavigation = async (href: string) => {
    // Check if user is trying to access restricted features
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    
    if (isRestrictedRoute && user) {
      const canAccess = user.profileCompleteness >= 100 && !user.isFirstLogin;
      const isInOnboarding = user.isFirstLogin || user.profileCompleteness < 100;
      
      if (!canAccess || isInOnboarding) {
        // Show toast notification
        const message = isInOnboarding 
          ? 'Please complete the onboarding process first' 
          : 'Please complete your profile to access this feature';
        
        // Create and show toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fadeInScale';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 3000);
        
        // Redirect to profile page with optimized transition
        console.log('🚫 Access denied: Profile incomplete or user in onboarding');
        navigateTo('/profile', { immediate: true });
        return;
      }
    }
    
    // Use optimized navigation for better performance
    navigateTo(href, { immediate: true });
  };

  const getNavItemClasses = (href: string) => {
    const isActive = pathname === href;
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    const canAccess = user ? (user.profileCompleteness >= 100 && !user.isFirstLogin) : false;
    const isInOnboarding = user ? (user.isFirstLogin || user.profileCompleteness < 100) : false;
    const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
    
    const baseClasses = `
      flex flex-col items-center justify-center
      relative overflow-hidden
      mobile-touch-feedback
      transition-all duration-300 ease-out
      group
      min-h-[64px] flex-1
    `;
    
    if (isDisabled) {
      return `${baseClasses} text-gray-300 cursor-not-allowed opacity-50`;
    }
    
    if (isActive) {
      return `${baseClasses} text-rose-500`;
    }
    
    return `${baseClasses} text-gray-400 hover:text-rose-500`;
  };

  const getIconClasses = (href: string) => {
    const isActive = pathname === href;
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    const canAccess = user ? (user.profileCompleteness >= 100 && !user.isFirstLogin) : false;
    const isInOnboarding = user ? (user.isFirstLogin || user.profileCompleteness < 100) : false;
    const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
    
    const baseClasses = `
      text-2xl mb-1
      transition-all duration-300 ease-out
      transform
    `;
    
    if (isDisabled) {
      return `${baseClasses} scale-90 opacity-50`;
    }
    
    if (isActive) {
      return `${baseClasses} scale-110`;
    }
    
    return `${baseClasses} group-hover:scale-105`;
  };

  const getLabelClasses = (href: string) => {
    const isActive = pathname === href;
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    const canAccess = user ? (user.profileCompleteness >= 100 && !user.isFirstLogin) : false;
    const isInOnboarding = user ? (user.isFirstLogin || user.profileCompleteness < 100) : false;
    const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
    
    const baseClasses = `
      text-xs font-medium
      transition-all duration-300 ease-out
      transform
    `;
    
    if (isDisabled) {
      return `${baseClasses} scale-90 opacity-50`;
    }
    
    if (isActive) {
      return `${baseClasses} scale-105`;
    }
    
    return `${baseClasses} group-hover:scale-105`;
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-lg z-50 nav-transition-optimized ${className}`}>
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const isRestrictedRoute = item.href === '/dashboard' || item.href === '/matches';
          const canAccess = user ? (user.profileCompleteness >= 100 && !user.isFirstLogin) : false;
          const isInOnboarding = user ? (user.isFirstLogin || user.profileCompleteness < 100) : false;
          const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
          
          return (
            <motion.button
              key={item.href}
              onClick={() => !isDisabled && handleNavigation(item.href)}
              onHoverStart={() => {
                setHoveredItem(item.href);
                // Preload on hover for instant navigation
                if (item.href !== pathname) {
                  preloadRoute(item.href);
                }
              }}
              onHoverEnd={() => setHoveredItem(null)}
              className={getNavItemClasses(item.href)}
              whileHover={!isDisabled ? { scale: 1.02 } : {}} // Reduced scale for subtler effect
              whileTap={!isDisabled ? { scale: 0.98 } : {}} // Reduced scale for subtler effect
              disabled={isDisabled}
            >
              {/* Hover effect */}
              <AnimatePresence>
                {hoveredItem === item.href && !isActive && !isDisabled && (
                  <motion.div
                    className="absolute inset-0 bg-rose-50/50 rounded-xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }} // Faster hover effect
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.div
                className={getIconClasses(item.href)}
                animate={{
                  y: isActive ? -1 : 0, // Reduced movement for smoother feel
                }}
                transition={{ duration: 0.15 }} // Faster transition
              >
                <CustomIcon 
                  name={isActive && item.activeIcon ? item.activeIcon : item.icon} 
                  className="transition-all duration-200" // Faster icon transition
                />
              </motion.div>

              {/* Label */}
              <motion.span
                className={getLabelClasses(item.href)}
                animate={{
                  y: isActive ? -0.5 : 0, // Reduced movement for smoother feel
                }}
                transition={{ duration: 0.15 }} // Faster transition
              >
                {item.label}
              </motion.span>

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </motion.div>
              )}

              {/* Loading indicator */}
              {isPending && pathname === item.href && (
                <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} // Faster loading indicator
                >
                  <motion.div
                    className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} // Faster rotation
                  />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
} 