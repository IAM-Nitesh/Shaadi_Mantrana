'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import AdminRouteGuard from '../../components/AdminRouteGuard';
import { safeGsap } from '../../components/SafeGsap';
import { motion, AnimatePresence } from 'framer-motion';
import { useServerAuth } from '../../hooks/useServerAuth';
import { getClientToken, getAuthStatus } from '../../utils/client-auth';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import logger from '../../utils/logger';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  isFirstLogin: boolean;
  approvedByAdmin: boolean;
  profileCompleteness?: number;
  isPending?: boolean;
  invitationSent?: boolean;
  verification?: {
    isVerified?: boolean;
    approvalType?: string;
  };
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  adminUsers: number;
  recentRegistrations: number;
  totalPreapproved: number;
  approvedUsers: number;
  pausedUsers: number;
  totalInvitations: number;
  totalInvitationCount: number;
}

function AdminPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useServerAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [resumingUser, setResumingUser] = useState<string | null>(null);
  const [pausingUser, setPausingUser] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortField, setSortField] = useState<'firstName' | 'email' | 'createdAt'>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // GSAP refs
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsAdmin(true);
    }
  }, [user]);

  // Initialize admin data
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const initializeAdmin = async () => {
        await Promise.all([fetchUsers(), fetchStats()]);
      };
      initializeAdmin();
    }
  }, [isAuthenticated, isAdmin]);

  // GSAP animations
  useEffect(() => {
    if (isAuthenticated && containerRef.current) {
      // Initial page load animation (safe)
      safeGsap.fromTo?.(containerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });

      // Header animation
      if (headerRef.current) {
        safeGsap.fromTo?.(headerRef.current.children, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
      }

      // Logo heartbeat animation
      if (logoRef.current) {
        safeGsap.to?.(logoRef.current, { scale: 1.1, duration: 1, repeat: -1, yoyo: true, ease: 'power2.inOut' });
      }
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
  const authToken = await getClientToken();
      if (!authToken) {
        logger.error('No auth token available');
        return;
      }
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      logger.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
  const authToken = await getClientToken();
      if (!authToken) {
        logger.error('No auth token available');
        return;
      }
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      logger.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortUsers = (users: User[]) => {
    return users.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'firstName':
          aValue = a.fullName || `${a.firstName} ${a.lastName}`.trim() || a.email;
          bValue = b.fullName || `${b.firstName} ${b.lastName}`.trim() || b.email;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const handleSort = (field: 'firstName' | 'email' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const addUser = async () => {
    if (!newUserEmail.trim()) return;
    
    setAddingUser(true);
    setError('');
    
    try {
  const authToken = await getClientToken();
      if (!authToken) {
        logger.error('No auth token available');
        return;
      }
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          firstName: 'User',
          lastName: 'Name'
        }),
      });

      if (response.ok) {
        setSuccess('User added successfully!');
        setNewUserEmail('');
        setShowAddUserModal(false);
        await Promise.all([fetchUsers(), fetchStats()]);
        
        // Auto-clear success message
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add user');
      }
    } catch (error) {
      setError('Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const pauseUser = async (userId: string, currentlyPaused: boolean) => {
    setPausingUser(userId);
    setError('');
    
    try {
  const authToken = await getClientToken();
      if (!authToken) {
        logger.error('No auth token available');
        return;
      }
      
      const endpoint = currentlyPaused ? 'resume' : 'pause';
      const response = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess(`User ${currentlyPaused ? 'resumed' : 'paused'} successfully!`);
        await Promise.all([fetchUsers(), fetchStats()]);
        
        // Auto-clear success message
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(responseData.error || 'Failed to update user status');
      }
    } catch (error) {
      setError('Failed to update user status');
    } finally {
      setPausingUser(null);
    }
  };

  const resumeUser = async (userId: string) => {
    setResumingUser(userId);
    setError('');
    
    try {
  const authToken = await getClientToken();
      if (!authToken) {
        logger.error('No auth token available');
        return;
      }
      const response = await fetch(`/api/admin/users/${userId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('User resumed successfully!');
        await Promise.all([fetchUsers(), fetchStats()]);
        
        // Auto-clear success message
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resume user');
      }
    } catch (error) {
      setError('Failed to resume user');
    } finally {
      setResumingUser(null);
    }
  };

  const sendInvite = async (userId: string, userEmail: string) => {
    setSendingInvite(userId);
    setError('');
    
    try {
  const authToken = await getClientToken();
      if (!authToken) {
        logger.error('No auth token available');
        return;
      }
      const response = await fetch(`/api/admin/users/${userId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        }),
      });

      if (response.ok) {
        setSuccess('Invitation sent successfully!');
        // Update user to show invitation sent
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, invitationSent: true }
              : user
          )
        );
        
        // Auto-clear success message
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send invitation');
      }
    } catch (error) {
      setError('Failed to send invitation');
    } finally {
      setSendingInvite(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Pagination calculations
  const sortedUsers = sortUsers([...users]);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <HeartbeatLoader 
          logoSize="xxl"
          textSize="lg"
          text="Loading Admin Panel..."
          showText={true}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100 admin-card-hover animate-slide-in-top">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <CustomIcon name="ri-user-line" size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100 admin-card-hover animate-slide-in-top" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <CustomIcon name="ri-user-add-line" size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Preapproved Emails</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPreapproved || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100 admin-card-hover animate-slide-in-top" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                <CustomIcon name="ri-user-settings-line" size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Paused Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pausedUsers || users.filter(u => !u.approvedByAdmin).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-rose-100 animate-slide-in-top" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">User Management</h2>
              <p className="text-sm text-gray-600">Add new users and manage existing accounts</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <CustomIcon name="ri-user-add-line" size={20} />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
            <div className="flex items-center">
              <CustomIcon name="ri-check-line" size={20} className="text-green-600 mr-2" />
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <div className="flex items-center">
              <CustomIcon name="ri-error-warning-line" size={20} className="text-red-600 mr-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div ref={tableRef} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-rose-100 animate-slide-in-top" style={{ animationDelay: '0.4s' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <HeartbeatLoader 
                logoSize="xxl"
                textSize="lg"
                text="Loading Users..."
                showText={true}
              />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <CustomIcon name="ri-user-line" size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No users found</p>
              <p className="text-gray-500">Start by adding your first user</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-rose-50 to-pink-50">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-rose-100 transition-colors"
                        onClick={() => handleSort('firstName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {sortField === 'firstName' && (
                            <CustomIcon 
                              name={sortDirection === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} 
                              size={16} 
                              className="text-rose-600" 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-rose-100 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Email</span>
                          {sortField === 'email' && (
                            <CustomIcon 
                              name={sortDirection === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} 
                              size={16} 
                              className="text-rose-600" 
                            />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-rose-100 transition-colors"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Joined</span>
                          {sortField === 'createdAt' && (
                            <CustomIcon 
                              name={sortDirection === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} 
                              size={16} 
                              className="text-rose-600" 
                            />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-rose-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                              user.isPending 
                                ? 'bg-yellow-100' 
                                : 'bg-gradient-to-r from-rose-100 to-pink-100'
                            }`}>
                              <CustomIcon 
                                name={user.isPending ? "ri-time-line" : "ri-user-line"} 
                                size={20} 
                                className={user.isPending ? "text-yellow-600" : "text-rose-600"} 
                              />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {user.isPending 
                                  ? 'Pending Registration' 
                                  : (user.fullName || `${user.firstName} ${user.lastName}`.trim() || 'No Name')
                                }
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : user.isPending
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.isPending ? 'Pending' : user.role}
                                </span>
                                {user.isFirstLogin && !user.isPending && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    New
                                  </span>
                                )}
                                {user.isPending && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                    Invited
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {user.role === 'admin' ? (
                              <>
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : user.status === 'invited'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.approvedByAdmin 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {user.approvedByAdmin ? 'Approved' : 'Paused'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.role !== 'admin' ? (
                            <Menu as="div" className="relative inline-block text-left">
                              <div>
                                <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                  <EllipsisVerticalIcon className="h-5 w-5" />
                                </Menu.Button>
                              </div>
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg z-50 focus:outline-none">
                                  <div className="py-1">
                                    {!user.isPending && !user.invitationSent && (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => sendInvite(user._id, user.email)}
                                            disabled={sendingInvite === user._id}
                                            className={`block w-full text-left px-4 py-2 text-sm ${
                                              active ? 'bg-blue-50 text-blue-600' : 'text-blue-600'
                                            } disabled:opacity-50`}
                                          >
                                            {sendingInvite === user._id ? 'Sending...' : 'Send Invite'}
                                          </button>
                                        )}
                                      </Menu.Item>
                                    )}
                                    
                                    {!user.isPending && (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => pauseUser(user._id, !user.approvedByAdmin)}
                                            disabled={pausingUser === user._id}
                                            className={`block w-full text-left px-4 py-2 text-sm ${
                                              active ? 'bg-yellow-50 text-yellow-600' : 'text-yellow-600'
                                            } disabled:opacity-50`}
                                          >
                                            {pausingUser === user._id 
                                              ? (user.approvedByAdmin ? 'Pausing...' : 'Resuming...') 
                                              : (user.approvedByAdmin ? 'Pause' : 'Resume')
                                            }
                                          </button>
                                        )}
                                      </Menu.Item>
                                    )}
                                    
                                    {user.status === 'paused' && (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => resumeUser(user._id)}
                                            disabled={resumingUser === user._id}
                                            className={`block w-full text-left px-4 py-2 text-sm ${
                                              active ? 'bg-green-50 text-green-600' : 'text-green-600'
                                            } disabled:opacity-50`}
                                          >
                                            {resumingUser === user._id ? 'Resuming...' : 'Resume'}
                                          </button>
                                        )}
                                      </Menu.Item>
                                    )}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          ) : (
                            <span className="text-gray-400 text-xs">Admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, users.length)} of {users.length} users
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-rose-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CustomIcon name="ri-close-line" size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                disabled={addingUser}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={addingUser}
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                disabled={addingUser || !newUserEmail.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingUser ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

  {/* Logout Animation Overlay */}
  <div className="logout-overlay fixed inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
        
        {/* Animated Hearts Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Heart 1 */}
          <div className="floating-heart absolute" style={{ left: '10%', top: '20%' }}>
            <div className="w-6 h-6 text-red-400 opacity-80">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 2 */}
          <div className="floating-heart absolute" style={{ right: '15%', top: '30%' }}>
            <div className="w-5 h-5 text-pink-400 opacity-70">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 3 */}
          <div className="floating-heart absolute" style={{ left: '20%', bottom: '25%' }}>
            <div className="w-4 h-4 text-rose-400 opacity-90">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* Heart 4 */}
          <div className="floating-heart absolute" style={{ right: '25%', bottom: '35%' }}>
            <div className="w-5 h-5 text-red-500 opacity-60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 text-center">
          {/* Brand Logo */}
          <div className="logout-logo w-64 h-64 mx-auto mb-8">
            <img src="/icon.svg" alt="Shaadi Mantrana" className="w-full h-full heartbeat-animation" />
          </div>
          
          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Logging out...</h2>
          <p className="text-gray-600 mb-8">Thank you for using Shaadi Mantrana</p>
          
          {/* Loading Dots - Removed red dots */}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRouteGuard>
      <AdminPageContent />
    </AdminRouteGuard>
  );
} 