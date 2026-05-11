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
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-pink-400 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-pink-200 rounded"></div>
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