'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition, useState, useEffect, useMemo, useCallback, memo } from 'react';
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

// Simplified navigation item component with subtle animations
const NavigationItem = memo(({ 
  item, 
  isActive, 
  isDisabled, 
  onNavigate, 
  onHover 
}: {
  item: NavItem;
  isActive: boolean;
  isDisabled: boolean;
  onNavigate: (href: string) => void;
  onHover: (href: string | null) => void;
}) => {
  const getNavItemClasses = useMemo(() => {
    const baseClasses = `
      flex flex-col items-center justify-center
      relative overflow-visible
      mobile-touch-feedback android-touch-target
      transition-all duration-150 ease-out
      group
      min-h-[64px] flex-1
    `;
    
    if (isDisabled) {
      return `${baseClasses} text-gray-300 cursor-not-allowed opacity-50`;
    }
    
    return `${baseClasses} text-rose-500`;
  }, [isDisabled]);

  const getIconClasses = useMemo(() => {
    const baseClasses = `nav-icon ${isActive ? 'active' : ''}`;
    return baseClasses;
  }, [isActive]);

  const getLabelClasses = useMemo(() => {
    const baseClasses = `
      text-xs font-medium
      transition-all duration-150 ease-out
      transform
      text-rose-500
    `;
    
    if (isDisabled) {
      return `${baseClasses} text-gray-300`;
    }
    
    if (isActive) {
      return `${baseClasses} font-semibold`;
    }
    
    return `${baseClasses}`;
  }, [isActive, isDisabled]);

  return (
    <motion.button
      onClick={() => !isDisabled && onNavigate(item.href)}
      onMouseEnter={() => onHover(item.href)}
      onMouseLeave={() => onHover(null)}
      className={getNavItemClasses}
      disabled={isDisabled}
      whileHover={{ scale: isDisabled ? 1 : 1.01 }} // Minimal scale effect
      whileTap={{ scale: isDisabled ? 1 : 0.99 }} // Minimal press effect
      transition={{ duration: 0.08 }} // Ultra-fast transition
    >
      {/* Icon */}
      <motion.div
        className={getIconClasses}
        animate={{
          y: isActive ? -0.5 : 0, // Minimal movement
        }}
        transition={{ duration: 0.08 }} // Ultra-fast transition
      >
        <CustomIcon 
          name={isActive && item.activeIcon ? item.activeIcon : item.icon} 
          className="text-2xl"
        />
      </motion.div>

      {/* Label */}
      <motion.span
        className={getLabelClasses}
        animate={{
          y: isActive ? -0.5 : 0, // Minimal movement
        }}
        transition={{ duration: 0.08 }} // Ultra-fast transition
      >
        {item.label}
      </motion.span>

      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.08 }} // Ultra-fast badge animation
          className="absolute -top-0 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-semibold leading-none shadow-sm border border-white/80"
          aria-label={`You have ${item.badge} matches`}
        >
          <span className="select-none">{item.badge > 99 ? '99+' : item.badge}</span>
        </motion.div>
      )}
    </motion.button>
  );
});

NavigationItem.displayName = 'NavigationItem';

function SmoothNavigation({ items, className = '' }: SmoothNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, isAuthenticated } = useServerAuth();
  const { setTransitioning } = usePageTransition();
  const { navigateTo, preloadRoutes } = useOptimizedNavigation();

  // Performance optimization: Memoized route preloading
  const routePaths = useMemo(() => items.map(item => item.href), [items]);
  
  // Preload routes for better performance
  useEffect(() => {
    const routesToPreload = routePaths.filter(href => href !== pathname);
    if (routesToPreload.length > 0) {
      preloadRoutes(routesToPreload);
    }
  }, [routePaths, pathname, preloadRoutes]);

  // Performance optimization: Memoized navigation handler
  const handleNavigation = useCallback(async (href: string) => {
    // Check if user is trying to access restricted features
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    
    if (isRestrictedRoute && user) {
      // Access Control Logic: Only allow access if profileCompleteness is 100%
      const canAccess = user.profileCompleteness >= 100;
      const isFirstLogin = user.isFirstLogin;
      
      if (!canAccess) {
        // Show toast notification
        const message = isFirstLogin 
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
        navigateTo('/profile', { immediate: true });
        return;
      }
    }
    
    // Use optimized navigation for better performance
    navigateTo(href, { immediate: true });
  }, [user, navigateTo]);

  // Performance optimization: Memoized hover handler
  const handleHover = useCallback((href: string | null) => {
    setHoveredItem(href);
  }, []);

  // Performance optimization: Memoized navigation items
  const navigationItems = useMemo(() => 
    items.map(item => {
      const isActive = pathname === item.href;
      const isRestrictedRoute = item.href === '/dashboard' || item.href === '/matches';
      const canAccess = user ? (user.profileCompleteness >= 100) : false;
      const isFirstLogin = user ? user.isFirstLogin : false;
      const isDisabled = isRestrictedRoute && !canAccess;

      return {
        item,
        isActive,
        isDisabled,
      };
    }), [items, pathname, user]
  );

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }} // Minimal entrance animation
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }} // Smooth, natural easing
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg ${className}`}
    >
      <div className="flex justify-around items-center py-4 px-4">
        <AnimatePresence>
          {navigationItems.map(({ item, isActive, isDisabled }) => (
            <NavigationItem
              key={item.href}
              item={item}
              isActive={isActive}
              isDisabled={isDisabled}
              onNavigate={handleNavigation}
              onHover={handleHover}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default memo(SmoothNavigation); 