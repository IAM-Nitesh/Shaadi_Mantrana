const nodemailer = require('nodemailer');
const config = require('../config');

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

      // Verify the connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service verification failed:', error.message);
          this.transporter = null;
        } else {
          console.log('✅ Email service is ready and verified');
          this.initialized = true;
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.transporter = null;
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
      const mailOptions = {
        from: {
          name: 'Shaadi Mantra',
          address: config.EMAIL.SMTP_USER
        },
        to: email,
        subject: 'Your OTP for Shaadi Mantra Login',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Shaadi Mantra</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your Journey to Love Begins Here</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Your Login OTP</h2>
              
              <div style="background: #f8f9ff; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <p style="color: #666; margin-bottom: 15px; font-size: 16px;">Your One-Time Password is:</p>
                <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
              </div>
              
              <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Security Notice:</strong> This OTP is valid for 10 minutes only. Never share it with anyone.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Enter this OTP in the Shaadi Mantra app to complete your login. If you didn't request this OTP, please ignore this email.
              </p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 14px;">
                  Best wishes,<br>
                  <strong>Team Shaadi Mantra</strong>
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
Hello,

Your OTP for Shaadi Mantra login is: ${otp}

This OTP is valid for 10 minutes only. Please enter it in the app to complete your login.

If you didn't request this OTP, please ignore this email.

Best wishes,
Team Shaadi Mantra
        `
      };

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
