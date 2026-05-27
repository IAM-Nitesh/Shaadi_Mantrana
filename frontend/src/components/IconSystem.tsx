/**
 * Icon System for Shaadi Mantrana
 * Centralized icon management with Android-optimized sizing and accessibility
 */

import React from 'react';
import Image from 'next/image';

// Icon size tokens for consistent sizing across Android app
export const ICON_SIZES = {
  xs: 16,    // Small icons for dense UI
  sm: 20,    // Standard small icons
  md: 24,    // Default icon size
  lg: 28,    // Medium icons
  xl: 32,    // Large icons
  '2xl': 40, // Extra large icons
  '3xl': 48, // Hero icons
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// Icon categories for better organization
export const ICON_CATEGORIES = {
  NAVIGATION: 'navigation',
  ACTIONS: 'actions',
  STATUS: 'status',
  COMMUNICATION: 'communication',
  SOCIAL: 'social',
  SYSTEM: 'system',
  MEDIA: 'media',
} as const;

export type IconCategory = typeof ICON_CATEGORIES[keyof typeof ICON_CATEGORIES];

// Comprehensive icon mapping with categories and descriptions
export const ICON_REGISTRY = {
  // Navigation Icons
  'ri-home-line': {
    path: '/icons/home.svg',
    category: ICON_CATEGORIES.NAVIGATION,
    description: 'Home navigation',
    aliases: ['home', 'house'],
  },
  'ri-heart-line': {
    path: '/icons/heart-outline.svg',
    category: ICON_CATEGORIES.SOCIAL,
    description: 'Heart outline for likes',
    aliases: ['like', 'love', 'heart'],
  },
  'ri-heart-fill': {
    path: '/icons/heart-filled.svg',
    category: ICON_CATEGORIES.SOCIAL,
    description: 'Filled heart for liked state',
    aliases: ['liked', 'loved', 'heart-filled'],
  },
  'ri-user-line': {
    path: '/icons/user-outline.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'User profile outline',
    aliases: ['profile', 'person', 'account'],
  },
  'ri-user-fill': {
    path: '/icons/user-filled.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'User profile filled',
    aliases: ['profile-filled', 'person-filled'],
  },
  'ri-chat-3-line': {
    path: '/icons/chat-outline.svg',
    category: ICON_CATEGORIES.COMMUNICATION,
    description: 'Chat/messages outline',
    aliases: ['chat', 'messages', 'conversation'],
  },
  'ri-chat-3-fill': {
    path: '/icons/chat-filled.svg',
    category: ICON_CATEGORIES.COMMUNICATION,
    description: 'Chat/messages filled',
    aliases: ['chat-filled', 'messages-filled'],
  },
  'ri-settings-line': {
    path: '/icons/settings-outline.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Settings outline',
    aliases: ['settings', 'preferences', 'gear'],
  },
  'ri-settings-fill': {
    path: '/icons/settings-filled.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Settings filled',
    aliases: ['settings-filled', 'preferences-filled'],
  },

  // Action Icons
  'ri-camera-line': {
    path: '/icons/camera.svg',
    category: ICON_CATEGORIES.MEDIA,
    description: 'Camera for photo capture',
    aliases: ['camera', 'photo', 'picture'],
  },
  'ri-camera-white': {
    path: '/icons/camera-white.svg',
    category: ICON_CATEGORIES.MEDIA,
    description: 'White camera icon',
    aliases: ['camera-white', 'photo-white'],
  },
  'ri-close-line': {
    path: '/icons/close.svg',
    category: ICON_CATEGORIES.ACTIONS,
    description: 'Close/dismiss action',
    aliases: ['close', 'dismiss', 'cancel', 'x'],
  },
  'ri-arrow-left-line': {
    path: '/icons/arrow-left.svg',
    category: ICON_CATEGORIES.NAVIGATION,
    description: 'Back/previous navigation',
    aliases: ['back', 'previous', 'left'],
  },
  'ri-arrow-right-s-line': {
    path: '/icons/arrow-right.svg',
    category: ICON_CATEGORIES.NAVIGATION,
    description: 'Forward/next navigation',
    aliases: ['forward', 'next', 'right'],
  },
  'ri-filter-3-line': {
    path: '/icons/filter.svg',
    category: ICON_CATEGORIES.ACTIONS,
    description: 'Filter/search options',
    aliases: ['filter', 'search', 'sort'],
  },

  // Status Icons
  'ri-check-circle-line': {
    path: '/icons/check-circle.svg',
    category: ICON_CATEGORIES.STATUS,
    description: 'Success/completion status',
    aliases: ['success', 'complete', 'done', 'check'],
  },
  'ri-error-warning-line': {
    path: '/icons/warning.svg',
    category: ICON_CATEGORIES.STATUS,
    description: 'Warning/error status',
    aliases: ['warning', 'error', 'alert'],
  },
  'ri-shield-check-line': {
    path: '/icons/shield-check.svg',
    category: ICON_CATEGORIES.STATUS,
    description: 'Verified/secure status',
    aliases: ['verified', 'secure', 'shield'],
  },

  // Communication Icons
  'ri-mail-line': {
    path: '/icons/mail.svg',
    category: ICON_CATEGORIES.COMMUNICATION,
    description: 'Email communication',
    aliases: ['email', 'mail', 'message'],
  },
  'ri-phone-line': {
    path: '/icons/phone.svg',
    category: ICON_CATEGORIES.COMMUNICATION,
    description: 'Phone communication',
    aliases: ['phone', 'call', 'telephone'],
  },

  // System Icons
  'ri-lock-line': {
    path: '/icons/lock.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Security/lock',
    aliases: ['lock', 'secure', 'private'],
  },
  'ri-shield-keyhole-line': {
    path: '/icons/shield-check.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Privacy shield/policy',
    aliases: ['privacy', 'policy'],
  },
  'ri-logout-box-line': {
    path: '/icons/logout.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Logout/sign out',
    aliases: ['logout', 'signout', 'exit'],
  },
  'ri-logout-box-r-line': {
    path: '/icons/logout.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Logout/sign out right',
    aliases: ['logout', 'signout', 'exit'],
  },
  'ri-door-open-line': {
    path: '/icons/logout.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Session/door open',
    aliases: ['session', 'door', 'logout'],
  },
  'ri-file-list-3-line': {
    path: '/icons/document.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'File list/terms',
    aliases: ['terms', 'document', 'file'],
  },
  'ri-account-circle-line': {
    path: '/icons/user.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Account circle',
    aliases: ['account', 'user', 'profile'],
  },

  // Profile Icons
  'ri-briefcase-line': {
    path: '/icons/briefcase.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Work/profession',
    aliases: ['work', 'job', 'profession'],
  },
  'ri-map-pin-line': {
    path: '/icons/map-pin.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Location/place',
    aliases: ['location', 'place', 'address'],
  },
  'ri-calendar-line': {
    path: '/icons/calendar.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Date/time',
    aliases: ['date', 'time', 'schedule'],
  },

  // Social Icons
  'ri-user-heart-line': {
    path: '/icons/user-heart.svg',
    category: ICON_CATEGORIES.SOCIAL,
    description: 'User with heart',
    aliases: ['user-heart', 'profile-heart'],
  },
  'ri-group-line': {
    path: '/icons/group.svg',
    category: ICON_CATEGORIES.SOCIAL,
    description: 'Group/community',
    aliases: ['group', 'community', 'team'],
  },

  // Support Icons
  'ri-customer-service-line': {
    path: '/icons/headset.svg',
    category: ICON_CATEGORIES.COMMUNICATION,
    description: 'Customer support',
    aliases: ['support', 'help', 'service'],
  },
  'ri-question-line': {
    path: '/icons/question.svg',
    category: ICON_CATEGORIES.SYSTEM,
    description: 'Help/question',
    aliases: ['help', 'question', 'info'],
  },
  'ri-eye-line': {
    path: '/icons/eye.svg',
    category: ICON_CATEGORIES.ACTIONS,
    description: 'View/visibility',
    aliases: ['view', 'see', 'visibility'],
  },
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

export interface IconProps {
  name: IconName | string;
  size?: IconSize | number;
  className?: string;
  color?: string;
  alt?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

/**
 * Optimized Icon Component for Android Mobile App
 * Features:
 * - Consistent sizing with touch-friendly targets
 * - Accessibility support
 * - Fallback to Remix Icons
 * - Performance optimized with Next.js Image
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  color,
  alt,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = false,
}) => {
  // Get icon size
  const iconSize = typeof size === 'number' ? size : ICON_SIZES[size];
  
  // Get icon metadata
  const iconData = ICON_REGISTRY[name as IconName];
  
  // Generate alt text if not provided
  const altText = alt || iconData?.description || `${name} icon`;
  
  // Generate aria-label if not provided and not hidden
  const ariaLabelText = ariaLabel || (ariaHidden ? undefined : altText);

  // If we have a custom SVG path, use Next.js Image
  if (iconData?.path) {
    return (
      <Image
        src={iconData.path}
        alt={altText}
        width={iconSize}
        height={iconSize}
        className={`inline-block ${className}`}
        style={{
          color: color || 'inherit',
          filter: className.includes('text-white') 
            ? 'brightness(0) invert(1)' 
            : color 
            ? `brightness(0) saturate(100%) ${color}` 
            : 'none',
          verticalAlign: 'middle',
        }}
        aria-label={ariaLabelText}
        aria-hidden={ariaHidden}
        role={ariaHidden ? 'presentation' : 'img'}
        data-icon={name}
      />
    );
  }

  // Fallback to Remix Icons
  return (
    <i
      className={`${name} ${className}`}
      style={{
        fontSize: `${iconSize}px`,
        color: color || 'inherit',
        verticalAlign: 'middle',
      }}
      aria-label={ariaLabelText}
      aria-hidden={ariaHidden}
      role={ariaHidden ? 'presentation' : 'img'}
      data-icon={name}
    />
  );
};

/**
 * Icon Button Component - Touch-friendly button with icon
 * Optimized for Android with proper touch targets
 */
interface IconButtonProps extends Omit<IconProps, 'aria-hidden'> {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: IconSize | number;
  'aria-label': string; // Required for accessibility
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  variant = 'ghost',
  'aria-label': ariaLabel,
  ...iconProps
}) => {
  const iconSize = typeof size === 'number' ? size : ICON_SIZES[size];
  
  const baseClasses = `
    inline-flex items-center justify-center
    touch-target-min
    android-touch-feedback
    rounded-lg
    transition-all duration-150 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500',
    secondary: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 focus:ring-rose-500',
    ghost: 'text-rose-600 hover:bg-rose-50 focus:ring-rose-500',
    danger: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
  };

  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
    '2xl': 'p-4',
    '3xl': 'p-5',
  };

  const sizeKey = typeof size === 'number' ? 'md' : size;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[sizeKey]} ${className}`}
      aria-label={ariaLabel}
      type="button"
    >
      <Icon
        name={name}
        size={iconSize}
        aria-hidden={true}
        {...iconProps}
      />
    </button>
  );
};

