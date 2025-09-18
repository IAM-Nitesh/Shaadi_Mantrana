'use client';

import { usePathname } from 'next/navigation';
import StandardHeader from './StandardHeader';

export default function HeaderWrapper() {
  const pathname = usePathname();
  const p = pathname || '';
  // Hide header on chat routes to avoid overlapping the chat head
  if (p.startsWith('/chat/')) return null;

  // Paths that should show the global back button
  const backPaths = ['/profile', '/settings', '/help', '/terms', '/privacy'];
  // For informational pages we want the back button to go back to settings
  const computedBackHref = ['/help', '/terms', '/privacy'].includes(p) ? '/settings' : '/dashboard';

  return (
    <StandardHeader
  showFilter={p === '/dashboard'}
  showBackButton={backPaths.includes(p)}
      backHref={computedBackHref}
    />
  );
}
