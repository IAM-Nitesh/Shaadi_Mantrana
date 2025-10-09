'use client';

import React from 'react';

/**
 * A simple client component boundary that only renders its children on the client side
 * This is the simplest, most reliable way to prevent SSR issues
 */
export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = React.useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  return <>{children}</>;
}