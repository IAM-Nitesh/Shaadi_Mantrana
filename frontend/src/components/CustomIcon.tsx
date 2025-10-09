'use client';

import { Icon, IconProps } from './IconSystem';

interface CustomIconProps extends Omit<IconProps, 'name'> {
  name: string;
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
  'ri-edit-line': '/icons/settings-outline.svg',
  'ri-delete-bin-line': '/icons/close.svg',
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

export default function CustomIcon(props: CustomIconProps) {
  // Use the new Icon component from IconSystem
  return <Icon {...props} />;
}
