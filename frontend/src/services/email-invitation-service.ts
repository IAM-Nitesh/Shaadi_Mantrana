// Email Invitation Service for Frontend
// This service handles email invitation operations and uses the same API config as auth service

import { config } from './configService';

export const API_CONFIG = {
  API_BASE_URL: config.apiBaseUrl,
};

export interface Invitation {
  _id: string;
  email: string;
  uuid: string;
  invitationId: string;
  status: 'sent' | 'delivered' | 'failed' | 'opened';
  sentDate: string;
  count: number;
  sentBy: string;
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  email: string;
  userUuid: string;
  invitationId: string;
  emailSent: boolean;
  inviteLink?: string;
  messageId?: string;
}

export class EmailInvitationService {
  // Send invitation email
  static async sendInvitation(email: string): Promise<InvitationResponse> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL not configured');
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('EmailInvitationService.sendInvitation error:', error);
      throw error;
    }
  }

  // Get all invitations
  static async getInvitations(): Promise<Invitation[]> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return [];
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }
      
      const data = await response.json();
      return data.invitations || [];
    } catch (error) {
      console.error('EmailInvitationService.getInvitations error:', error);
      return [];
    }
  }

  // Remove invitation
  static async removeInvitation(email: string): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return false;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      return response.ok;
    } catch (error) {
      console.error('EmailInvitationService.removeInvitation error:', error);
      return false;
    }
  }

  // Get invitation statistics
  static async getInvitationStats(): Promise<{
    totalInvitations: number;
    sentInvitations: number;
    deliveredInvitations: number;
    failedInvitations: number;
  }> {
    const invitations = await this.getInvitations();
    
    return {
      totalInvitations: invitations.length,
      sentInvitations: invitations.filter(inv => inv.status === 'sent').length,
      deliveredInvitations: invitations.filter(inv => inv.status === 'delivered').length,
      failedInvitations: invitations.filter(inv => inv.status === 'failed').length,
    };
  }

  // Check if email is approved (now uses User collection)
  static async checkEmailApproval(email: string): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return false;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/preapproved/check?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.preapproved || false;
    } catch (error) {
      console.error('EmailInvitationService.checkEmailApproval error:', error);
      return false;
    }
  }

  // Get user approval status (for admin panel)
  static async getUserApprovalStatus(email: string): Promise<{
    isApproved: boolean;
    role: string;
    status: string;
    isFirstLogin: boolean;
    profileCompleteness: number;
  } | null> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return null;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/preapproved/check?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      // The API now returns user data if approved
      if (data.preapproved && data.user) {
        return {
          isApproved: true,
          role: data.user.role || 'user',
          status: data.user.status || 'active',
          isFirstLogin: data.user.isFirstLogin || false,
          profileCompleteness: data.user.profileCompleteness || 0,
        };
      }
      
      return {
        isApproved: false,
        role: 'user',
        status: 'not_found',
        isFirstLogin: true,
        profileCompleteness: 0,
      };
    } catch (error) {
      console.error('EmailInvitationService.getUserApprovalStatus error:', error);
      return null;
    }
  }
}
