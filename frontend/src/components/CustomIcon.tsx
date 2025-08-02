'use client';

interface CustomIconProps {
  name: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, string> = {
  // Navigation icons (custom SVG files)
  'ri-heart-line': '/icons/heart-outline.svg',
  'ri-heart-fill': '/icons/heart-filled.svg',
  'ri-heart-white': '/icons/heart-white.svg',
  'ri-user-line': '/icons/user-outline.svg',
  'ri-user-fill': '/icons/user-filled.svg',
  'ri-chat-3-line': '/icons/chat-outline.svg',
  'ri-chat-3-fill': '/icons/chat-filled.svg',
  'ri-settings-line': '/icons/settings-outline.svg',
  'ri-settings-fill': '/icons/settings-filled.svg',
  
  // Common UI icons
  'ri-camera-line': '/icons/camera.svg',
  'ri-camera-white': '/icons/camera-white.svg',
  'ri-close-line': '/icons/close.svg',
  'ri-arrow-left-line': '/icons/arrow-left.svg',
  'ri-arrow-right-s-line': '/icons/arrow-right.svg',
  'ri-filter-3-line': '/icons/filter.svg',
  'ri-filter-line': '/icons/filter.svg',
  'ri-mail-line': '/icons/mail.svg',
  'ri-shield-check-line': '/icons/shield-check.svg',
  'ri-shield-line': '/icons/shield-check.svg',
  'ri-lock-line': '/icons/lock.svg',
  'ri-briefcase-line': '/icons/briefcase.svg',
  'ri-map-pin-line': '/icons/map-pin.svg',
  'ri-error-warning-line': '/icons/warning.svg',
  'ri-check-circle-line': '/icons/check-circle.svg',
  'ri-check-circle-fill': '/icons/check-circle.svg',
  'ri-verified-badge-line': '/icons/check-circle.svg',
  'ri-eye-line': '/icons/eye.svg',
  'ri-calendar-line': '/icons/calendar.svg',
  'ri-customer-service-line': '/icons/headset.svg',
  'ri-phone-line': '/icons/phone.svg',
  'ri-question-line': '/icons/question.svg',
  'ri-file-text-line': '/icons/document.svg',
  'ri-logout-box-line': '/icons/logout.svg',
  'ri-user-heart-line': '/icons/user-heart.svg',
  'ri-building-line': '/icons/chakra.svg',
  'ri-heart-3-line': '/icons/heart-outline.svg',
  'ri-group-line': '/icons/group.svg',
  
  // Admin dashboard icons
  'ri-user-settings-line': '/icons/user.svg',
  'ri-dashboard-line': '/icons/settings.svg',
  'ri-shield-user-line': '/icons/shield-check.svg',
  'ri-information-line': '/icons/question.svg',
  'ri-login-box-line': '/icons/user.svg',
  'ri-logout-box-r-line': '/icons/logout.svg',
  'ri-mail-list-line': '/icons/mail.svg',
  'ri-user-list-line': '/icons/user.svg',
  'ri-mail-send-line': '/icons/arrow-right.svg',
  'ri-pause-circle-line': '/icons/arrow-right.svg',
  'ri-play-circle-line': '/icons/arrow-right.svg',
  'ri-user-add-line': '/icons/user.svg', // Using user icon as fallback for user-add
  'ri-edit-line': '/icons/arrow-right.svg',
  'ri-delete-bin-line': '/icons/arrow-right.svg',
  'ri-check-line': '/icons/check-circle.svg',
  'ri-arrow-up-s-line': '/icons/arrow-right.svg',
  'ri-arrow-down-s-line': '/icons/arrow-right.svg',
  'ri-pause-line': '/icons/arrow-right.svg',
  
  // Profile and form icons
  'ri-message-line': '/icons/chat-outline.svg',
  'ri-heart-pulse-line': '/icons/heart-outline.svg',
  'ri-code-s-slash-line': '/icons/arrow-right.svg',
  'ri-book-open-line': '/icons/arrow-right.svg',
  'ri-scales-3-line': '/icons/arrow-right.svg',
  'ri-calculator-line': '/icons/arrow-right.svg',
  'ri-palette-line': '/icons/arrow-right.svg',
  'ri-compass-line': '/icons/filter.svg', // Using filter icon as fallback for compass
  'ri-time-line': '/icons/calendar.svg',
  'ri-article-line': '/icons/arrow-right.svg',
  'ri-bank-line': '/icons/arrow-right.svg',
  'ri-bar-chart-line': '/icons/arrow-right.svg',
  'ri-computer-line': '/icons/arrow-right.svg',
  'ri-graduation-cap-line': '/icons/arrow-right.svg',
  'ri-restaurant-line': '/icons/arrow-right.svg',
  'ri-steering-line': '/icons/arrow-right.svg',
  'ri-shield-star-line': '/icons/arrow-right.svg',
  'ri-flight-takeoff-line': '/icons/arrow-right.svg',
  'ri-building-2-line': '/icons/arrow-right.svg',
  'ri-microscope-line': '/icons/arrow-right.svg',
  'ri-medicine-bottle-line': '/icons/arrow-right.svg',
  'ri-tooth-line': '/icons/arrow-right.svg',
  'ri-music-2-line': '/icons/arrow-right.svg',
  'ri-movie-line': '/icons/arrow-right.svg',
  'ri-quill-pen-line': '/icons/arrow-right.svg',
  'ri-t-shirt-line': '/icons/arrow-right.svg',
  'ri-run-line': '/icons/arrow-right.svg',
  'ri-user-voice-line': '/icons/arrow-right.svg',
  'ri-team-line': '/icons/arrow-right.svg',
  'ri-home-line': '/icons/arrow-right.svg',
  'ri-store-line': '/icons/arrow-right.svg',
  'ri-hotel-line': '/icons/arrow-right.svg',
  'ri-government-line': '/icons/arrow-right.svg',
  'ri-user-star-line': '/icons/arrow-right.svg',
  'ri-user-search-line': '/icons/arrow-right.svg',
  'ri-user-unfollow-line': '/icons/arrow-right.svg',
  
  // Onboarding icons
  'heart': '/icons/heart-outline.svg',
  'user': '/icons/user.svg',
  'search': '/icons/filter.svg',
  'arrow-right': '/icons/arrow-right.svg',
};

export default function CustomIcon({ name, className = '', size = 24 }: CustomIconProps) {
  const iconPath = iconMap[name];
  
  // For filled icons, use custom SVG files if available, otherwise fallback to Remix Icons
  if (name.includes('-fill') && iconPath) {
    // Use custom SVG for filled icons
  } else if (name.includes('-fill')) {
    return <i className={`${name} ${className}`} style={{ color: 'inherit' }}></i>;
  }
  
  if (!iconPath) {
    // Fallback to original Remix Icon if custom icon doesn't exist
    return <i className={`${name} ${className}`} style={{ color: 'inherit' }}></i>;
  }

  // If iconPath is a static import, use next/image. Otherwise, use <img> with eslint-disable.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img 
      src={iconPath} 
      alt={name}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ 
        filter: className.includes('text-white') 
          ? 'brightness(0) invert(1)' 
          : className.includes('text-rose-600') || className.includes('text-rose-500')
          ? 'none' // Let SVG's built-in red color show
          : 'none',
        verticalAlign: 'middle'
      }}
    />
  );
}
