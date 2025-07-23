// Pre-approved Email Service
// Manages the list of approved emails for registration

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Pre-approved emails list with UUIDs (in production, this would be in database)
let approvedEmails = [
  {
    email: 'niteshkumar9591@gmail.com',
    userUuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Your specific UUID
    role: 'admin',
    addedAt: '2025-07-22T12:52:00.000Z'
  }
];

// For backward compatibility - extract email strings
const emailList = approvedEmails.map(item => typeof item === 'string' ? item : item.email);

// Email domains that are automatically approved
const approvedDomains = [
  'outlook.com',
  'gmail.com' ,
  'yahoo.com'
];

class PreApprovedEmailService {
  constructor() {
    this.approvedEmails = new Set(emailList.map(email => email.toLowerCase()));
    this.approvedEmailsWithUuid = new Map(
      approvedEmails.map(item => {
        const email = typeof item === 'string' ? item : item.email;
        const uuid = typeof item === 'string' ? uuidv4() : item.userUuid;
        return [email.toLowerCase(), { ...item, email: email.toLowerCase(), userUuid: uuid }];
      })
    );
    this.approvedDomains = new Set(approvedDomains.map(domain => domain.toLowerCase()));
    this.pendingApprovals = new Map(); // For tracking pending email approvals
    this.loadApprovedEmails();
  }

  // Load approved emails from file (if exists)
  async loadApprovedEmails() {
    try {
      const filePath = path.join(__dirname, '../data/approved-emails.json');
      const data = await fs.readFile(filePath, 'utf8');
      const emailData = JSON.parse(data);
      
      if (emailData.emails && Array.isArray(emailData.emails)) {
        emailData.emails.forEach(email => {
          this.approvedEmails.add(email.toLowerCase());
        });
      }
      
      console.log(`✅ Loaded ${this.approvedEmails.size} approved emails`);
    } catch (error) {
      console.log('ℹ️ No approved emails file found, using default list');
    }
  }

  // Save approved emails to file
  async saveApprovedEmails() {
    try {
      const dataDir = path.join(__dirname, '../data');
      await fs.mkdir(dataDir, { recursive: true });
      
      const filePath = path.join(dataDir, 'approved-emails.json');
      const emailData = {
        emails: Array.from(this.approvedEmails),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(emailData, null, 2));
      console.log('✅ Approved emails saved to file');
    } catch (error) {
      console.error('❌ Failed to save approved emails:', error);
    }
  }

  // Check if email is pre-approved
  isEmailApproved(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check direct email approval
    if (this.approvedEmails.has(normalizedEmail)) {
      return true;
    }

    // Check domain approval
    const domain = normalizedEmail.split('@')[1];
    if (domain && this.approvedDomains.has(domain)) {
      return true;
    }

    return false;
  }

  // Get approval status with details
  getEmailStatus(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split('@')[1];
    
    if (this.approvedEmails.has(normalizedEmail)) {
      return {
        approved: true,
        reason: 'Email is in approved list',
        type: 'direct'
      };
    }

    if (domain && this.approvedDomains.has(domain)) {
      return {
        approved: true,
        reason: `Domain ${domain} is approved`,
        type: 'domain'
      };
    }

    if (this.pendingApprovals.has(normalizedEmail)) {
      return {
        approved: false,
        reason: 'Email approval is pending',
        type: 'pending',
        requestedAt: this.pendingApprovals.get(normalizedEmail)
      };
    }

    return {
      approved: false,
      reason: 'Email not in approved list',
      type: 'not_approved'
    };
  }

  // Add email to approved list
  async approveEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    this.approvedEmails.add(normalizedEmail);
    this.pendingApprovals.delete(normalizedEmail);
    
    await this.saveApprovedEmails();
    
    return {
      success: true,
      message: `Email ${normalizedEmail} has been approved`,
      email: normalizedEmail
    };
  }

  // Remove email from approved list
  async removeEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (this.approvedEmails.has(normalizedEmail)) {
      this.approvedEmails.delete(normalizedEmail);
      await this.saveApprovedEmails();
      
      return {
        success: true,
        message: `Email ${normalizedEmail} has been removed from approved list`,
        email: normalizedEmail
      };
    }

    return {
      success: false,
      message: `Email ${normalizedEmail} was not in approved list`,
      email: normalizedEmail
    };
  }

  // Request email approval (for admin review)
  requestApproval(email, userInfo = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    if (this.isEmailApproved(normalizedEmail)) {
      return {
        success: false,
        message: 'Email is already approved',
        email: normalizedEmail
      };
    }

    this.pendingApprovals.set(normalizedEmail, {
      requestedAt: new Date().toISOString(),
      userInfo,
      attempts: (this.pendingApprovals.get(normalizedEmail)?.attempts || 0) + 1
    });

    return {
      success: true,
      message: 'Approval request submitted for review',
      email: normalizedEmail,
      status: 'pending'
    };
  }

  // Get all pending approvals
  getPendingApprovals() {
    return Array.from(this.pendingApprovals.entries()).map(([email, data]) => ({
      email,
      ...data
    }));
  }

  // Add approved domain
  async addApprovedDomain(domain) {
    const normalizedDomain = domain.toLowerCase().trim();
    this.approvedDomains.add(normalizedDomain);
    
    return {
      success: true,
      message: `Domain ${normalizedDomain} has been approved`,
      domain: normalizedDomain
    };
  }

  // Get statistics
  getStats() {
    return {
      approvedEmails: this.approvedEmails.size,
      approvedDomains: this.approvedDomains.size,
      pendingApprovals: this.pendingApprovals.size,
      lastUpdated: new Date().toISOString()
    };
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get all approved emails (for admin)
  getAllApprovedEmails() {
    return {
      emails: Array.from(this.approvedEmails),
      emailsWithUuid: Array.from(this.approvedEmailsWithUuid.values()),
      domains: Array.from(this.approvedDomains),
      stats: this.getStats()
    };
  }

  // Get UUID for approved email
  getEmailUuid(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const emailData = this.approvedEmailsWithUuid.get(normalizedEmail);
    return emailData ? emailData.userUuid : null;
  }

  // Get email info including UUID
  getEmailInfo(email) {
    const normalizedEmail = email.toLowerCase().trim();
    return this.approvedEmailsWithUuid.get(normalizedEmail) || null;
  }
}

// Create singleton instance
const preApprovedEmailService = new PreApprovedEmailService();

module.exports = preApprovedEmailService;