/**
 * Icon with Text Component - For navigation items and labels
 */
interface IconTextProps extends IconProps {
  text: string;
  direction?: 'horizontal' | 'vertical';
  textSize?: 'xs' | 'sm' | 'base' | 'lg';
}

export const IconText: React.FC<IconTextProps> = ({
  name,
  text,
  direction = 'vertical',
  textSize = 'sm',
  size = 'md',
  className = '',
  ...iconProps
}) => {
  const containerClasses = direction === 'vertical' 
    ? 'flex flex-col items-center space-y-1' 
    : 'flex items-center space-x-2';

  const textClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`${containerClasses} ${className}`}>
      <Icon
        name={name}
        size={size}
        aria-hidden={true}
        {...iconProps}
      />
      <span className={`${textClasses[textSize]} font-medium`}>
        {text}
      </span>
    </div>
  );
};

/**
 * Icon Registry Utilities
 */
export const IconUtils = {
  /**
   * Get all icons by category
   */
  getIconsByCategory: (category: IconCategory): IconName[] => {
    return Object.keys(ICON_REGISTRY).filter(
      iconName => ICON_REGISTRY[iconName as IconName].category === category
    ) as IconName[];
  },

  /**
   * Search icons by name or alias
   */
  searchIcons: (query: string): IconName[] => {
    const lowercaseQuery = query.toLowerCase();
    return Object.keys(ICON_REGISTRY).filter(iconName => {
      const icon = ICON_REGISTRY[iconName as IconName];
      return (
        iconName.toLowerCase().includes(lowercaseQuery) ||
        icon.description.toLowerCase().includes(lowercaseQuery) ||
        icon.aliases.some(alias => alias.toLowerCase().includes(lowercaseQuery))
      );
    }) as IconName[];
  },

  /**
   * Get icon metadata
   */
  getIconInfo: (name: IconName) => {
    return ICON_REGISTRY[name];
  },

  /**
   * Check if icon exists
   */
  iconExists: (name: string): name is IconName => {
    return name in ICON_REGISTRY;
  },
};

// Export default Icon component for backward compatibility
export default Icon;
