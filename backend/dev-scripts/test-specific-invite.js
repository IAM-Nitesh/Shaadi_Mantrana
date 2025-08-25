const InviteEmailService = require('../src/services/inviteEmailService');

async function testSpecificInvite() {
  try {
    console.log('🧪 Testing Invite Email Service for niteshkumar9591@gmail.com...');
    
    // Test email configuration
    console.log('📧 Verifying email connection...');
    const isConnected = await InviteEmailService.verifyConnection();
    
    if (!isConnected) {
      console.log('❌ Email service connection failed. Please check your Gmail app password configuration.');
      return;
    }
    
    console.log('✅ Email service connection verified!');
    
    // Test sending an invitation email to the specific email
    const testEmail = 'niteshkumar9591@gmail.com';
    const testUuid = 'test-uuid-nitesh-' + Date.now();
    
    console.log(`📧 Sending invitation email to ${testEmail}...`);
    console.log(`🔗 UUID: ${testUuid}`);
    
    const result = await InviteEmailService.sendInviteEmail(testEmail, testUuid);
    
    if (result.success) {
      console.log('✅ Invitation email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`🔗 Invitation Link: ${result.inviteLink}`);
      
      if (result.emailError) {
        console.log(`⚠️  Email service warning: ${result.emailError}`);
      }
      
      console.log('\n📬 Please check the email inbox for niteshkumar9591@gmail.com');
      console.log('📧 Look for email with subject: "🎉 Welcome to Shaadi Mantrana - Your Exclusive Invitation"');
      
    } else {
      console.log('❌ Failed to send invitation email');
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
testSpecificInvite(); 