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
      const url = adminKey 
        ? `${apiBaseUrl}/api/admin/approved-emails?adminKey=${encodeURIComponent(adminKey)}`
        : `${apiBaseUrl}/api/admin/approved-emails`;
        
      const response = await fetch(url, {
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
      return data.emails || [];
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
}
