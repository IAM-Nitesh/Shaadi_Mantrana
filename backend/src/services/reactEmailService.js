// Register Babel to handle JSX files
require('@babel/register');

const React = require('react');
const { render } = require('@react-email/render');

// Import the actual React Email components
const WelcomeEmail = require('../emails/WelcomeEmail.jsx').default;
const OTPEmail = require('../emails/OTPEmail.jsx').default;

class ReactEmailService {
  constructor() {
    this.initialized = false;
  }

  // Render Welcome Email to HTML using actual React Email component
  async renderWelcomeEmail(userEmail, inviteLink, userUuid) {
    try {
      const emailComponent = React.createElement(WelcomeEmail, {
        userEmail,
        inviteLink,
        userUuid
      });
      
      const html = await render(emailComponent, {
        pretty: true,
        plainText: false
      });
      
      return html;
    } catch (error) {
      console.error('❌ Failed to render Welcome Email:', error.message);
      throw error;
    }
  }

  // Render OTP Email to HTML using actual React Email component
  async renderOTPEmail(otp, userEmail) {
    try {
      const emailComponent = React.createElement(OTPEmail, {
        otp,
        userEmail
      });
      
      const html = await render(emailComponent, {
        pretty: true,
        plainText: false
      });
      
      return html;
    } catch (error) {
      console.error('❌ Failed to render OTP Email:', error.message);
      throw error;
    }
  }

  // Test the service
  async testService() {
    try {
      // Test OTP email rendering
      const otpHtml = await this.renderOTPEmail('123456', 'test@example.com');
      console.log('✅ OTP Email rendering test passed');
      
      // Test Welcome email rendering
      const welcomeHtml = await this.renderWelcomeEmail('test@example.com', 'http://localhost:3000?invite=test', 'test-uuid');
      console.log('✅ Welcome Email rendering test passed');
      
      return {
        success: true,
        message: 'React Email service is working correctly'
      };
    } catch (error) {
      return {
        success: false,
        message: 'React Email service test failed',
        error: error.message
      };
    }
  }
}

module.exports = new ReactEmailService(); 