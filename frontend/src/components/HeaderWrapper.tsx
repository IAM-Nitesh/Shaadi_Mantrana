'use client';

import { usePathname } from 'next/navigation';
import StandardHeader from './StandardHeader';

export default function HeaderWrapper() {
  const pathname = usePathname();
  // Hide header on chat routes to avoid overlapping the chat head
  if (pathname && pathname.startsWith('/chat/')) return null;

  // Paths that should show the global back button
  const backPaths = ['/profile', '/settings', '/help', '/terms', '/privacy'];
  // For informational pages we want the back button to go back to settings
  const computedBackHref = ['/help', '/terms', '/privacy'].includes(pathname) ? '/settings' : '/dashboard';

  return (
    <StandardHeader
      showFilter={pathname === '/dashboard'}
      showBackButton={backPaths.includes(pathname || '')}
      backHref={computedBackHref}
    />
  );
}
