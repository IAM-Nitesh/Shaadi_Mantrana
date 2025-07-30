'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import CustomIcon from './CustomIcon';
import { ProfileService } from '../services/profile-service';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  activeIcon?: string;
  badge?: number;
}

interface ModernNavigationProps {
  items: NavItem[];
  className?: string;
}

export default function ModernNavigation({ items, className = '' }: ModernNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNavigation = (href: string) => {
    // Check if user is trying to access restricted features
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    
    if (isRestrictedRoute) {
      const canAccess = ProfileService.canAccessRestrictedFeatures();
      const isInOnboarding = ProfileService.isInOnboarding();
      
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
        
        // Redirect to profile page
        console.log('🚫 Access denied: Profile incomplete or user in onboarding');
        startTransition(() => {
          router.push('/profile');
        });
        return;
      }
    }
    
    startTransition(() => {
      router.push(href);
    });
  };

  const getNavItemClasses = (href: string) => {
    const isActive = pathname === href;
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    const canAccess = ProfileService.canAccessRestrictedFeatures();
    const isInOnboarding = ProfileService.isInOnboarding();
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
    const canAccess = ProfileService.canAccessRestrictedFeatures();
    const isInOnboarding = ProfileService.isInOnboarding();
    const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
    
    return `
      text-xl mb-1 transition-all duration-300 ease-out
      ${isActive && !isDisabled ? 'animate-heartbeat' : 'group-hover:scale-110'}
    `;
  };

  const getLabelClasses = (href: string) => {
    const isActive = pathname === href;
    const isRestrictedRoute = href === '/dashboard' || href === '/matches';
    const canAccess = ProfileService.canAccessRestrictedFeatures();
    const isInOnboarding = ProfileService.isInOnboarding();
    const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
    
    return `
      text-xs transition-all duration-300 ease-out
      ${isActive && !isDisabled ? 'font-semibold animate-fadeInScale' : 'group-hover:font-medium'}
    `;
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-white/40 shadow-2xl z-50 ${className}`} style={{boxShadow:'0 8px 32px 0 rgba(244,63,94,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)'}}>
      {/* Active indicator background */}
      <div 
        className="absolute top-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-md"
        style={{
          width: `${100 / items.length}%`,
          left: `${(items.findIndex(item => item.href === pathname) * 100) / items.length}%`,
          boxShadow: '0 2px 8px 0 rgba(244,63,94,0.10)'
        }}
      />
      
      {/* Navigation items */}
      <div className="grid grid-cols-4 h-16 relative">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const isRestrictedRoute = item.href === '/dashboard' || item.href === '/matches';
          const canAccess = ProfileService.canAccessRestrictedFeatures();
          const isInOnboarding = ProfileService.isInOnboarding();
          const isDisabled = isRestrictedRoute && (!canAccess || isInOnboarding);
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={getNavItemClasses(item.href)}
              disabled={isPending || isDisabled}
              title={isDisabled ? 'Complete your profile to access this feature' : item.label}
            >
              {/* Background highlight for active item */}
              {isActive && !isDisabled && (
                <div className="absolute inset-0 bg-rose-50/50 animate-fadeInScale" />
              )}
              
              {/* Ripple effect container */}
              <div className="absolute inset-0 overflow-hidden">
                {isActive && !isDisabled && (
                  <div className="absolute inset-0 animate-ripple opacity-20" />
                )}
              </div>
              
              {/* Icon with advanced transitions */}
              <div className="relative z-10">
                <CustomIcon 
                  name={isActive && item.activeIcon ? item.activeIcon : item.icon} 
                  className={getIconClasses(item.href)}
                />
              </div>
              
              {/* Label with stagger animation */}
              <span className={`${getLabelClasses(item.href)} relative z-10`}>
                {item.label}
              </span>
              
              {/* Badge */}
              {item.badge !== undefined && item.badge !== null && item.badge > 0 && !isDisabled && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center z-20 transform translate-x-0 translate-y-0 shadow-lg">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gray-100/60 opacity-0 group-hover:opacity-40 transition-opacity duration-200 rounded-xl" />
            </button>
          );
        })}
      </div>
      
      {/* Loading indicator */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse" />
      )}
    </div>
  );
}
