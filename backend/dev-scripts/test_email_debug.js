// Email Debug Test Script
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env.development') });

// Test email configuration
const testEmailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'shaadimantrana.help@gmail.com',
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Test the email service
async function testEmailService() {
  console.log('🔍 Testing Email Service Configuration...');
  
  // Check environment variables
  console.log('\n📧 Email Configuration:');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'SET' : 'NOT SET');
  console.log('ENABLE_EMAIL:', process.env.ENABLE_EMAIL || 'NOT SET');
  
  // Create transporter
  const transporter = nodemailer.createTransport(testEmailConfig);
  
  try {
    console.log('\n🔐 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email service connection verified successfully');
    
    // Test sending a simple email
    console.log('\n📤 Testing email sending...');
    const testMailOptions = {
      from: {
        name: 'Shaadi Mantrana Test',
        address: testEmailConfig.auth.user
      },
      to: 'test@example.com', // Replace with actual test email
      subject: 'Test Email from Shaadi Mantrana',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the email service is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: 'This is a test email to verify the email service is working.'
    };
    
    const result = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.error('Full error:', error);
    
    // Provide troubleshooting tips
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check if SMTP_USER and SMTP_PASS are set in environment variables');
    console.log('2. For Gmail, use App Password instead of regular password');
    console.log('3. Enable "Less secure app access" or use OAuth2');
    console.log('4. Check if the email service is enabled in config');
  }
}

// Test the invite email service
async function testInviteEmailService() {
  console.log('\n🎯 Testing Invite Email Service...');
  
  try {
    const inviteEmailService = require('./backend/src/services/inviteEmailService');
    
    // Test onboarding email
    console.log('\n📧 Testing onboarding email...');
    const result = await inviteEmailService.sendOnboardingEmail('test@example.com', 'test-uuid-123');
    
    console.log('Onboarding email result:', result);
    
  } catch (error) {
    console.error('❌ Invite email service test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Email Debug Tests...\n');
  
  await testEmailService();
  await testInviteEmailService();
  
  console.log('\n🏁 Email debug tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testEmailService,
  testInviteEmailService
}; 
