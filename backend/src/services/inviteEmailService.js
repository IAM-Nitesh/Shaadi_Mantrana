const nodemailer = require('nodemailer');
const config = require('../config');

class InviteEmailService {
  constructor() {
    this.fromEmail = config.EMAIL.FROM_EMAIL || 'shaadimantra.help@gmail.com';
    this.fromName = config.EMAIL.FROM_NAME || 'Shaadi Mantra';
    this.transporter = null;
    
    // Only initialize transporter if email is enabled
    if (config.EMAIL.ENABLED) {
      this.initializeTransporter();
    }
  }

  initializeTransporter() {
    // Create transporter for Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL.SMTP_USER || this.fromEmail,
        pass: config.EMAIL.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

    // Generate beautiful HTML email template
  generateInviteEmailHTML(userEmail, inviteLink, userUuid) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Shaadi Mantra - Your Journey Begins Here</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #fdf2f8 0%, #fef3f2 100%);
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(236, 72, 153, 0.15);
        }
        
        .header {
            background: linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #fb7185 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="hearts" patternUnits="userSpaceOnUse" width="20" height="20"><path d="M10 15.5c-2.5-2.5-5-5-7.5-7.5C1.5 6.5 0 4.5 0 2.5 0 1 1 0 2.5 0c1.5 0 3 1 4.5 2.5C8.5 1 10 0 11.5 0 13 0 14 1 14 2.5c0 2-1.5 4-2.5 5.5-2.5 2.5-5 5-7.5 7.5z" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23hearts)"/></svg>');
            opacity: 0.3;
        }
        
        .brand-title {
            color: white;
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
            letter-spacing: -0.5px;
        }
        
