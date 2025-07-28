'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProfileService } from '../services/profile-service';
import HeartbeatLoader from './HeartbeatLoader';

interface NavigationGuardProps {
  children: React.ReactNode;
}

export default function NavigationGuard({ children }: NavigationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Allowed routes for first-time users
  const allowedRoutes = ['/profile', '/', '/auth', '/login', '/logout'];
  
  // Check if current route is allowed for first-time users
  const isRouteAllowed = (path: string) => {
    return allowedRoutes.some(route => path.startsWith(route));
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profile: any): number => {
    if (!profile) return 0;

    const requiredFields = [
      'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
      'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
      'maritalStatus', 'father', 'mother', 'about'
    ];

    const optionalFields = [
      'timeOfBirth', 'placeOfBirth', 'manglik', 'eatingHabit', 'smokingHabit', 
      'drinkingHabit', 'brothers', 'sisters', 'fatherGotra', 'motherGotra',
      'grandfatherGotra', 'grandmotherGotra', 'specificRequirements', 'settleAbroad',
      'interests'
    ];

    let completedFields = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Check required fields (weight: 2x)
    requiredFields.forEach(field => {
      if (profile[field] && profile[field].toString().trim() !== '') {
        completedFields += 2;
      }
    });

    // Check optional fields (weight: 1x)
    optionalFields.forEach(field => {
      if (profile[field] && profile[field].toString().trim() !== '') {
        completedFields += 1;
      }
    });

    // Calculate percentage (max 100%)
    const percentage = Math.min(100, Math.round((completedFields / (requiredFields.length * 2 + optionalFields.length)) * 100));
    return percentage;
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Check if user is authenticated
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.log('🔐 No auth token found, allowing navigation');
          setIsChecking(false);
          return;
        }

        console.log('🔍 Checking user status...');
        
        // Get user profile with retry logic
        let profile = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            profile = await ProfileService.getUserProfile();
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            console.error(`❌ Profile fetch attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
              throw error; // Re-throw after max retries
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
        
        if (profile) {
          const completion = calculateProfileCompletion(profile);
          setProfileCompletion(completion);

          // Check if user is first-time user (isFirstLogin is true or profile completion < 75%)
          // Also check localStorage for consistency
          const localStorageIsFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
          const localStorageIsFirstTimeUser = localStorage.getItem('isFirstTimeUser') === 'true';
          
          const isFirstLogin = profile.isFirstLogin || localStorageIsFirstLogin || completion < 75;
          const isFirstTimeUser = isFirstLogin || localStorageIsFirstTimeUser;
          
          setIsFirstTimeUser(isFirstTimeUser);

          // Store completion status
          localStorage.setItem('profileCompletion', completion.toString());
          localStorage.setItem('isFirstTimeUser', isFirstTimeUser.toString());
          
          // If profile is 75%+ complete, ensure onboarding is marked as seen
          if (completion >= 75) {
            console.log('✅ NavigationGuard: Profile 75%+ complete, marking onboarding as seen');
            localStorage.setItem('hasSeenOnboarding', 'true');
            localStorage.setItem('isFirstLogin', 'false');
          }

          // Redirect if needed
          if (isFirstTimeUser && !isRouteAllowed(pathname)) {
            console.log('🚫 Navigation blocked: First-time user redirected to profile');
            console.log('📊 Profile completion:', completion, 'isFirstLogin:', profile.isFirstLogin, 'localStorage isFirstLogin:', localStorageIsFirstLogin);
            router.replace('/profile');
          }
        } else {
          console.log('⚠️ No profile found, treating as first-time user');
          setIsFirstTimeUser(true);
          localStorage.setItem('isFirstTimeUser', 'true');
        }
      } catch (error) {
        console.error('❌ Error checking user status:', error);
        // On error, allow navigation but mark as first-time user
        // Don't throw the error to prevent app crashes
        setIsFirstTimeUser(true);
        localStorage.setItem('isFirstTimeUser', 'true');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserStatus();
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            size="xxl" 
            text="Loading Application" 
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  // If first-time user and trying to access restricted route, redirect
  if (isFirstTimeUser && !isRouteAllowed(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-bounce mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">📝</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile First</h2>
          <p className="text-gray-600 mb-6">
            Please complete at least 75% of your profile before accessing other features. This helps us provide you with better matches.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 