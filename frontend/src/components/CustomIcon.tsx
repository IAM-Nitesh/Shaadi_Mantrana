'use client';

interface CustomIconProps {
  name: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, string> = {
  'ri-heart-line': '/icons/heart-outline.svg',
  'ri-heart-fill': '/icons/heart-filled.svg',
  'ri-heart-white': '/icons/heart-white.svg',
  'ri-camera-line': '/icons/camera.svg',
  'ri-camera-white': '/icons/camera-white.svg',
  'ri-user-line': '/icons/user.svg',
  'ri-chat-3-line': '/icons/chat.svg',
  'ri-message-line': '/icons/chat.svg',
  'ri-settings-line': '/icons/settings.svg',
  'ri-filter-3-line': '/icons/filter.svg',
  'ri-filter-line': '/icons/filter.svg',
  'ri-close-line': '/icons/close.svg',
  'ri-arrow-left-line': '/icons/arrow-left.svg',
  'ri-arrow-right-s-line': '/icons/arrow-right.svg',
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
  'ri-database-2-line': '/icons/briefcase.svg',
  'ri-dashboard-line': '/icons/settings.svg',
  'ri-refresh-line': '/icons/arrow-right.svg',
  'ri-shield-user-line': '/icons/shield-check.svg',
  'ri-settings-3-line': '/icons/settings.svg',
  'ri-download-line': '/icons/arrow-right.svg',
  'ri-save-line': '/icons/arrow-right.svg',
  'ri-file-list-line': '/icons/document.svg',
  'ri-percent-line': '/icons/check-circle.svg',
  'ri-time-line': '/icons/calendar.svg',
  'ri-cloud-line': '/icons/briefcase.svg',
  'ri-hard-drive-line': '/icons/briefcase.svg',
  'ri-heart-pulse-line': '/icons/heart-outline.svg',
  'ri-loader-4-line': '/icons/arrow-right.svg',
  // Admin login page icons
  'ri-information-line': '/icons/question.svg',
  'ri-login-box-line': '/icons/user.svg',
  // Additional admin icons
  'ri-mail-list-line': '/icons/mail.svg',
  'ri-add-line': '/icons/arrow-right.svg',
  'ri-send-plane-line': '/icons/arrow-right.svg',
  'ri-lock-password-line': '/icons/lock.svg',
  'ri-user-list-line': '/icons/user.svg',
  'ri-pause-circle-line': '/icons/arrow-right.svg',
  'ri-play-circle-line': '/icons/arrow-right.svg',
  'ri-more-2-fill': '/icons/arrow-right.svg', // Ellipsis menu icon
  'ri-mail-send-line': '/icons/arrow-right.svg', // Resend invite icon
  'ri-eye-line': '/icons/eye.svg',
  'ri-edit-line': '/icons/arrow-right.svg',
  'ri-delete-bin-line': '/icons/arrow-right.svg',
  'ri-customer-service-2-line': '/icons/headset.svg',
  'ri-file-list-3-line': '/icons/document.svg',
  'ri-check-line': '/icons/check-circle.svg',
  // Onboarding icons
  'heart': '/icons/heart-outline.svg',
  'user': '/icons/user.svg',
  'search': '/icons/filter.svg', // Using filter icon as fallback for search
  'arrow-right': '/icons/arrow-right.svg',
};

export default function CustomIcon({ name, className = '', size = 24 }: CustomIconProps) {
  const iconPath = iconMap[name];
  
  if (!iconPath) {
    // Fallback to original Remix Icon if custom icon doesn't exist
    return <i className={`${name} ${className}`}></i>;
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
