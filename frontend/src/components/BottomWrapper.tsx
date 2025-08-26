'use client';

import { usePathname } from 'next/navigation';
import SmoothNavigation from './SmoothNavigation';

export default function BottomWrapper() {
  const pathname = usePathname();
  const showNav = ['/dashboard', '/matches', '/profile', '/settings'].includes(pathname);
  if (!showNav) return null;
  return (
    <div style={{ height: 0 }}>
      <SmoothNavigation
        items={[
          { href: '/dashboard', icon: 'ri-heart-line', label: 'Discover', activeIcon: 'ri-heart-fill' },
          { href: '/matches', icon: 'ri-chat-3-line', label: 'Matches', activeIcon: 'ri-chat-3-fill' },
          { href: '/profile', icon: 'ri-user-line', label: 'Profile', activeIcon: 'ri-user-fill' },
          { href: '/settings', icon: 'ri-settings-line', label: 'Settings', activeIcon: 'ri-settings-fill' },
        ]}
      />
    </div>
  );
}