        .brand-subtitle {
            color: rgba(255, 255, 255, 0.95);
            font-size: 16px;
            position: relative;
            z-index: 1;
            font-weight: 500;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .welcome-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
            background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .welcome-message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            text-align: center;
            line-height: 1.6;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .feature {
            text-align: center;
            padding: 20px 15px;
            background: linear-gradient(135deg, #fef3f2 0%, #fdf2f8 100%);
            border-radius: 12px;
            border: 1px solid #fce7f3;
            transition: all 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(236, 72, 153, 0.1);
        }
        
        .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
            display: block;
        }
        
        .feature h3 {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .feature p {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .cta-section {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(236, 72, 153, 0.4);
        }
        
        .info-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
        }
        
        .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .info-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .info-item h4 {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .info-item p {
            font-size: 11px;
            color: #6b7280;
        }
        
        .invitation-details {
            background: linear-gradient(135deg, #fef3f2 0%, #fdf2f8 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #ec4899;
            margin-bottom: 25px;
        }
        
        .invitation-details h4 {
            color: #1f2937;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .invitation-details p {
            color: #6b7280;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .footer {
            background: #1f2937;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .footer-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 6px;
            background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .footer-subtitle {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 20px;
            font-size: 11px;
            opacity: 0.8;
        }
        
        .footer-bottom a {
            color: #ec4899;
            text-decoration: none;
            font-weight: 500;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 16px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .brand-title {
                font-size: 28px;
            }
            
            .welcome-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1 class="brand-title">Shaadi Mantra</h1>
            <p class="brand-subtitle">Your journey to forever starts here</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <h2 class="welcome-title">Welcome to Shaadi Mantra! 🎉</h2>
            <p class="welcome-message">
                You've been invited to join our exclusive community. Find your perfect match through our intelligent matching system.
            </p>
            
            <!-- Features Grid -->
            <div class="features-grid">
                <div class="feature">
                    <span class="feature-icon">👤</span>
                    <h3>Complete Profile</h3>
                    <p>Share your story and preferences to help us find your perfect match.</p>
                </div>
                
                <div class="feature">
                    <span class="feature-icon">💝</span>
                    <h3>Smart Matching</h3>
                    <p>Our advanced algorithm considers compatibility and values.</p>
                </div>
                
                <div class="feature">
                    <span class="feature-icon">💬</span>
                    <h3>Start Chatting</h3>
                    <p>Connect with your matches through our secure messaging system.</p>
                </div>
            </div>
            
            <!-- Call to Action -->
            <div class="cta-section">
                <a href="https://play.google.com/store/apps/details?id=com.shaadimantra.app" class="cta-button">
                    Download Mobile App →
                </a>
                <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
                    Or <a href="${inviteLink}" style="color: #ec4899; text-decoration: none; font-weight: 500;">access via web browser</a>
                </p>
            </div>
            
            <!-- Information Section -->
            <div class="info-section">
                <h3 class="info-title">What You'll Get</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <h4>🔒 Secure Platform</h4>
                        <p>Your privacy is our priority</p>
                    </div>
                    <div class="info-item">
                        <h4>🎯 Quality Matches</h4>
                        <p>Curated profiles based on compatibility</p>
                    </div>
                    <div class="info-item">
                        <h4>📱 Mobile Friendly</h4>
                        <p>Access from anywhere, anytime</p>
                    </div>
                    <div class="info-item">
                        <h4>💎 Premium Experience</h4>
                        <p>Exclusive features for serious relationships</p>
                    </div>
                </div>
            </div>
            
            <!-- Invitation Details -->
            <div class="invitation-details">
                <h4>📧 Your Invitation Details</h4>
                <p>
                    <strong>Email:</strong> ${userEmail}<br>
                    <strong>Invitation ID:</strong> ${userUuid}<br>
                    <strong>Valid Until:</strong> No expiration (permanent invitation)
                </p>
                <p style="margin-top: 8px;">
                    This invitation is exclusive and has been approved by our admin team.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <h3 class="footer-title">Shaadi Mantra</h3>
            <p class="footer-subtitle">Connecting hearts, building futures</p>
            
            <div class="footer-bottom">
                <p>
                    This email was sent to ${userEmail} because you were invited to join Shaadi Mantra.<br>
                    If you have any questions, please contact us at 
                    <a href="mailto:shaadimantra.help@gmail.com">shaadimantra.help@gmail.com</a>
                </p>
                <p style="margin-top: 12px;">
                    © 2024 Shaadi Mantra. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

      // Generate plain text version for email clients that don't support HTML
  generateInviteEmailText(userEmail, inviteLink, userUuid) {
    return `
Welcome to Shaadi Mantra! 🎉
       
You've been invited to join our exclusive community. Find your perfect match through our intelligent matching system.
       
WHAT YOU'LL GET:
• Complete Profile - Share your story and preferences to help us find your perfect match
• Smart Matching - Our advanced algorithm considers compatibility and values
• Start Chatting - Connect with your matches through our secure messaging system
• Secure Platform - Your privacy is our priority
• Quality Matches - Curated profiles based on compatibility
• Mobile Friendly - Access from anywhere, anytime
• Premium Experience - Exclusive features for serious relationships
       
DOWNLOAD MOBILE APP:
https://play.google.com/store/apps/details?id=com.shaadimantra.app

OR ACCESS VIA WEB:
${inviteLink}
             
YOUR INVITATION DETAILS:
Email: ${userEmail}
Invitation ID: ${userUuid}
Valid Until: No expiration (permanent invitation)
       
This invitation is exclusive and has been approved by our admin team.
       
Need help? Contact us at shaadimantra.help@gmail.com
       
Shaadi Mantra - Your journey to forever starts here
© 2024 Shaadi Mantra. All rights reserved.
    `;
  }

  // Send invitation email
  async sendInviteEmail(userEmail, userUuid) {
    try {
      // Generate invite link
      const baseUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}?invite=${userUuid}&email=${encodeURIComponent(userEmail)}`;

      // If email is disabled, return development fallback
      if (!config.EMAIL.ENABLED || !this.transporter) {
        console.log(`📧 Email service disabled - Invitation link for ${userEmail}: ${inviteLink}`);
        
        return {
          success: true,
          messageId: 'email-disabled',
          inviteLink: inviteLink,
          method: 'console'
        };
      }

      // Email content
      const subject = '🎉 Welcome to Shaadi Mantra - Your Exclusive Invitation';
      const htmlContent = this.generateInviteEmailHTML(userEmail, inviteLink, userUuid);
      const textContent = this.generateInviteEmailText(userEmail, inviteLink, userUuid);

      // Email options
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

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
      console.error(`❌ Failed to send invitation email to ${userEmail}:`, error);
      
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