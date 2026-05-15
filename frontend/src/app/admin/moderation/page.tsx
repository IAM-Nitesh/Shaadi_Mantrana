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
  email: string;
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <RoyalLoader size="lg" text="Loading pending photos..."  />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <CustomIcon name="ri-image-check-line" className="text-rose-500 mr-3" />
          Photo Moderation
        </h1>
        <p className="text-gray-600 mt-2">Approve or reject user profile photos for compliance.</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CustomIcon name="ri-checkbox-circle-line" className="text-4xl text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">All Caught Up!</h2>
          <p className="text-gray-500 mt-2">There are no pending photos to moderate at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.userId} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col">
              {/* Image Preview */}
              <div className="aspect-square bg-gray-100 relative group">
                {user.images && user.images.length > 0 ? (
                  <img 
                    src={user.images[0]} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <CustomIcon name="ri-user-smile-line" className="text-6xl" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-md">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 flex-1">
                <h3 className="font-bold text-gray-800 text-lg truncate">{user.name}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleModerate(user.userId, 'rejected')}
                  disabled={processingId === user.userId}
                  className="flex items-center justify-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                >
                  <CustomIcon name="ri-close-circle-line" className="mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleModerate(user.userId, 'approved')}
                  disabled={processingId === user.userId}
                  className="flex items-center justify-center px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium shadow-md shadow-rose-200 disabled:opacity-50"
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
