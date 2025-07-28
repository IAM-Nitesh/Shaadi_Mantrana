
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatComponent from './ChatComponent';
import { AuthService } from '../../../services/auth-service';
import CustomIcon from '../../../components/CustomIcon';
import HeartbeatLoader from '../../../components/HeartbeatLoader';

// Demo match details - ONLY used in static mode
const demoMatchDetails = {
  '1': {
    name: 'Priya Sharma',
    image: '/demo-profiles/match-1.svg'
  },
  '2': {
    name: 'Kavya Reddy',
    image: '/demo-profiles/match-2.svg'
  }
};

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication
    if (!AuthService.isAuthenticated()) {
      router.push('/');
      return;
    }

    // Check for incomplete profile
    async function checkOnboarding() {
      let isFirstLogin = false;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('isFirstLogin');
        if (stored !== null) {
          isFirstLogin = stored === 'true';
        } else {
          // Fallback: fetch profile
          const { ProfileService } = await import('../../../services/profile-service');
          const userProfile = await ProfileService.getUserProfile();
          isFirstLogin = !!userProfile?.isFirstLogin;
        }
      }
      
      // Check profile completion
      const profileCompletion = localStorage.getItem('profileCompletion');
      const completion = profileCompletion ? parseInt(profileCompletion) : 0;
      
      // Allow access if profile completion is 75% or higher
      if (isFirstLogin && completion < 75) {
        router.replace('/profile');
        return;
      }
    }
    
    checkOnboarding();

    async function loadMatch() {
      try {
        const isStaticMode = !process.env.NEXT_PUBLIC_API_BASE_URL;
        
        if (isStaticMode) {
          // Static mode: use demo data
          const demoMatch = demoMatchDetails[params.id as keyof typeof demoMatchDetails];
          if (!demoMatch) {
            setError('Match not found');
            return;
          }
          setMatch(demoMatch);
        } else {
          // MongoDB mode: fetch real match data
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profiles/uuid/${params.id}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (!response.ok) {
            setError('Match not found');
            return;
          }
          
          const data = await response.json();
          setMatch({
            name: data.profile?.name || 'Unknown User',
            image: data.profile?.images?.[0] || '/demo-profiles/default-profile.svg'
          });
        }
      } catch (error) {
        console.error('Error loading match:', error);
        setError('Failed to load match');
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            size="lg" 
            text="Loading Chat" 
            className="mb-4"
          />
          <p className="text-gray-600">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center shadow-lg">
            <CustomIcon name="ri-error-warning-line" className="text-3xl text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-300 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
            <CustomIcon name="ri-user-search-line" className="text-3xl text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Match Not Found</h3>
          <p className="text-gray-600 mb-6">The requested match could not be found.</p>
          <button
            onClick={() => router.push('/matches')}
            className="bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-300 shadow-lg"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return <ChatComponent match={match} />;
}
