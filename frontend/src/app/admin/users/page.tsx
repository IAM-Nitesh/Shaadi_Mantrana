'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../../components/CustomIcon';
import { ServerAuthService } from '../../../services/server-auth-service';
import HeartbeatLoader from '../../../components/HeartbeatLoader';
import { gsap } from 'gsap';
import Image from 'next/image';
import { ImageUploadService } from '../../../services/image-upload-service';
import ToastService from '../../../services/toastService';

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
    profileCompleteness?: number;
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
    
    // Test ImageUploadService
    console.log('🔍 Testing ImageUploadService availability...');
    console.log('🔍 ImageUploadService:', ImageUploadService);
    console.log('🔍 ImageUploadService.getUserProfilePictureSignedUrlCached:', ImageUploadService?.getUserProfilePictureSignedUrlCached);
    
    // Test a simple call
    if (ImageUploadService?.getUserProfilePictureSignedUrlCached) {
      console.log('🔍 ImageUploadService.getUserProfilePictureSignedUrlCached is available, testing...');
      
      // Test with a simple synchronous operation first
      console.log('🔍 Testing ImageUploadService availability...');
      console.log('🔍 ImageUploadService type:', typeof ImageUploadService);
      console.log('🔍 getUserProfilePictureSignedUrlCached type:', typeof ImageUploadService.getUserProfilePictureSignedUrlCached);
      
      // Test the actual call
      ImageUploadService.getUserProfilePictureSignedUrlCached('test-user-id')
        .then(result => {
          console.log('🔍 Test call result:', result);
        })
        .catch(error => {
          console.error('❌ Test call error:', error);
          console.error('❌ Error details:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack
          });
        });
    } else {
      console.error('❌ ImageUploadService.getUserProfilePictureSignedUrlCached is not available');
      console.error('❌ ImageUploadService:', ImageUploadService);
    }
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

  const fetchUsers = async () => {
    try {
      const token = await ServerAuthService.getBearerToken();
      if (!token) {
        console.log('🔍 Users: No auth token found');
        router.push('/');
        return;
      }

      console.log('🔍 Users: Fetching users from /api/admin/users');

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Users: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Users: API error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Users: Received data:', data);
      console.log('🔍 Users: Number of users:', data.users?.length || 0);
      
      // Debug: Log each user's role and profile completeness
      if (data.users && data.users.length > 0) {
        console.log('🔍 Users: User details:');
        data.users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.email} - Role: ${user.role}, Status: ${user.status}, Approved: ${user.approvedByAdmin}, Profile Complete: ${user.profile?.profileCompleteness || 0}%`);
          console.log(`   Raw profile data:`, user.profile);
        });
      }
      
      // Debug: Check for invited users specifically
      const invitedUsers = data.users?.filter((user: any) => 
        (user.profile?.profileCompleteness || 0) < 100
      ) || [];
      console.log('🔍 Invited users found:', invitedUsers.length);
      invitedUsers.forEach((user: any, index: number) => {
        console.log(`   Invited ${index + 1}: ${user.email} - Profile: ${user.profile?.profileCompleteness || 0}%, Approved: ${user.approvedByAdmin}`);
      });
      
      setUsers(data.users || []);
      
      // Get signed URLs for profile images using batch processing for better performance
      setImagesLoading(true);
      const newProfileImages = new Map<string, string>();
      
      // Debug: Check admin authentication token
      const adminToken = await ServerAuthService.getBearerToken();
      console.log('🔍 Admin auth token available:', !!adminToken);
      console.log('🔍 Admin auth token length:', adminToken?.length);
      console.log('🔍 Admin auth token preview:', adminToken?.substring(0, 20) + '...');
      
      // Use batch processing for better performance
      if (data.users && data.users.length > 0) {
        try {
          console.log('🔍 Starting batch signed URL fetch for users...');
          const userIds = data.users.map((user: any) => user._id);
          console.log('🔍 User IDs to fetch:', userIds);
          
          // Use the batch method for efficient fetching
          const batchResults = await ImageUploadService.getBatchSignedUrls(userIds);
          console.log('🔍 Batch results size:', batchResults.size);
          
          // Convert batch results to our map
          for (const [userId, signedUrl] of batchResults.entries()) {
            if (signedUrl) {
              console.log(`✅ Got signed URL for ${userId}: ${signedUrl.substring(0, 50)}...`);
              newProfileImages.set(userId, signedUrl);
            } else {
              console.log(`❌ No signed URL returned for ${userId}`);
            }
          }
        } catch (error) {
          console.error('❌ Error in batch signed URL fetch:', error);
          
          // Fallback to individual requests if batch fails
          console.log('🔍 Falling back to individual requests...');
          for (const user of data.users || []) {
            try {
              console.log(`🔍 Getting signed URL for user ${user._id} (${user.email})`);
              console.log('🔍 About to call ImageUploadService.getUserProfilePictureSignedUrlCached...');
              const signedUrl = await getSignedUrlForUser(user._id, user.profile?.images || '');
              console.log('🔍 getSignedUrlForUser returned:', signedUrl);
              if (signedUrl) {
                console.log(`✅ Got signed URL for ${user._id}: ${signedUrl.substring(0, 50)}...`);
                newProfileImages.set(user._id, signedUrl);
              } else {
                console.log(`❌ No signed URL returned for ${user._id}`);
              }
            } catch (error) {
              console.error('Error getting signed URL for user:', user._id, error);
            }
          }
        }
      }
      
      console.log('🔍 Final profile images map size:', newProfileImages.size);
      console.log('🔍 Profile images keys:', Array.from(newProfileImages.keys()));
      
      // Log cache status for debugging
      const cacheStatus = ImageUploadService.getCacheStatus();
      console.log('🔍 Cache status:', cacheStatus);
      
      setProfileImages(newProfileImages);
      setImagesLoading(false);
      
      // Preload signed URLs for better performance on subsequent visits
      if (data.users && data.users.length > 0) {
        const userIds = data.users.map((user: any) => user._id);
        console.log('🔍 Preloading signed URLs for better performance...');
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

      // Animate content on load
      gsap.fromTo('.user-card', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );

    } catch (error) {
      console.error('❌ Users: Error fetching users:', error);
      setError(`Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resumeUser = async (userId: string) => {
    try {
      const token = await ServerAuthService.getBearerToken();
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
      console.error('Error resuming user:', error);
      
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
      const token = await ServerAuthService.getBearerToken();
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
      console.error('Error pausing user:', error);
      
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
      const token = await ServerAuthService.getBearerToken();
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
      console.log('✅ Invitation resent successfully:', result);

      // Refetch users to update any invitation-related data
      fetchUsers();
    } catch (error) {
      console.error('Error resending invitation:', error);
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
      console.log(`🔍 getSignedUrlForUser called for userId: ${userId}, imagePath: ${imagePath}`);
      console.log(`🔍 ImageUploadService available:`, !!ImageUploadService);
      console.log(`🔍 ImageUploadService.getUserProfilePictureSignedUrlCached available:`, !!ImageUploadService?.getUserProfilePictureSignedUrlCached);
      
      if (!imagePath) {
        console.log(`🔍 No imagePath provided for user ${userId}, but will still try to get signed URL`);
      }
      
      // Use the cached version for faster loading
      console.log(`🔍 Testing cached signed URL for user: ${userId}`);
      console.log(`🔍 About to call ImageUploadService.getUserProfilePictureSignedUrlCached(${userId})`);
      
      try {
        const signedUrl = await ImageUploadService.getUserProfilePictureSignedUrlCached(userId);
        console.log(`🔍 Cached result for user ${userId}:`, signedUrl);
        return signedUrl;
      } catch (error) {
        console.error(`❌ Error calling ImageUploadService.getUserProfilePictureSignedUrlCached for user ${userId}:`, error);
        console.error(`❌ Error details:`, {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting signed URL for user:', userId, error);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <HeartbeatLoader 
          logoSize="xxxxl"
          textSize="xl"
          text="Loading users..." 
          showText={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <CustomIcon name="ri-error-warning-line" className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
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
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CustomIcon name="ri-user-list-line" className="text-xl text-blue-500 mr-2" />
              User Accounts ({users.length})
            </h3>
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
                            console.log(`🔍 User ${user._id} (${user.email}): hasImage = ${!!hasImage}`);
                            if (hasImage) {
                              console.log(`🔍 Image URL for ${user._id}: ${hasImage.substring(0, 50)}...`);
                            }
                            return hasImage ? (
                              <Image
                                src={hasImage}
                                alt={user.profile?.name || user.email}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log(`❌ Image failed to load for user ${user._id}`);
                                  // Fallback to initial if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-white font-semibold">${user.email.charAt(0).toUpperCase()}</span>`;
                                  }
                                }}
                                onLoad={() => {
                                  console.log(`✅ Image loaded successfully for user ${user._id}`);
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
                        const profileCompleteness = user.profile?.profileCompleteness || 0;
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
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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
                            style={{ width: `${user.profile?.profileCompleteness || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {user.profile?.profileCompleteness || 0}%
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
                              <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="text-lg font-bold">⋯</span>
                            )}
                          </button>
                          
                          {openDropdown === user._id && (
                            <div className="dropdown-container absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                {(() => {
                                  const profileCompleteness = user.profile?.profileCompleteness || 0;
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
                                            <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
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
                                            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
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
                                            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
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
                                            <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
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