
'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import ChatComponent from './ChatComponent';
import { ServerAuthService } from '../../../services/server-auth-service';
import CustomIcon from '../../../components/CustomIcon';
import HeartbeatLoader from '../../../components/HeartbeatLoader';

// Chat page for matched profiles

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication using server-side auth
    const checkAuth = async () => {
      try {
        const authStatus = await ServerAuthService.checkAuthStatus();
        if (!authStatus.authenticated) {
          router.push('/');
          return;
        }

        // Check for incomplete profile using server data
        const user = authStatus.user;
        if (user?.isFirstLogin && (user?.profileCompleteness || 0) < 100) {
          router.replace('/profile');
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
        return;
      }
    };
    
    checkAuth();

    async function loadMatch() {
      try {
        // Fetch connection and other user's profile from MongoDB
        const token = await ServerAuthService.getBearerToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          setError('Connection not found');
          return;
        }
        
        const data = await response.json();
        
        // Get the other user's profile from the connection
        // Extract current user ID from server auth
        const authToken = await ServerAuthService.getBearerToken();
        let currentUserId = null;
        if (authToken) {
          try {
            const payload = JSON.parse(atob(authToken.split('.')[1]));
            currentUserId = payload.userId || payload._id || payload.id;
          } catch (e) {
            console.error('Error parsing JWT token:', e);
          }
        }
        
        const otherUser = data.connection.users.find((user: any) => user._id !== currentUserId);
        
        if (!otherUser) {
          setError('Other user not found in connection');
          return;
        }
        
        setMatch({
          name: otherUser.profile?.name || 'Unknown User',
          image: otherUser.profile?.images?.[0] || '/demo-profiles/default-profile.svg',
          connectionId: id,
          otherUserId: otherUser._id
        });
      } catch (error) {
        console.error('Error loading match:', error);
        setError('Failed to load match');
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            logoSize="xxxxl"
            textSize="xl"
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
