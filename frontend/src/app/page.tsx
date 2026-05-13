'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import PageDataLoadingProvider, { usePageDataLoading } from '../components/PageDataLoadingProvider';

function HomeContent() {
  const router = useRouter();
  const { user, authState, isLoading } = useAuth();
  const { setPageDataLoaded: setPageLoading } = usePageDataLoading();

  useEffect(() => {
    if (isLoading || authState === 'checking' || authState === 'unknown') {
      setPageLoading(true);
      return;
    }

    setPageLoading(false);

    if (authState === 'authenticated' && user) {
      if (user.isFirstLogin || (user.profileCompleteness || 0) < 50) {
        router.replace('/profile');
      } else if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [user, authState, isLoading, router, setPageLoading]);

  return (
    <div className="min-h-screen bg-royal-obsidian flex items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-royal-gold/10 rounded-full mix-blend-screen filter blur-[80px]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 border-2 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]"></div>
        <div className="text-royal-gold text-sm font-playfair tracking-[0.2em] uppercase animate-pulse">
          Shaadi Mantrana
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <PageDataLoadingProvider>
      <HomeContent />
    </PageDataLoadingProvider>
  );
}