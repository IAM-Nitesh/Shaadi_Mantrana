'use client';

import { motion } from 'framer-motion';
// Avoid using Next's Link here due to runtime issues in the current dev bundle
import { useRouter } from 'next/navigation';
import CustomIcon from './CustomIcon';
import { usePathname } from 'next/navigation';

interface StandardHeaderProps {
  title?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  hasActiveFilters?: boolean;
  showProfileLink?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backHref?: string;
  rightElement?: React.ReactNode;
}

export default function StandardHeader({
  title,
  showFilter = false,
  onFilterClick,
  hasActiveFilters = false,
  showProfileLink = true,
  showBackButton = false,
  onBackClick,
  backHref,
  rightElement
}: StandardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  // Hide header on login page
  if (pathname === '/') return null;

  // Automatically show filter icon only on dashboard page
  const shouldShowFilter = pathname === '/dashboard' && showFilter;

  return (
  <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="banner"
  className="fixed top-0 left-0 right-0 backdrop-blur-lg bg-royal-obsidian/90 border-b border-white/20 shadow-xl z-50 px-4"
  style={{ 
    paddingTop: 'env(safe-area-inset-top)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)'
  }}
    >
  <div className="flex items-center justify-between w-full" style={{ height: 'var(--header-height, 4rem)' }}>
      <div className="flex items-center space-x-3 flex-none">
          {showBackButton && (
            <button
              onClick={() => {
                if (onBackClick) {
                  onBackClick();
                } else if (backHref) {
                  router.push(backHref);
                } else {
                  router.back();
                }
              }}
              className="w-10 h-10 flex items-center justify-center text-royal-gold card-modern border border-royal-glass-border rounded-2xl shadow-sm hover:bg-royal-gold/10 transition-colors duration-200 active:scale-95"
            >
              <CustomIcon name="ri-arrow-left-line" />
            </button>
          )}
          
          {title ? (
            <h1 className="text-xl font-bold text-royal-gold font-playfair">
              {title}
            </h1>
          ) : (
            <div>
              <h1 className="text-xl font-bold tracking-wide leading-tight font-playfair">
                <span className="text-white">
                  Shaadi
                </span>
                <span className="text-royal-gold ml-1">
                  Mantrana
                </span>
              </h1>
              <div className="flex items-center justify-start space-x-1 mt-1">
                <div className="w-6 h-0.5 bg-gradient-to-r from-transparent to-royal-gold/40 rounded-full"></div>
                <div className="w-3 h-0.5 bg-gradient-to-r from-royal-gold/40 to-transparent rounded-full"></div>
              </div>
            </div>
          )}
        </div>
        
  <div className="absolute inset-y-0 right-4 flex items-center space-x-4">
          {shouldShowFilter && (
            <button
              onClick={onFilterClick}
              className="w-10 h-10 flex items-center justify-center text-royal-gold relative card-modern border border-royal-glass-border rounded-2xl shadow-sm hover-lift"
            >
              <CustomIcon name="ri-filter-3-line" />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-royal-gold/50 rounded-full pulse-badge"></div>
              )}
            </button>
          )}
          
          {rightElement}
          
          {showProfileLink && (
            // Use a plain anchor to avoid Next Link/runtime issues in the current dev bundle
            <a
              href="/profile"
              aria-label="Profile"
              className="w-10 h-10 flex items-center justify-center card-modern border-2 border-royal-gold rounded-2xl shadow-lg hover:bg-royal-gold/5"
            >
              <CustomIcon name="ri-user-line" className="text-royal-gold" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}