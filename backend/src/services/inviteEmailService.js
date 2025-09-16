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

      // If provider is not SMTP (e.g. resend), skip creating SMTP transporter
      const provider = (config.EMAIL.PROVIDER || 'smtp').toLowerCase();
      if (provider !== 'smtp') {
        console.log(`📧 Invite email: skipping SMTP transporter because provider is '${provider}'`);
        this.initialized = true;
        return;
      }

      // Create transporter with SMTP configuration (Gmail or other)
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

  // Send using Resend HTTP API
  async sendViaResend(toEmail, subject, html) {
    const apiKey = config.EMAIL.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    const controller = new AbortController();
    const timeoutMs = config.EMAIL.SEND_TIMEOUT_MS || 5000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${this.fromName} <${config.EMAIL.FROM_EMAIL || config.EMAIL.SMTP_USER}>`,
          to: toEmail,
          subject,
          html
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Resend API error: HTTP ${res.status} ${res.statusText} ${errText}`);
      }
      const data = await res.json().catch(() => ({}));
      const messageId = data.id || `resend-${Date.now()}`;
      return { success: true, method: 'resend', messageId };
    } catch (e) {
      clearTimeout(timeout);
      throw e;
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
      if (!config.EMAIL.ENABLED) {
        console.log(`📧 Onboarding link for ${userEmail}: ${inviteLink} (Email service disabled - using console)`);
        return {
          success: true,
          messageId: 'console-' + Date.now(),
          inviteLink: inviteLink,
          method: 'console'
        };
      }

      // If provider is Resend, use its HTTP API
      const provider = (config.EMAIL.PROVIDER || 'smtp').toLowerCase();
      if (provider === 'resend') {
        try {
          const subject = '🎉 Welcome to Shaadi Mantrana - Your Journey Begins!';
          const htmlContent = await this.generateOnboardingEmailHTML(userEmail, inviteLink, userUuid);
          const result = await this.sendViaResend(userEmail, subject, htmlContent);
          console.log(`✅ Onboarding email sent via Resend to ${userEmail}`);
          return {
            success: true,
            messageId: result.messageId,
            inviteLink,
            method: 'resend'
          };
        } catch (error) {
          console.error(`❌ Resend send failed for ${userEmail}:`, error.message);
          // fall through to transporter or console fallback
        }
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
      if (!config.EMAIL.ENABLED) {
        console.log(`📧 Invitation link for ${userEmail}: ${inviteLink} (Email service disabled - using console)`);
        return {
          success: true,
          messageId: 'console-' + Date.now(),
          inviteLink: inviteLink,
          method: 'console'
        };
      }

      // If provider is Resend, use its HTTP API
      const provider2 = (config.EMAIL.PROVIDER || 'smtp').toLowerCase();
      if (provider2 === 'resend') {
        try {
          const subject = '🎉 Welcome to Shaadi Mantrana - Your Exclusive Invitation';
          const htmlContent = await this.generateInviteEmailHTML(userEmail, inviteLink, userUuid);
          const result = await this.sendViaResend(userEmail, subject, htmlContent);
          console.log(`✅ Invitation email sent via Resend to ${userEmail}`);
          return {
            success: true,
            messageId: result.messageId,
            inviteLink,
            method: 'resend'
          };
        } catch (error) {
          console.error(`❌ Resend send failed for ${userEmail}:`, error.message);
          // fall through to transporter or console fallback
        }
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