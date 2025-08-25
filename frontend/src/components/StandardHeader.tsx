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

  // Automatically show filter icon only on dashboard page
  const shouldShowFilter = pathname === '/dashboard' && showFilter;

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 w-full backdrop-blur-lg bg-white/90 border-b border-white/20 shadow-xl z-50 px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
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
              className="w-10 h-10 flex items-center justify-center text-neutral-600 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors duration-200 active:scale-95"
            >
              <CustomIcon name="ri-arrow-left-line" />
            </button>
          )}
          
          {title ? (
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </h1>
          ) : (
            <div>
              <h1 className="text-xl font-bold tracking-wide leading-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                <span className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent font-extrabold letter-spacing-tight">
                  Shaadi
                </span>
                <span className="bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent font-light ml-1 letter-spacing-wide">
                  Mantrana
                </span>
              </h1>
              <div className="flex items-center justify-start space-x-1 mt-1">
                <div className="w-6 h-0.5 bg-gradient-to-r from-gray-400 to-rose-400 rounded-full"></div>
                <div className="w-3 h-0.5 bg-gradient-to-r from-rose-400 to-gray-300 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {shouldShowFilter && (
            <button
              onClick={onFilterClick}
              className="w-10 h-10 flex items-center justify-center text-neutral-600 relative bg-white border border-neutral-200 rounded-2xl shadow-sm hover-lift"
            >
              <CustomIcon name="ri-filter-3-line" />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full pulse-badge"></div>
              )}
            </button>
          )}
          
          {rightElement}
          
          {showProfileLink && (
            // Use a plain anchor to avoid Next Link/runtime issues in the current dev bundle
            <a
              href="/profile"
              aria-label="Profile"
              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-rose-500 rounded-2xl shadow-lg hover:bg-rose-50"
            >
              <CustomIcon name="ri-user-line" className="text-rose-500" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
} 