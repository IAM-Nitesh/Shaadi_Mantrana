const nodemailer = require('nodemailer');
const config = require('../config');
const reactEmailService = require('./reactEmailService');

class InviteEmailService {
  constructor() {
    this.fromEmail = config.EMAIL.FROM_EMAIL || 'shaadimantrana.help@gmail.com';
    this.fromName = config.EMAIL.FROM_NAME || 'Shaadi Mantrana';
    this.transporter = null;
    this.initialized = false;
    
    // Only initialize transporter if email is enabled
    if (config.EMAIL.ENABLED) {
      this.initializeTransporter();
    }
  }

  initializeTransporter() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if email service is enabled
      if (!config.EMAIL.ENABLED) {
        console.log('📧 Email service is disabled in configuration');
        return;
      }

      // Create transporter with Gmail configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.EMAIL.SMTP_USER,
          pass: config.EMAIL.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Set initialized flag immediately
      this.initialized = true;
      console.log('✅ Invite email service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize invite email service:', error.message);
      this.transporter = null;
      this.initialized = false;
    }
  }

  // Generate onboarding email template using React Email
  async generateOnboardingEmailHTML(userEmail, inviteLink, userUuid) {
    try {
      return await reactEmailService.renderWelcomeEmail(userEmail, inviteLink, userUuid);
    } catch (error) {
      console.error('❌ Failed to render onboarding email template:', error.message);
      throw new Error('Failed to generate onboarding email template using React Email');
    }
  }

  // Generate beautiful HTML email template for invitations
  async generateInviteEmailHTML(userEmail, inviteLink, userUuid) {
    try {
      return await reactEmailService.renderWelcomeEmail(userEmail, inviteLink, userUuid);
    } catch (error) {
      console.error('❌ Failed to render invite email template:', error.message);
      throw new Error('Failed to generate invite email template using React Email');
    }
  }



  // Send onboarding email
  async sendOnboardingEmail(userEmail, userUuid) {
    // Initialize transporter if not already done
    if (!this.initialized && config.EMAIL.ENABLED) {
      this.initializeTransporter();
    }

    try {
      // Generate invite link
      const baseUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}?invite=${userUuid}&email=${encodeURIComponent(userEmail)}`;

      // If email service is disabled or not working, just log the link
      if (!this.transporter || !config.EMAIL.ENABLED) {
        console.log(`📧 Onboarding link for ${userEmail}: ${inviteLink} (Email service disabled - using console)`);
        return {
          success: true,
          messageId: 'console-' + Date.now(),
          inviteLink: inviteLink,
          method: 'console'
        };
      }

      // Email content
      const subject = '🎉 Welcome to Shaadi Mantrana - Your Journey Begins!';
      const htmlContent = await this.generateOnboardingEmailHTML(userEmail, inviteLink, userUuid);

      // Email options
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        // Explicitly set to HTML only - no text fallback
        text: undefined,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'MIME-Version': '1.0',
          'X-Mailer': 'Shaadi Mantrana React Email System'
        }
      };

      console.log(`📧 Attempting to send onboarding email to ${userEmail}...`);
      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Onboarding email sent successfully to ${userEmail}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        inviteLink: inviteLink,
        method: 'email'
      };

    } catch (error) {
      console.error(`❌ Failed to send onboarding email to ${userEmail}:`, error.message);
      
      // Fallback for development or when email fails
      const baseUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}?invite=${userUuid}&email=${encodeURIComponent(userEmail)}`;
      
      console.log(`📧 Development fallback - Onboarding link for ${userEmail}: ${inviteLink}`);
      
      return {
        success: true,
        messageId: 'dev-fallback',
        inviteLink: inviteLink,
        emailError: error.message,
        method: 'console_fallback'
      };
    }
  }

  // Send invitation email
  async sendInviteEmail(userEmail, userUuid) {
    // Initialize transporter if not already done
    if (!this.initialized && config.EMAIL.ENABLED) {
      this.initializeTransporter();
    }

    try {
      // Generate invite link
      const baseUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}?invite=${userUuid}&email=${encodeURIComponent(userEmail)}`;

      // If email service is disabled or not working, just log the link
      if (!this.transporter || !config.EMAIL.ENABLED) {
        console.log(`📧 Invitation link for ${userEmail}: ${inviteLink} (Email service disabled - using console)`);
        return {
          success: true,
          messageId: 'console-' + Date.now(),
          inviteLink: inviteLink,
          method: 'console'
        };
      }

      // Email content
      const subject = '🎉 Welcome to Shaadi Mantrana - Your Exclusive Invitation';
      const htmlContent = await this.generateInviteEmailHTML(userEmail, inviteLink, userUuid);

      // Email options
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        // Explicitly set to HTML only - no text fallback
        text: undefined,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'MIME-Version': '1.0',
          'X-Mailer': 'Shaadi Mantrana React Email System'
        }
      };

      console.log(`📧 Attempting to send invitation email to ${userEmail}...`);
      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Invitation email sent successfully to ${userEmail}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        inviteLink: inviteLink,
        method: 'email'
      };

    } catch (error) {
      console.error(`❌ Failed to send invitation email to ${userEmail}:`, error.message);
      
      // Fallback for development or when email fails
      const baseUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}?invite=${userUuid}&email=${encodeURIComponent(userEmail)}`;
      
      console.log(`📧 Development fallback - Invitation link for ${userEmail}: ${inviteLink}`);
      
      return {
        success: true,
        messageId: 'dev-fallback',
        inviteLink: inviteLink,
        emailError: error.message,
        method: 'console_fallback'
      };
    }
  }

  // Send bulk invitation emails
  async sendBulkInviteEmails(users) {
    const results = [];
    
    for (const user of users) {
      try {
        const result = await this.sendInviteEmail(user.email, user.userUuid);
        results.push({
          email: user.email,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          email: user.email,
          success: false,
          error: error.message
        });
      }
      
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new InviteEmailService(); 