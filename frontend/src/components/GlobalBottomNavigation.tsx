'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import SmoothNavigation from './SmoothNavigation';
import { userNavItems } from '../config/navigation';

export default function GlobalBottomNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  // Show bottom navigation on main app pages
  const currentPath = pathname ?? '';
  const showNav = currentPath.startsWith('/dashboard') || 
                  currentPath.startsWith('/matches') || 
                  currentPath.startsWith('/profile') || 
                  currentPath.startsWith('/settings');
  
  if (!showNav) return null;
  
  return <SmoothNavigation items={userNavItems} />;
}
