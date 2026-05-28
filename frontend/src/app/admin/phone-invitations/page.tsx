'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../../components/CustomIcon';
import ToastService from '../../../services/toastService';
import RoyalLoader from '../../../components/RoyalLoader';
import { safeGsap } from '../../../components/SafeGsap';
import logger from '../../../utils/logger';
import { apiClient } from '../../../utils/api-client';

interface Invitation {
  _id: string;
  phoneNumber?: string;
  email?: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  uuid?: string;
}

export default function PhoneInvitations() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      // Admin authentication is already handled by AdminLayout
      const response = await apiClient.get('/api/admin/invitations', {
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
    if (!newPhoneNumber.trim()) return;

    try {
      setSendingInvitation(true);
      // Admin authentication is already handled by AdminLayout
      
      const rawNumber = newPhoneNumber.trim().replace(/\D/g, ''); // strip non-digits
      // Auto-prefix +91 if user entered just 10 digits
      const phoneNumber = rawNumber.length === 10 ? `+91${rawNumber}` : rawNumber.startsWith('91') ? `+${rawNumber}` : `+${rawNumber}`;
      logger.debug('Sending invitation to phone:', phoneNumber);
      
      // Validate: must be +91 followed by 10 digits
      const phoneRegex = /^\+91\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Please enter a valid 10-digit Indian phone number');
      }
      
      const response = await apiClient.post('/api/admin/invitations', { phoneNumber }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      logger.debug('Response status:', response.status);
      logger.debug('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = response.data;
        logger.debug('Success response:', responseData);
        ToastService.success('Invitation sent successfully');
        setNewPhoneNumber('');
        await fetchInvitations();
      } else {
        const errorData: any = response.data || { error: 'Unknown error' };
        logger.error('Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to send invitation`);
      }
    } catch (error) {
      logger.error('Error sending invitation:', error);
      ToastService.error(`Failed to send invitation: ${error.message}`);
    } finally {
      setSendingInvitation(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      setResendingInvitation(invitationId);
      // Admin authentication is already handled by AdminLayout
      
      const response = await apiClient.post(`/api/admin/invitations/${invitationId}/resend`, {}, {
        timeout: 15000
      });

      if (response.ok) {
        // Update local state
        setInvitations(invitations.map(inv => 
          inv._id === invitationId 
            ? { ...inv, status: 'sent', sentAt: new Date().toISOString() }
            : inv
        ));
        ToastService.success('Invitation resent successfully');
      } else {
        throw new Error('Failed to resend invitation');
      }
    } catch (error) {
      logger.error('Error resending invitation:', error);
      ToastService.error('Failed to resend invitation');
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
      case 'used':
        return 'bg-emerald-900/40 text-emerald-400';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-royal-gold/20 text-royal-gold';
      default:
        return 'bg-royal-gold/10 text-white/90';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 mt-8 space-y-8">
        <RoyalLoader variant="skeleton" className="w-64 h-12 rounded-xl mb-8" />
        <RoyalLoader variant="skeleton" className="w-full h-40 rounded-2xl" />
        <RoyalLoader variant="skeleton" className="w-full h-96 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CustomIcon name="ri-error-warning-line" className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white/90 mb-2">Error Loading Invitations</h2>
          <p className="text-royal-gold/80 mb-4">{error}</p>
          <button
            onClick={fetchInvitations}
            className="px-6 py-3 bg-royal-gold text-royal-obsidian rounded-xl hover:bg-royal-gold-light transition-colors"
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
        <h1 className="text-3xl font-bold text-white/90 mb-2 flex items-center">
          <CustomIcon name="ri-phone-line" className="text-4xl text-royal-gold mr-3" />
          Phone Invitations
        </h1>
        <p className="text-royal-gold/80">Send and manage phone invitations to new users</p>
      </div>

      {/* Add New Invitation */}
      <div className="invitation-card bg-royal-gold/5 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.1)] p-6 border border-royal-gold/20 mb-8">
        <h3 className="text-lg font-semibold text-white/90 mb-4">
          Send New Invitation
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex rounded-xl overflow-hidden border border-royal-gold/30 focus-within:ring-2 focus-within:ring-royal-gold/50">
              <span className="flex items-center px-4 bg-royal-gold/10 text-royal-gold font-semibold text-sm border-r border-royal-gold/30 whitespace-nowrap">+91</span>
              <input
                type="tel"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="flex-1 px-4 py-3 bg-royal-obsidian text-white focus:outline-none transition-all duration-200"
              />
            </div>
            <p className="text-xs text-royal-gold/50 mt-2">Enter 10-digit number — +91 is added automatically</p>
          </div>
          <button
            onClick={sendNewInvitation}
            disabled={newPhoneNumber.trim().replace(/\D/g, '').length !== 10 || sendingInvitation}
            className={`px-6 py-3 bg-royal-gold text-royal-obsidian font-semibold rounded-xl hover:bg-royal-gold-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${sendingInvitation ? 'shimmer-button' : ''}`}
          >
            {sendingInvitation ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div className="invitation-card bg-royal-gold/5 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.1)] border border-royal-gold/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-royal-gold/20">
            <h3 className="text-lg font-semibold text-white/90 flex items-center">
              <CustomIcon name="ri-mail-list-line" className="text-xl text-royal-gold-light mr-2" />
              Invitation History ({invitations.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-royal-obsidian">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold/60 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold/60 uppercase tracking-wider">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-royal-glass divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation._id} className="hover:bg-royal-obsidian transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-royal-obsidian to-royal-glass-border border border-royal-gold/30 rounded-full flex items-center justify-center text-royal-gold font-semibold shadow-md">
                            <CustomIcon name="ri-phone-line" className="text-lg" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{invitation.phoneNumber || invitation.email || 'No contact'}</div>
                          {invitation.uuid && (
                            <div className="text-xs text-royal-gold/60">UUID: {invitation.uuid}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-royal-gold/60">
                      {invitation.sentAt ? formatDate(invitation.sentAt) : 'Not sent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invitations.length === 0 && (
            <div className="text-center py-12">
              <CustomIcon name="ri-phone-line" className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No invitations found</h3>
              <p className="text-royal-gold/60">No phone invitations have been sent yet.</p>
            </div>
          )}
        </div>
    </div>
  );
} 