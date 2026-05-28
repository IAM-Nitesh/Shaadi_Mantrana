'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import CustomIcon from '../../../components/CustomIcon';
import logger from '../../../utils/logger';

export default function AdminLogin() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated and is admin
    if (!isLoading && isAuthenticated && user?.role === 'admin') {
      logger.debug('✅ AdminLogin: User already authenticated as admin, redirecting to dashboard');
      router.replace('/admin/dashboard');
    }
  }, [router, isLoading, isAuthenticated, user]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-royal-glass rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <CustomIcon name="ri-shield-check-line" className="text-6xl text-royal-gold mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-royal-gold font-playfair mb-2">Admin Access</h1>
          <p className="text-white/80 font-inter">Login to access admin features</p>
        </div>
        
        <div className="mb-6">
          <CustomIcon name="ri-information-line" className="text-4xl text-royal-gold-light mb-4" />
          <h2 className="text-xl font-semibold text-royal-gold font-playfair mb-2">Login Required</h2>
          <p className="text-white/80 font-inter mb-4">
            Please login to your Shaadi Mantrana account to access admin features.
          </p>
          <p className="text-sm text-royal-gold/60">
            Only users with administrator privileges can access the admin dashboard.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-royal-gold to-royal-gold-light text-white font-semibold rounded-xl hover:from-royal-gold-light hover:to-royal-gold transition-all duration-200"
          >
            <CustomIcon name="ri-login-box-line" className="mr-2" />
            Login to Shaadi Mantrana
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center justify-center px-6 py-3 bg-royal-glass text-white/80 font-inter border-2 border-royal-glass-border rounded-xl hover:border-blue-300 transition-all duration-200"
          >
            <CustomIcon name="ri-user-line" className="mr-2" />
            View Profile
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-royal-glass-border">
          <p className="text-xs text-royal-gold/60">
            Admin email: codebynitesh@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
} 