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

  // Send OTP email with enhanced branding
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
          name: config.EMAIL.EMAIL_FROM_NAME || 'Shaadi Mantra',
          address: config.EMAIL.SMTP_USER
        },
        to: email,
        subject: '🔐 Your Shaadi Mantra Login Code',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Shaadi Mantra OTP</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
              
              <!-- Header with Brand Colors -->
              <div style="background: linear-gradient(135deg, #d63384 0%, #dc3545 25%, #fd7e14 50%, #ffc107 75%, #198754 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    💝 Shaadi Mantra
                  </h1>
                  <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                    Where Hearts Meet & Love Blooms
                  </p>
                </div>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 50px 40px;">
                <div style="text-align: center; margin-bottom: 40px;">
                  <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 28px; font-weight: 600;">
                    Your Login Code 🔐
                  </h2>
                  <p style="color: #718096; font-size: 16px; margin: 0; line-height: 1.5;">
                    Use this secure code to access your Shaadi Mantra account
                  </p>
                </div>
                
                <!-- OTP Box with Enhanced Styling -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 16px; margin: 40px 0;">
                  <div style="background: #ffffff; padding: 40px; border-radius: 13px; text-align: center;">
                    <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">
                      Your One-Time Password
                    </p>
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 25px; border-radius: 12px; border: 2px dashed #e2e8f0; margin: 20px 0;">
                      <div style="font-size: 42px; font-weight: 800; color: #667eea; letter-spacing: 12px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;">
                        ${otp}
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; margin-top: 20px;">
                      <div style="height: 1px; background: #e2e8f0; flex: 1;"></div>
                      <span style="padding: 0 20px; color: #a0aec0; font-size: 14px;">Valid for 10 minutes</span>
                      <div style="height: 1px; background: #e2e8f0; flex: 1;"></div>
                    </div>
                  </div>
                </div>
                
                <!-- Security Notice -->
                <div style="background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #f59e0b; margin: 30px 0;">
                  <div style="display: flex; align-items: flex-start;">
                    <div style="font-size: 24px; margin-right: 15px;">🛡️</div>
                    <div>
                      <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                        Security Notice
                      </h4>
                      <p style="color: #b45309; margin: 0; font-size: 14px; line-height: 1.5;">
                        Never share this OTP with anyone. Shaadi Mantra will never ask for your OTP via phone or email.
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- Instructions -->
                <div style="margin: 30px 0;">
                  <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                    What's Next? 👆
                  </h3>
                  <div style="background: #f7fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #3182ce;">
                    <ol style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li style="margin-bottom: 8px;">Open the Shaadi Mantra app or website</li>
                      <li style="margin-bottom: 8px;">Enter the 6-digit OTP code above</li>
                      <li>Start exploring potential matches! 💕</li>
                    </ol>
                  </div>
                </div>
                
                <!-- App Download Links -->
                <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px;">
                  <h4 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                    📱 Get Our Mobile App
                  </h4>
                  <p style="color: #6c757d; margin: 0 0 20px 0; font-size: 14px;">
                    Download the Shaadi Mantra app for the best experience
                  </p>
                  <div style="display: inline-flex; gap: 15px;">
                    <a href="#" style="display: inline-block; background: #000; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                      📱 App Store
                    </a>
                    <a href="#" style="display: inline-block; background: #01875f; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                      🤖 Google Play
                    </a>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <div style="margin-bottom: 20px;">
                  <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                    💝 Shaadi Mantra Team
                  </h4>
                  <p style="color: #6c757d; margin: 0; font-size: 14px; line-height: 1.6;">
                    Connecting hearts, creating beautiful marriages<br>
                    <em>"Your perfect match is just a click away"</em>
                  </p>
                </div>
                
                <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #adb5bd; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} Shaadi Mantra. All rights reserved.<br>
                    This is an automated message. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
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
