'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../../services/auth-service';
import CustomIcon from '../../../components/CustomIcon';
import StandardHeader from '../../../components/StandardHeader';

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated and is admin
    const checkAdminAccess = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const hasAdminAccess = await AuthService.verifyAdminAccess();
          if (hasAdminAccess) {
            router.replace('/admin/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
      }
    };

    checkAdminAccess();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <StandardHeader />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-8">
            <CustomIcon name="ri-shield-check-line" className="text-6xl text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Access</h1>
            <p className="text-gray-600">Login to access admin features</p>
          </div>
          
          <div className="mb-6">
            <CustomIcon name="ri-information-line" className="text-4xl text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">
              Please login to your Shaadi Mantra account to access admin features.
            </p>
            <p className="text-sm text-gray-500">
              Only users with administrator privileges can access the admin dashboard.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              <CustomIcon name="ri-login-box-line" className="mr-2" />
              Login to Shaadi Mantra
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="w-full flex items-center justify-center px-6 py-3 bg-white text-gray-600 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200"
            >
              <CustomIcon name="ri-user-line" className="mr-2" />
              View Profile
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Admin email: codebynitesh@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 