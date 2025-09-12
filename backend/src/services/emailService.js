const nodemailer = require('nodemailer');
const config = require('../config');
const reactEmailService = require('./reactEmailService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Internal: send via Resend HTTP API
  async sendViaResend(email, subject, html) {
    const apiKey = config.EMAIL.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.EMAIL.SEND_TIMEOUT_MS || 5000);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: config.EMAIL.FROM_EMAIL || config.EMAIL.SMTP_USER,
          to: email,
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
      console.log(`✅ OTP email sent via Resend to ${email}: ${messageId}`);
      return { success: true, method: 'resend', messageId };
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  // Internal: send via SendGrid HTTP API
  async sendViaSendGrid(email, subject, html) {
    const apiKey = config.EMAIL.SENDGRID_API_KEY;
    if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.EMAIL.SEND_TIMEOUT_MS || 5000);
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: config.EMAIL.FROM_EMAIL || config.EMAIL.SMTP_USER, name: 'Shaadi Mantrana' },
          subject,
          content: [{ type: 'text/html', value: html }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!(res.status === 202 || res.ok)) {
        const errText = await res.text().catch(() => '');
        throw new Error(`SendGrid API error: HTTP ${res.status} ${res.statusText} ${errText}`);
      }
      const messageId = res.headers.get('x-message-id') || `sendgrid-${Date.now()}`;
      console.log(`✅ OTP email sent via SendGrid to ${email}: ${messageId}`);
      return { success: true, method: 'sendgrid', messageId };
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
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

      // Create transporter with explicit SMTP configuration and safe timeouts
      const port = Number(config.EMAIL.SMTP_PORT) || 587;
      const secure = port === 465; // true for 465, false for other ports
      this.transporter = nodemailer.createTransport({
        host: config.EMAIL.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure,
        auth: {
          user: config.EMAIL.SMTP_USER,
          pass: config.EMAIL.SMTP_PASS
        },
        // Important: set timeouts so sendMail doesn't hang for minutes
        connectionTimeout: config.EMAIL.CONNECT_TIMEOUT_MS || 4000,
        greetingTimeout: config.EMAIL.GREETING_TIMEOUT_MS || 5000,
        socketTimeout: config.EMAIL.SOCKET_TIMEOUT_MS || 5000,
        // TLS options
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
    // If email service is disabled entirely, log to console
    if (!config.EMAIL.ENABLED) {
      console.log(`📧 OTP for ${email}: ${otp} (Email service disabled - using console)`);
      return {
        success: true,
        message: 'OTP logged to console (email service disabled)',
        method: 'console',
        messageId: 'console-' + Date.now()
      };
    }

    const subject = 'Verify Your Shaadi Mantrana Account - OTP Code';
    const htmlContent = await this.generateOTPEmailTemplate(otp, email);

    // Helper to attempt SMTP
    const trySmtp = async () => {
      // Initialize transporter if not already done
      if (!this.initialized) {
        this.initializeTransporter();
      }
      if (!this.transporter) throw new Error('SMTP transporter not initialized');

      const mailOptions = {
        from: {
          name: 'Shaadi Mantrana',
          address: config.EMAIL.FROM_EMAIL || config.EMAIL.SMTP_USER
        },
        to: email,
        subject,
        html: htmlContent,
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

      console.log(`📧 Attempting SMTP send to ${email}...`);
      const timeoutMs = config.EMAIL.SEND_TIMEOUT_MS || 5000;
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), timeoutMs));
      const info = await Promise.race([sendPromise, timeoutPromise]);
      return { success: true, method: 'email', messageId: info.messageId };
    };

    // Provider preference
    const preferred = (config.EMAIL.PROVIDER || 'smtp').toLowerCase();

    // Try preferred provider first
    try {
      if (preferred === 'resend' && config.EMAIL.RESEND_API_KEY) {
        return await this.sendViaResend(email, subject, htmlContent);
      }
      if (preferred === 'sendgrid' && config.EMAIL.SENDGRID_API_KEY) {
        return await this.sendViaSendGrid(email, subject, htmlContent);
      }
      if (preferred === 'smtp') {
        return await trySmtp();
      }
    } catch (e) {
      console.error(`❌ Preferred provider (${preferred}) failed:`, e.message);
    }

    // Fallback order: Resend -> SendGrid -> SMTP
    try {
      if (config.EMAIL.RESEND_API_KEY) {
        return await this.sendViaResend(email, subject, htmlContent);
      }
    } catch (e) {
      console.error('❌ Resend fallback failed:', e.message);
    }

    try {
      if (config.EMAIL.SENDGRID_API_KEY) {
        return await this.sendViaSendGrid(email, subject, htmlContent);
      }
    } catch (e) {
      console.error('❌ SendGrid fallback failed:', e.message);
    }

    try {
      return await trySmtp();
    } catch (e) {
      console.error('❌ SMTP fallback failed:', e.message);
    }

    // Last resort: console fallback
    console.log(`📧 OTP for ${email}: ${otp} (Email failed - using console fallback)`);
    return {
      success: true,
      message: 'OTP delivery attempted (email providers failed, using console fallback)',
      error: 'All email providers failed',
      method: 'console_fallback'
    };
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
