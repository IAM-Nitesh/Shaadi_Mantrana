'use client';

import { useState, useEffect } from 'react';
import CustomIcon from '../../../components/CustomIcon';
import RoyalLoader from '../../../components/RoyalLoader';
import { apiClient } from '../../../utils/api-client';
import logger from '../../../utils/logger';
import { toast } from 'react-hot-toast';

interface PendingUser {
  userId: string;
  userUuid: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  images: string[];
  status: string;
  createdAt: string;
}

export default function PhotoModerationPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPhotos();
  }, []);

  const fetchPendingPhotos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/photos/pending');
      if (response.data?.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      logger.error('Error fetching pending photos:', error);
      toast.error('Failed to load pending photos');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(userId);
      const response = await apiClient.post('/api/admin/photos/moderate', {
        userId,
        status
      });

      if (response.data?.success) {
        toast.success(`Photo ${status} successfully`);
        setUsers(prev => prev.filter(u => u.userId !== userId));
      } else {
        toast.error(response.data?.error || 'Action failed');
      }
    } catch (error) {
      logger.error(`Error moderating photo (${status}):`, error);
      toast.error('Connection error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <RoyalLoader variant="skeleton" className="w-48 h-10 rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <RoyalLoader key={i} variant="skeleton" className="w-full h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-royal-gold font-playfair flex items-center">
          <CustomIcon name="ri-image-check-line" className="text-royal-gold mr-3" />
          Photo Moderation
        </h1>
        <p className="text-white/80 font-inter mt-2">Approve or reject user profile photos for compliance.</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-royal-glass rounded-2xl shadow-sm p-12 text-center border border-royal-glass-border">
          <div className="w-20 h-20 bg-royal-gold/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <CustomIcon name="ri-checkbox-circle-line" className="text-4xl text-royal-gold-light" />
          </div>
          <h2 className="text-xl font-semibold text-royal-gold font-playfair">All Caught Up!</h2>
          <p className="text-royal-gold/60 mt-2">There are no pending photos to moderate at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.userId} className="bg-royal-glass rounded-2xl shadow-lg overflow-hidden border border-royal-glass-border flex flex-col">
              {/* Image Preview */}
              <div className="aspect-square bg-royal-gold/10 relative group">
                {user.images && user.images.length > 0 ? (
                  <img 
                    src={user.images[0]} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-royal-gold/40">
                    <CustomIcon name="ri-user-smile-line" className="text-6xl" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-md">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 flex-1">
                <h3 className="font-bold text-royal-gold font-playfair text-lg truncate">{user.name}</h3>
                <p className="text-sm text-royal-gold/60 truncate">{user.phoneNumber || user.email || 'Phone Signup'}</p>
              </div>

              {/* Actions */}
              <div className="p-4 bg-royal-obsidian border-t border-royal-glass-border grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleModerate(user.userId, 'rejected')}
                  disabled={processingId === user.userId}
                  className="flex items-center justify-center px-4 py-2 bg-royal-glass border border-royal-crimson/50 text-royal-crimson rounded-xl hover:bg-royal-crimson/10 transition-colors font-medium disabled:opacity-50"
                >
                  <CustomIcon name="ri-close-circle-line" className="mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleModerate(user.userId, 'approved')}
                  disabled={processingId === user.userId}
                  className="flex items-center justify-center px-4 py-2 bg-royal-gold text-white rounded-xl hover:bg-royal-gold-light transition-colors font-medium shadow-md shadow-royal-gold/20 disabled:opacity-50"
                >
                  <CustomIcon name="ri-checkbox-circle-line" className="mr-2" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
