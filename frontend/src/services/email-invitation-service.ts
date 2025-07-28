// Email Invitation Service for Frontend
// This service handles sending welcome emails to all approved users

// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:3500 (static), 4500 (dev), 5500 (prod)
import configService from './configService';

export interface InvitationResult {
  email: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface InvitationSummary {
  total: number;
  sent: number;
  failed: number;
  results: InvitationResult[];
}

export class EmailInvitationService {
  /**
   * Send invitation emails to all approved users
   * @param adminKey - Admin authentication key
   * @returns Promise with invitation results
   */
  static async sendInvitations(adminKey: string): Promise<InvitationSummary> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      // Demo mode
      console.log('Demo mode: Email invitations simulated');
      return {
        total: 5,
        sent: 5,
        failed: 0,
        results: [
          { email: 'demo1@example.com', status: 'sent' },
          { email: 'demo2@example.com', status: 'sent' },
          { email: 'demo3@example.com', status: 'sent' },
          { email: 'demo4@example.com', status: 'sent' },
          { email: 'demo5@example.com', status: 'sent' }
        ]
      };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/send-invitations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        total: data.summary.total,
        sent: data.summary.sent,
        failed: data.summary.failed,
        results: data.results
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to send invitations: ${error.message}`);
      }
      throw new Error(`Failed to send invitations: ${String(error)}`);
    }
  }

  /**
   * Get approved emails for admin panel
   */
  static async getApprovedEmails(adminKey?: string): Promise<string[]> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      // Demo mode
      return [
        'demo1@example.com',
        'demo2@example.com',
        'demo3@example.com'
      ];
    }

    try {
      // Use the new admin API to get users
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Extract emails from users data
      return data.users?.map((user: any) => user.email) || [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching approved emails:', error);
        throw error;
      }
      console.error('Error fetching approved emails:', error);
      throw error;
    }
  }

  /**
   * Validate admin key
   */
  static validateAdminKey(adminKey: string): boolean {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      // Demo mode - accept any non-empty key
      return adminKey && adminKey.length > 0;
    }

    // In production, this would validate against the backend
    // For now, we'll do a simple check
    return adminKey && adminKey.length >= 8;
  }

  /**
   * Get email preview template
   */
  static getEmailPreview(): { 
    subject: string; 
    body: string; 
    features: string[]; 
    steps: string[]; 
    support: string 
  } {
    return {
      subject: "Welcome to ShaadiMantra - Your Journey to Finding Love Begins!",
      body: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #ff6b6b;">Welcome to ShaadiMantra!</h2>
          <p>We're excited to have you join our community of individuals seeking meaningful connections.</p>
          <p>Your profile has been approved and you can now:</p>
          <ul>
            <li>Complete your detailed profile</li>
            <li>Browse potential matches</li>
            <li>Connect with like-minded individuals</li>
            <li>Take the next step in your journey to love</li>
          </ul>
          <p>Get started by logging into your account and completing your profile.</p>
          <p>Best wishes,<br>The ShaadiMantra Team</p>
        </div>
      `,
      features: [
        "Personalized match recommendations",
        "Secure and verified profiles",
        "Advanced compatibility filters",
        "Direct messaging with matches",
        "Privacy-focused platform"
      ],
      steps: [
        "Complete your profile with photos and preferences",
        "Browse and like potential matches",
        "Connect with mutual interests",
        "Start meaningful conversations",
        "Plan your first meeting"
      ],
      support: "support@shaadimantra.com"
    };
  }

  /**
   * Add email to approved list
   * @param adminKey - Admin authentication key
   * @param email - Email to add
   * @returns Promise with success status
   */
  static async addApprovedEmail(adminKey: string, email: string): Promise<boolean> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      console.log(`Demo mode: Added ${email} to approved emails`);
      return true;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/approved-emails/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to add approved email:', error);
        return false;
      }
      console.error('Failed to add approved email:', error);
      return false;
    }
  }

  /**
   * Remove email from approved list
   * @param adminKey - Admin authentication key
   * @param email - Email to remove
   * @returns Promise with success status
   */
  static async removeApprovedEmail(adminKey: string, email: string): Promise<boolean> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      console.log(`Demo mode: Removed ${email} from approved emails`);
      return true;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/approved-emails/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to remove approved email:', error);
        return false;
      }
      console.error('Failed to remove approved email:', error);
      return false;
    }
  }

  // Create invitation (admin only)
  static async createInvitation(email: string): Promise<any> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return null;
    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ email })
      });
      if (response.status === 403) throw new Error('Only admin can send invitations');
      if (response.status === 400) throw new Error('Email not preapproved');
      if (!response.ok) throw new Error('Failed to create invitation');
      return await response.json();
    } catch (error) {
      console.error('Error creating invitation:', error);
      return null;
    }
  }

  // List all invitations (admin only)
  static async getInvitations(): Promise<any[]> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return [];
    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.status === 403) throw new Error('Only admin can view invitations');
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return (await response.json()).invitations || [];
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }
  }

  // Get invitation by code/UUID
  static async getInvitationByCode(code: string): Promise<any | null> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return null;
    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations/${code}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch invitation');
      return await response.json();
    } catch (error) {
      console.error('Error fetching invitation:', error);
      return null;
    }
  }

  // Update invitation (accept/decline/resend)
  static async updateInvitation(code: string, status: string): Promise<any | null> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return null;
    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update invitation');
      return await response.json();
    } catch (error) {
      console.error('Error updating invitation:', error);
      return null;
    }
  }

  // Delete invitation (admin only)
  static async deleteInvitation(code: string): Promise<boolean> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return false;
    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Failed to delete invitation');
      return true;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      return false;
    }
  }

  // List all preapproved emails (admin only)
  static async listPreapprovedEmails(): Promise<{ email: string; uuid: string }[]> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return [];
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      // Map users to email and uuid format
      return data.users?.map((user: any) => ({
        email: user.email,
        uuid: user.userUuid
      })) || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Add a preapproved email (admin only)
  static async addPreapprovedEmail(email: string): Promise<{ email: string; uuid: string } | null> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return null;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          firstName: 'User',
          lastName: 'Name'
        }),
      });
      if (!response.ok) throw new Error('Failed to add user');
      const data = await response.json();
      return data.uuid ? { email: data.email, uuid: data.uuid } : null;
    } catch (error) {
      console.error('Error adding user:', error);
      return null;
    }
  }

  // Remove a preapproved email (admin only) - Now pauses the user instead
  static async removePreapprovedEmail(email: string): Promise<boolean> {
    const apiBaseUrl = configService.apiBaseUrl;
    if (!apiBaseUrl) return false;
    try {
      // First get the user to find their ID
      const usersResponse = await fetch(`${apiBaseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      const user = usersData.users?.find((u: any) => u.email === email);
      if (!user) throw new Error('User not found');
      
      // Pause the user
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${user._id}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to pause user');
      return true;
    } catch (error) {
      console.error('Error pausing user:', error);
      return false;
    }
  }
}
