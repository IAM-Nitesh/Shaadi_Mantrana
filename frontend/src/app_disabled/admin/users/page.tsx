'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../../components/CustomIcon';
import { getClientToken } from '../../../utils/client-auth';
import HeartbeatLoader from '../../../components/HeartbeatLoader';
import { safeGsap } from '../../../components/SafeGsap';
import Image from 'next/image';
import { ImageUploadService } from '../../../services/image-upload-service';
import ToastService from '../../../services/toastService';
import logger from '../../../utils/logger';

interface User {
  _id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastActive: string;
  approvedByAdmin?: boolean;
  isFirstLogin?: boolean;
  profileCompleteness?: number;
  profile: {
    name?: string;
    images?: string;
  };
  profileCompleted?: boolean;
  verification?: {
    isVerified?: boolean;
    approvalType?: string;
  };
  isUpdating?: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pausedUsers: number;
  invitedUsers: number;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Map<string, string>>(new Map());
  const [imagesLoading, setImagesLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: 'pause' | 'resume';
    userEmail: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
    
    // Initialize cache cleanup for optimal performance
    ImageUploadService.initializeCacheCleanup();
    
    // Set up automatic refresh every 5 minutes to ensure profile completeness is up-to-date
    const autoRefreshInterval = setInterval(() => {
      logger.debug('🔄 Auto-refreshing user data to ensure profile completeness is current...');
      fetchUsers(true);
    }, 5 * 60 * 1000); // 5 minutes
    
    // Test ImageUploadService
    logger.debug('🔍 Testing ImageUploadService availability...');
    logger.debug('🔍 ImageUploadService:', ImageUploadService);
    logger.debug('🔍 ImageUploadService.getUserProfilePictureSignedUrlCached:', ImageUploadService?.getUserProfilePictureSignedUrlCached);
    
    // Test a simple call
    if (ImageUploadService?.getUserProfilePictureSignedUrlCached) {
      logger.debug('🔍 ImageUploadService.getUserProfilePictureSignedUrlCached is available, testing...');
      
      // Test with a simple synchronous operation first
      logger.debug('🔍 Testing ImageUploadService availability...');
      logger.debug('🔍 ImageUploadService type:', typeof ImageUploadService);
      logger.debug('🔍 getUserProfilePictureSignedUrlCached type:', typeof ImageUploadService.getUserProfilePictureSignedUrlCached);
      
      // Test the actual call
      ImageUploadService.getUserProfilePictureSignedUrlCached('test-user-id')
        .then(result => {
          logger.debug('🔍 Test call result:', result);
        })
        .catch(error => {
          logger.error('❌ Test call error:', error);
          logger.error('❌ Error details:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack
          });
        });
    } else {
      logger.error('❌ ImageUploadService.getUserProfilePictureSignedUrlCached is not available');
      logger.error('❌ ImageUploadService:', ImageUploadService);
    }
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const fetchUsers = async (forceRefresh = false) => {
    try {
    const token = await getClientToken();
      if (!token) {
        logger.debug('🔍 Users: No auth token found');
        router.push('/');
        return;
      }

      logger.debug('🔍 Users: Fetching users from /api/admin/users', forceRefresh ? '(force refresh)' : '');

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=300' // 5 minutes cache unless force refresh
        }
      });

      logger.debug('🔍 Users: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('🔍 Users: API error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      logger.debug('🔍 Users: Received data:', data);
      logger.debug('🔍 Users: Number of users:', data.users?.length || 0);
      
      // Debug: Log each user's role and profile completeness
      if (data.users && data.users.length > 0) {
        logger.debug('🔍 Users: User details:');
        data.users.forEach((user: any, index: number) => {
          logger.debug(`   ${index + 1}. ${user.email} - Role: ${user.role}, Status: ${user.status}, Approved: ${user.approvedByAdmin}, Profile Complete: ${user.profileCompleteness || 0}%`);
        });
      }
      
      // Debug: Check for invited users specifically
      const invitedUsers = data.users?.filter((user: any) => 
        (user.profileCompleteness || 0) < 100
      ) || [];
      logger.debug('🔍 Invited users found:', invitedUsers.length);
      invitedUsers.forEach((user: any, index: number) => {
        logger.debug(`   Invited ${index + 1}: ${user.email} - Profile: ${user.profileCompleteness || 0}%, Approved: ${user.approvedByAdmin}`);
      });
      
      setUsers(data.users || []);
      
      // Get signed URLs for profile images using batch processing for better performance
      setImagesLoading(true);
      const newProfileImages = new Map<string, string>();
      
      // Debug: Check admin authentication token
  const adminToken = await getClientToken();
      logger.debug('🔍 Admin auth token available:', !!adminToken);
      logger.debug('🔍 Admin auth token length:', adminToken?.length);
      logger.debug('🔍 Admin auth token preview:', adminToken?.substring(0, 20) + '...');
      
      // Use batch processing for better performance
      if (data.users && data.users.length > 0) {
        try {
          logger.debug('🔍 Starting batch signed URL fetch for users...');

          // Filter out admin users and those without images early to avoid unnecessary calls
          const userIdsToFetch = data.users
            .filter((u: any) => u.role !== 'admin' && (u.profile?.images || '').toString().trim() !== '')
            .map((u: any) => u._id);

          logger.debug('🔍 User IDs to fetch (non-admin & has image):', userIdsToFetch);

          if (userIdsToFetch.length > 0) {
            const batchResults = await ImageUploadService.getBatchSignedUrls(userIdsToFetch);
            logger.debug('🔍 Batch results size:', batchResults.size);

            // Convert batch results to our map
            for (const [userId, signedUrl] of batchResults.entries()) {
              if (signedUrl) {
                logger.debug(`✅ Got signed URL for ${userId}: ${signedUrl.substring(0, 50)}...`);
                newProfileImages.set(userId, signedUrl);
              } else {
                logger.debug(`❌ No signed URL returned for ${userId}`);
              }
            }
          } else {
            logger.debug('🔍 No non-admin users with images to fetch signed URLs for.');
          }
        } catch (error) {
          logger.error('❌ Error in batch signed URL fetch:', error?.message || error);

          // Fallback to individual requests if batch fails, but respect admin/no-image guard
          logger.debug('🔍 Falling back to individual requests...');
          for (const user of data.users || []) {
            try {
              if (user.role === 'admin') continue;
              if (!user.profile || !user.profile.images || user.profile.images.toString().trim() === '') continue;

              logger.debug(`🔍 Getting signed URL for user ${user._id} (${user.email})`);
              const signedUrl = await getSignedUrlForUser(user._id, user.profile?.images || '');
              logger.debug('🔍 getSignedUrlForUser returned:', signedUrl);
              if (signedUrl) {
                logger.debug(`✅ Got signed URL for ${user._id}: ${signedUrl.substring(0, 50)}...`);
                newProfileImages.set(user._id, signedUrl);
              } else {
                logger.debug(`❌ No signed URL returned for ${user._id}`);
              }
            } catch (error) {
              logger.error('Error getting signed URL for user:', user._id, error?.message || error);
            }
          }
        }
      }
      
      logger.debug('🔍 Final profile images map size:', newProfileImages.size);
      logger.debug('🔍 Profile images keys:', Array.from(newProfileImages.keys()));
      
      // Log cache status for debugging
      const cacheStatus = ImageUploadService.getCacheStatus();
      logger.debug('🔍 Cache status:', cacheStatus);
      
      setProfileImages(newProfileImages);
      setImagesLoading(false);
      
      // Preload signed URLs for better performance on subsequent visits
      if (data.users && data.users.length > 0) {
        const userIds = data.users.map((user: any) => user._id);
        logger.debug('🔍 Preloading signed URLs for better performance...');
        ImageUploadService.preloadSignedUrls(userIds);
      }
      
      // Calculate stats from users based on status and approvedByAdmin
      const users = data.users || [];
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((user: any) => 
          user.status === 'active' && user.approvedByAdmin === true
        ).length,
        pausedUsers: users.filter((user: any) => 
          user.status === 'paused'
        ).length,
        invitedUsers: users.filter((user: any) => 
          user.status === 'invited' || user.approvedByAdmin === false
        ).length
      });

      // Animate content on load (use safe wrapper to avoid warnings when selector not present)
      safeGsap.fromTo?.('.user-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );

    } catch (error) {
      logger.error('❌ Users: Error fetching users:', error);
      setError(`Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resumeUser = async (userId: string) => {
    try {
      const token = await getClientToken();
      if (!token) {
        router.push('/');
        return;
      }

      // Show loading state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isUpdating: true }
            : user
        )
      );

      const response = await fetch(`/api/admin/users/${userId}/resume`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvedByAdmin: true })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to resume user' }));
        throw new Error(errorData.error || 'Failed to resume user');
      }

      const result = await response.json();

      // Update local state with server response
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                status: 'active', 
                approvedByAdmin: true,
                isUpdating: false,
                verification: {
                  ...user.verification,
                  isVerified: true
                }
              }
            : user
        )
      );

      // Show success message
      ToastService.success(`User ${result.user?.email || 'resumed'} successfully`);

      // Refetch users to update stats
      fetchUsers();
    } catch (error) {
      logger.error('Error resuming user:', error);
      
      // Reset loading state on error
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isUpdating: false }
            : user
        )
      );
      
      // Show error message
      ToastService.error(error instanceof Error ? error.message : 'Failed to resume user');
    }
  };

  const pauseUser = async (userId: string) => {
    try {
  const token = await getClientToken();
      if (!token) {
        router.push('/');
        return;
      }

      // Show loading state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isUpdating: true }
            : user
        )
      );

      const response = await fetch(`/api/admin/users/${userId}/pause`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvedByAdmin: false })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to pause user' }));
        throw new Error(errorData.error || 'Failed to pause user');
      }

      const result = await response.json();

      // Update local state with server response
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                status: 'paused', 
                approvedByAdmin: false,
                isUpdating: false,
                verification: {
                  ...user.verification,
                  isVerified: false
                }
              }
            : user
        )
      );

      // Show success message
      ToastService.success(`User ${result.user?.email || 'paused'} successfully`);

      // Refetch users to update stats
      fetchUsers();
    } catch (error) {
      logger.error('Error pausing user:', error);
      
      // Reset loading state on error
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isUpdating: false }
            : user
        )
      );
      
      // Show error message
      ToastService.error(error instanceof Error ? error.message : 'Failed to pause user');
    }
  };

  const resendInvite = async (userId: string, userEmail: string) => {
    try {
      const token = await getClientToken();
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/resend-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      const result = await response.json();
      logger.debug('✅ Invitation resent successfully:', result);

      // Refetch users to update any invitation-related data
      fetchUsers();
    } catch (error) {
      logger.error('Error resending invitation:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSignedUrlForUser = async (userId: string, imagePath: string): Promise<string | null> => {
    try {
      logger.debug(`🔍 getSignedUrlForUser called for userId: ${userId}, imagePath: ${imagePath}`);
      logger.debug(`🔍 ImageUploadService available:`, !!ImageUploadService);
      logger.debug(`🔍 ImageUploadService.getUserProfilePictureSignedUrlCached available:`, !!ImageUploadService?.getUserProfilePictureSignedUrlCached);
      
      if (!imagePath) {
        logger.debug(`🔍 No imagePath provided for user ${userId}, but will still try to get signed URL`);
      }
      
      // Use the cached version for faster loading
      logger.debug(`🔍 Testing cached signed URL for user: ${userId}`);
      logger.debug(`🔍 About to call ImageUploadService.getUserProfilePictureSignedUrlCached(${userId})`);
      
      try {
        const signedUrl = await ImageUploadService.getUserProfilePictureSignedUrlCached(userId);
        logger.debug(`🔍 Cached result for user ${userId}:`, signedUrl);
        return signedUrl;
      } catch (error) {
        logger.error(`❌ Error calling ImageUploadService.getUserProfilePictureSignedUrlCached for user ${userId}:`, error);
        logger.error(`❌ Error details:`, {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        return null;
      }
    } catch (error) {
      logger.error('❌ Error getting signed URL for user:', userId, error);
      return null;
    }
  };

  const handlePauseUser = (userId: string, userEmail: string) => {
    setConfirmAction({ userId, action: 'pause', userEmail });
    setOpenDropdown(null);
  };

  const handleResumeUser = (userId: string, userEmail: string) => {
    setConfirmAction({ userId, action: 'resume', userEmail });
    setOpenDropdown(null);
  };

  const confirmPauseResume = async () => {
    if (!confirmAction) return;
    
    try {
      if (confirmAction.action === 'pause') {
        await pauseUser(confirmAction.userId);
      } else {
        await resumeUser(confirmAction.userId);
      }
    } finally {
      setConfirmAction(null);
    }
  };

  const cancelPauseResume = () => {
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <HeartbeatLoader 
          logoSize="xxl"
          textSize="lg"
          text="Loading users..." 
          showText={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CustomIcon name="ri-error-warning-line" className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8 pt-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <CustomIcon name="ri-user-settings-line" className="text-4xl text-blue-600 mr-3" />
          User Management
        </h1>
        <p className="text-gray-600">Manage user accounts and monitor activity</p>
      </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="user-card bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <CustomIcon name="ri-group-line" className="text-2xl text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
              </div>
            </div>

            <div className="user-card bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <CustomIcon name="ri-user-heart-line" className="text-2xl text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stats.activeUsers}</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
              </div>
            </div>

            <div className="user-card bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <CustomIcon name="ri-user-settings-line" className="text-2xl text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stats.pausedUsers}</div>
                  <div className="text-sm text-gray-500">Paused Users</div>
                </div>
              </div>
            </div>

            <div className="user-card bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <CustomIcon name="ri-mail-line" className="text-2xl text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stats.invitedUsers}</div>
                  <div className="text-sm text-gray-500">Invited Users</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="user-card bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <CustomIcon name="ri-user-list-line" className="text-xl text-blue-500 mr-2" />
                User Accounts ({users.length})
              </h3>
              <button
                onClick={() => fetchUsers(true)}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <CustomIcon name={loading ? "ri-loader-4-line" : "ri-refresh-line"} className={`mr-2 text-sm ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">
                  {loading ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile Complete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          {(() => {
                            const hasImage = profileImages.get(user._id);
                            logger.debug(`🔍 User ${user._id} (${user.email}): hasImage = ${!!hasImage}`);
                            if (hasImage) {
                              logger.debug(`🔍 Image URL for ${user._id}: ${hasImage.substring(0, 50)}...`);
                            }
                            return hasImage ? (
                              <Image
                                src={hasImage}
                                alt={user.profile?.name || user.email}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  logger.debug(`❌ Image failed to load for user ${user._id}`);
                                  // Fallback to initial if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-white font-semibold">${user.email.charAt(0).toUpperCase()}</span>`;
                                  }
                                }}
                                onLoad={() => {
                                  logger.debug(`✅ Image loaded successfully for user ${user._id}`);
                                }}
                              />
                            ) : (
                              <span className="text-white font-semibold">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.profile?.name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const profileCompleteness = user.profileCompleteness || 0;
                        const isApproved = user.approvedByAdmin;
                        const userStatus = user.status;
                        
                        let status = 'invited';
                        let statusClass = 'bg-gray-100 text-gray-800';
                        let statusIcon = 'ri-time-line';
                        
                        if (userStatus === 'active' && isApproved === true) {
                          status = 'active';
                          statusClass = 'bg-green-100 text-green-800';
                          statusIcon = 'ri-check-line';
                        } else if (userStatus === 'paused' || isApproved === false) {
                          status = 'paused';
                          statusClass = 'bg-yellow-100 text-yellow-800';
                          statusIcon = 'ri-pause-line';
                        } else if (profileCompleteness < 100) {
                          status = 'invited';
                          statusClass = 'bg-blue-100 text-blue-800';
                          statusIcon = 'ri-mail-line';
                        }
                        
                        return (
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                              <CustomIcon name={statusIcon} className="mr-1 text-xs" />
                              {status}
                            </span>
                            {user.isUpdating && (
                              <span className="text-xs animate-pulse">💝</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${user.profileCompleteness || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {user.profileCompleteness || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      {user.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                            disabled={user.isUpdating}
                          >
                            {user.isUpdating ? (
                              <span className="text-sm animate-pulse">💝</span>
                            ) : (
                              <span className="text-lg font-bold">⋯</span>
                            )}
                          </button>
                          
                          {openDropdown === user._id && (
                            <div className="dropdown-container absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                {(() => {
                                  const profileCompleteness = user.profileCompleteness || 0;
                                  const isApproved = user.approvedByAdmin;
                                  const userStatus = user.status;
                                  
                                  return (
                                    <>
                                      {/* Show Pause button for active users */}
                                      {userStatus === 'active' && isApproved === true && (
                                        <button
                                          onClick={() => handlePauseUser(user._id, user.email)}
                                          disabled={user.isUpdating}
                                          className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {user.isUpdating ? (
                                            <span className="mr-2 animate-pulse">💝</span>
                                          ) : (
                                            <CustomIcon name="ri-pause-circle-line" className="mr-2" />
                                          )}
                                          Pause
                                        </button>
                                      )}
                                      
                                      {/* Show Resume button for paused users */}
                                      {userStatus === 'paused' && isApproved === false && (
                                        <button
                                          onClick={() => handleResumeUser(user._id, user.email)}
                                          disabled={user.isUpdating}
                                          className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {user.isUpdating ? (
                                            <span className="mr-2 animate-pulse">💝</span>
                                          ) : (
                                            <CustomIcon name="ri-play-circle-line" className="mr-2" />
                                          )}
                                          Resume
                                        </button>
                                      )}
                                      
                                      {/* Show Resume button for users with 100% profile but not approved */}
                                      {profileCompleteness === 100 && userStatus !== 'active' && isApproved === false && (
                                        <button
                                          onClick={() => handleResumeUser(user._id, user.email)}
                                          disabled={user.isUpdating}
                                          className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {user.isUpdating ? (
                                            <span className="mr-2 animate-pulse">💝</span>
                                          ) : (
                                            <CustomIcon name="ri-play-circle-line" className="mr-2" />
                                          )}
                                          Resume
                                        </button>
                                      )}
                                      
                                      {/* Show Pause button for users with 100% profile and approved */}
                                      {profileCompleteness === 100 && userStatus !== 'paused' && isApproved === true && (
                                        <button
                                          onClick={() => handlePauseUser(user._id, user.email)}
                                          disabled={user.isUpdating}
                                          className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {user.isUpdating ? (
                                            <span className="mr-2 animate-pulse">💝</span>
                                          ) : (
                                            <CustomIcon name="ri-pause-circle-line" className="mr-2" />
                                          )}
                                          Pause
                                        </button>
                                      )}
                                      
                                      {/* Always show Resend Invite for all users */}
                                      <button
                                        onClick={() => {
                                          resendInvite(user._id, user.email);
                                          setOpenDropdown(null);
                                        }}
                                        disabled={user.isUpdating}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <CustomIcon name="ri-mail-send-line" className="mr-2" />
                                        Resend Invite
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <CustomIcon name="ri-user-line" className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">No user accounts are currently available.</p>
            </div>
          )}
        </div>
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                confirmAction.action === 'pause' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <CustomIcon 
                  name={confirmAction.action === 'pause' ? 'ri-pause-circle-line' : 'ri-play-circle-line'} 
                  className={`text-2xl ${confirmAction.action === 'pause' ? 'text-yellow-600' : 'text-green-600'}`} 
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmAction.action === 'pause' ? 'Pause User' : 'Resume User'}
                </h3>
                <p className="text-sm text-gray-500">
                  {confirmAction.userEmail}
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              {confirmAction.action === 'pause' 
                ? 'Are you sure you want to pause this user? They will no longer be able to log in or update their profile.'
                : 'Are you sure you want to resume this user? They will regain access to log in and update their profile.'
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelPauseResume}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPauseResume}
                className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors ${
                  confirmAction.action === 'pause' 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {confirmAction.action === 'pause' ? 'Pause User' : 'Resume User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 