// Test admin login and get token
const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    // Step 1: Send OTP
    const sendOtpResponse = await axios.post('http://localhost:5500/api/auth/send-otp', {
      email: 'codebynitesh@gmail.com'
    });
    
    console.log('✅ OTP sent successfully');
    console.log('OTP Response:', sendOtpResponse.data);
    
    // Step 2: Verify OTP (you'll need to get the actual OTP from email or console)
    const verifyOtpResponse = await axios.post('http://localhost:5500/api/auth/verify-otp', {
      email: 'codebynitesh@gmail.com',
      otp: '123456' // This should be the actual OTP
    });
    
    console.log('✅ OTP verified successfully');
    console.log('Token:', verifyOtpResponse.data.token);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAdminLogin(); 