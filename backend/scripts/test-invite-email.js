const InviteEmailService = require('../src/services/inviteEmailService');

async function testInviteEmail() {
  try {
    console.log('🧪 Testing Invite Email Service...');
    
    // Test email configuration
    console.log('📧 Verifying email connection...');
    const isConnected = await InviteEmailService.verifyConnection();
    
    if (!isConnected) {
      console.log('❌ Email service connection failed. Please check your Gmail app password configuration.');
      console.log('💡 Make sure you have set the GMAIL_APP_PASSWORD environment variable.');
      return;
    }
    
    console.log('✅ Email service connection verified!');
    
    // Test sending an invitation email
    const testEmail = 'test@example.com';
    const testUuid = 'test-uuid-123';
    
    console.log(`📧 Sending test invitation email to ${testEmail}...`);
    
    const result = await InviteEmailService.sendInviteEmail(testEmail, testUuid);
    
    if (result.success) {
      console.log('✅ Test invitation email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`🔗 Invitation Link: ${result.inviteLink}`);
      
      if (result.emailError) {
        console.log(`⚠️  Email service warning: ${result.emailError}`);
      }
    } else {
      console.log('❌ Failed to send test invitation email');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Gmail Authentication Error:');
      console.log('1. Make sure you have 2-factor authentication enabled on your Gmail account');
      console.log('2. Generate an App Password:');
      console.log('   - Go to Google Account settings');
      console.log('   - Security > 2-Step Verification > App passwords');
      console.log('   - Generate a new app password for "Mail"');
      console.log('3. Set the environment variable:');
      console.log('   export GMAIL_APP_PASSWORD="your-app-password"');
    }
  }
}

// Run the test
testInviteEmail(); 