'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../../components/CustomIcon';
import { getClientToken } from '../../../utils/client-auth';
import HeartbeatLoader from '../../../components/HeartbeatLoader';
import { safeGsap } from '../../../components/SafeGsap';
import logger from '../../../utils/logger';
import { apiClient } from '../../../utils/api-client';

interface Invitation {
  _id: string;
  email: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  uuid?: string;
}

export default function EmailInvitations() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
  const token = await getClientToken();
      if (!token) {
        router.push('/');
        return;
      }

      const response = await apiClient.get('/api/admin/invitations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = response.data;
      logger.debug('Received invitations data:', data.invitations);
      setInvitations(data.invitations || []);

  // Animate content on load (safe)
  safeGsap.fromTo?.('.invitation-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out' });

    } catch (error) {
      logger.error('Error fetching invitations:', error);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendNewInvitation = async () => {
    if (!newEmail.trim()) return;

    try {
      setSendingInvitation(true);
  const token = await getClientToken();
      
      logger.debug('Sending invitation to:', newEmail.trim());
      logger.debug('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await apiClient.post('/api/admin/invitations', { email: newEmail.trim() }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      logger.debug('Response status:', response.status);
      logger.debug('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = response.data;
        logger.debug('Success response:', responseData);
        setNewEmail('');
        await fetchInvitations();
      } else {
        const errorData: any = response.data || { error: 'Unknown error' };
        logger.error('Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to send invitation`);
      }
    } catch (error) {
      logger.error('Error sending invitation:', error);
      setError(`Failed to send invitation: ${error.message}`);
    } finally {
      setSendingInvitation(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      setResendingInvitation(invitationId);
  const token = await getClientToken();
      
      const response = await apiClient.post(`/api/admin/invitations/${invitationId}/resend`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      });

      if (response.ok) {
        // Update local state
        setInvitations(invitations.map(inv => 
          inv._id === invitationId 
            ? { ...inv, status: 'sent', sentAt: new Date().toISOString() }
            : inv
        ));
      } else {
        throw new Error('Failed to resend invitation');
      }
    } catch (error) {
      logger.error('Error resending invitation:', error);
      setError('Failed to resend invitation');
    } finally {
      setResendingInvitation(null);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'Not available';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      logger.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <HeartbeatLoader 
          logoSize="xxl"
          textSize="lg"
          text="Loading invitations..." 
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Invitations</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchInvitations}
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
          <CustomIcon name="ri-mail-line" className="text-4xl text-blue-600 mr-3" />
          Email Invitations
        </h1>
        <p className="text-gray-600">Send and manage email invitations to new users</p>
      </div>

      {/* Add New Invitation */}
      <div className="invitation-card bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Send New Invitation
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            onClick={sendNewInvitation}
            disabled={!newEmail.trim() || sendingInvitation}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {sendingInvitation ? (
              <>
                <div className="flex items-center justify-center mr-2">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs">💝</span>
                  </div>
                </div>
                Sending...
              </>
            ) : (
              <>
                Send Invitation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div className="invitation-card bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CustomIcon name="ri-mail-list-line" className="text-xl text-blue-500 mr-2" />
              Invitation History ({invitations.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                          <CustomIcon name="ri-mail-line" className="text-lg" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                          {invitation.uuid && (
                            <div className="text-xs text-gray-500">UUID: {invitation.uuid}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invitation.sentAt ? formatDate(invitation.sentAt) : 'Not sent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invitations.length === 0 && (
            <div className="text-center py-12">
              <CustomIcon name="ri-mail-line" className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
              <p className="text-gray-500">No email invitations have been sent yet.</p>
            </div>
          )}
        </div>
    </div>
  );
} 