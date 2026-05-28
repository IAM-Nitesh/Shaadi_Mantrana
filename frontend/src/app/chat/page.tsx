'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatComponent from './ChatComponent';
import CustomIcon from '../../components/CustomIcon';
import RoyalLoader from '../../components/RoyalLoader';
import logger from '../../utils/logger';
import { apiClient } from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

// Chat page for matched profiles - Static Export Compatible
function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!id) {
      router.replace('/matches');
      return;
    }

    // Check authentication using AuthContext
    const checkAuth = async () => {
      try {
        if (!isAuthenticated || !user) {
          router.push('/');
          return;
        }
        if (user?.isFirstLogin && (user?.profileCompleteness || 0) < 100) {
          router.replace('/profile');
          return;
        }
      } catch (error) {
        logger.error('Error checking authentication:', error);
        router.push('/');
        return;
      }
    };
    
    checkAuth();

    async function loadMatch() {
      try {
        // Fetch connection and other user's profile from MongoDB
        const token = localStorage.getItem('accessToken') || '';
        const response = await apiClient.get(`/api/connections/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000
        });

        if (!response.ok) {
          setError('Connection not found');
          return;
        }

        const data = response.data;
        
        // Get the other user's profile from the connection
        // Extract current user ID from server auth
        const authToken = localStorage.getItem('accessToken') || '';
        let currentUserId = null;
        if (authToken) {
          try {
            const payload = JSON.parse(atob(authToken.split('.')[1]));
            currentUserId = payload.userId || payload._id || payload.id;
          } catch (e) {
            logger.error('Error parsing JWT token:', e);
          }
        }
        
        const otherUser = data.connection.users.find((u: any) => u._id !== currentUserId);
        
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
        logger.error('Error loading match:', error);
        setError('Failed to load match');
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [id, router, isAuthenticated, user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-obsidian flex items-center justify-center">
        <div className="text-center">
          <RoyalLoader 
            size="xl"
            text="Aligning the stars for your conversation..." 
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-royal-obsidian">
        <div className="bg-royal-glass/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-royal-glass-border">
          <div className="w-24 h-24 mx-auto mb-6 bg-royal-obsidian border border-royal-crimson/20 rounded-2xl flex items-center justify-center shadow-lg">
            <CustomIcon name="ri-error-warning-line" className="text-3xl text-royal-crimson" />
          </div>
          <h3 className="text-xl font-semibold text-royal-gold text-center mb-2">Error</h3>
          <p className="text-royal-gold/60 text-center mb-6">{error}</p>
          <p className="text-sm text-royal-gold/40 text-center">Pull down to refresh and try again.</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-royal-obsidian">
        <div className="bg-royal-glass/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-royal-glass-border">
          <div className="w-24 h-24 mx-auto mb-6 bg-royal-obsidian border border-royal-gold/20 rounded-2xl flex items-center justify-center shadow-lg">
            <CustomIcon name="ri-user-search-line" className="text-3xl text-royal-gold" />
          </div>
          <h3 className="text-xl font-semibold text-royal-gold text-center mb-2">No conversations yet</h3>
          <p className="text-royal-gold/60 text-center mb-8">The requested match could not be found.</p>
          <button 
            onClick={() => router.push('/matches')}
            className="w-full bg-royal-gold text-royal-obsidian px-6 py-3 rounded-xl font-bold hover:bg-royal-gold-light transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return <ChatComponent match={match} />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-royal-obsidian flex items-center justify-center">
        <RoyalLoader size="xl" text="Summoning the chat chamber..." />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
