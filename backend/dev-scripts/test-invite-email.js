const InviteEmailService = require('../src/services/inviteEmailService');

async function testInviteEmail() {
  try {
    console.log('\ud83e\uddea Testing Invite Email Service...');
    
    // Test email configuration
    console.log('\ud83d\udce7 Verifying email connection...');
    const isConnected = await InviteEmailService.verifyConnection();
    
    if (!isConnected) {
      console.log('\u274c Email service connection failed. Please check your Gmail app password configuration.');
      console.log('\ud83d\udca1 Make sure you have set the GMAIL_APP_PASSWORD environment variable.');
      return;
    }
    
    console.log('\u2705 Email service connection verified!');
    
    // Test sending an invitation email
    const testEmail = 'test@example.com';
    const testUuid = 'test-uuid-123';
    
    console.log(`\ud83d\udce7 Sending test invitation email to ${testEmail}...`);
    
    const result = await InviteEmailService.sendInviteEmail(testEmail, testUuid);
    
    if (result.success) {
      console.log('\u2705 Test invitation email sent successfully!');
      console.log(`\ud83d\udce7 Message ID: ${result.messageId}`);
      console.log(`\ud83d\udd17 Invitation Link: ${result.inviteLink}`);
      
      if (result.emailError) {
        console.log(`\u26a0\ufe0f  Email service warning: ${result.emailError}`);
      }
    } else {
      console.log('\u274c Failed to send test invitation email');
    }
    
  } catch (error) {
    console.error('\u274c Test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n\ud83d\udca1 Gmail Authentication Error:');
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
