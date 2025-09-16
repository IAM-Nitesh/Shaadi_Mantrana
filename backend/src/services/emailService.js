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

    // Build ordered provider list without duplicates
    const preferred = (config.EMAIL.PROVIDER || 'smtp').toLowerCase();
    const available = new Set();
    const order = [];

    const canResend = !!config.EMAIL.RESEND_API_KEY;
    const canSendGrid = !!config.EMAIL.SENDGRID_API_KEY;

    const pushIfAvailable = (p) => {
      if (p === 'resend' && canResend && !available.has('resend')) { order.push('resend'); available.add('resend'); }
      if (p === 'sendgrid' && canSendGrid && !available.has('sendgrid')) { order.push('sendgrid'); available.add('sendgrid'); }
      if (p === 'smtp' && !available.has('smtp')) { order.push('smtp'); available.add('smtp'); }
    };

    // Preferred first
    pushIfAvailable(preferred);
    // Then fallback priority
    pushIfAvailable('resend');
    pushIfAvailable('sendgrid');
    pushIfAvailable('smtp');

    // Respect max attempts and master timeout
    const maxAttempts = config.EMAIL.MAX_ATTEMPTS || 2;
    const masterTimeoutMs = config.EMAIL.MASTER_TIMEOUT_MS || 8000;

    const attemptProviders = async () => {
      let attempts = 0;
      let lastError;
      for (const provider of order) {
        if (attempts >= maxAttempts) break;
        attempts++;
        try {
          if (provider === 'resend') {
            return await this.sendViaResend(email, subject, htmlContent);
          } else if (provider === 'sendgrid') {
            return await this.sendViaSendGrid(email, subject, htmlContent);
          } else if (provider === 'smtp') {
            return await trySmtp();
          }
        } catch (e) {
          lastError = e;
          console.error(`❌ Email provider attempt failed (${provider}):`, e.message);
        }
      }
      // If all attempts failed, return console fallback but include last error
      console.log(`📧 OTP for ${email}: ${otp} (All providers failed after ${attempts} attempts - using console fallback)`);
      return {
        success: true,
        message: 'OTP delivery attempted (providers failed, console fallback)',
        error: lastError?.message || 'All email providers failed',
        method: 'console_fallback'
      };
    };

    // Master timeout wrapper ensures we never exceed client timeouts
    return await Promise.race([
      attemptProviders(),
      new Promise((resolve) => setTimeout(() => {
        console.warn(`⏰ Email send master timeout reached (${masterTimeoutMs}ms). Falling back to console.`);
        resolve({
          success: true,
          message: 'OTP delivery timed out (console fallback)',
          method: 'console_fallback'
        });
      }, masterTimeoutMs))
    ]);
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
