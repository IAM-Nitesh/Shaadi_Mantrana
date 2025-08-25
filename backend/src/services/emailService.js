const nodemailer = require('nodemailer');
const config = require('../config');
const reactEmailService = require('./reactEmailService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Initialize the email transporter
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
      console.log('✅ Email service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.transporter = null;
      this.initialized = false;
    }
  }

  // Generate OTP email template using React Email
  async generateOTPEmailTemplate(otp, userEmail) {
    try {
      return await reactEmailService.renderOTPEmail(otp, userEmail);
    } catch (error) {
      console.error('❌ Failed to render OTP email template:', error.message);
      throw new Error('Failed to generate OTP email template using React Email');
    }
  }

  // Send OTP email
  async sendOTP(email, otp, options = {}) {
    // Initialize transporter if not already done
    if (!this.initialized && config.EMAIL.ENABLED) {
      this.initializeTransporter();
    }

    // If email service is disabled or not working, just log the OTP
    if (!this.transporter || !config.EMAIL.ENABLED) {
      console.log(`📧 OTP for ${email}: ${otp} (Email service disabled - using console)`);
      return {
        success: true,
        message: 'OTP logged to console (email service disabled)',
        method: 'console',
        messageId: 'console-' + Date.now()
      };
    }

    try {
      const htmlContent = await this.generateOTPEmailTemplate(otp, email);
      
      const mailOptions = {
        from: {
          name: 'Shaadi Mantrana',
          address: config.EMAIL.SMTP_USER
        },
        to: email,
        subject: 'Verify Your Shaadi Mantrana Account - OTP Code',
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

      console.log(`📧 Attempting to send OTP email to ${email}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);
      
      return {
        success: true,
        message: 'OTP sent successfully via email',
        messageId: info.messageId,
        method: 'email'
      };

    } catch (error) {
      console.error('❌ Failed to send OTP email:', error.message);
      
      // Fallback to console logging
      console.log(`📧 OTP for ${email}: ${otp} (Email failed - using console fallback)`);
      
      return {
        success: true,
        message: 'OTP delivery attempted (check console if email failed)',
        error: error.message,
        method: 'console_fallback'
      };
    }
  }

  // Test email service
  async testService() {
    if (!this.transporter) {
      this.initializeTransporter();
    }

    if (!this.transporter) {
      return {
        success: false,
        message: 'Email service not initialized'
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email service is working correctly'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Email service verification failed',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

// Initialize on startup if email is enabled
if (config.EMAIL.ENABLED) {
  emailService.initializeTransporter();
}

module.exports = emailService;
