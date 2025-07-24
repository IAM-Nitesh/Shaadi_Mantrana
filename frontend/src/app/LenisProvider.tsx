'use client';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      gestureOrientation: 'vertical',
      duration: 0.5, // Lower duration for faster scroll
      easing: (t: number) => t, // Linear easing for snappier feel
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  return <>{children}</>;
} 