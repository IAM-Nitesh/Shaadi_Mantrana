'use client';

import { usePathname } from 'next/navigation';
import StandardHeader from './StandardHeader';

export default function HeaderWrapper() {
  const pathname = usePathname();
  // Hide header on chat routes to avoid overlapping the chat head
  if (pathname && pathname.startsWith('/chat/')) return null;

  return (
    <StandardHeader
      showFilter={pathname === '/dashboard'}
      showBackButton={['/profile', '/settings'].includes(pathname)}
      backHref="/dashboard"
    />
  );
}
