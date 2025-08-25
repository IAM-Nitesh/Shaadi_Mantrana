// Test authentication flow
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5500';

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow...');
  
  try {
    // Step 1: Send OTP
    console.log('\n1️⃣ Sending OTP...');
    const otpResponse = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'niteshkumar9591@gmail.com' })
    });
    
    if (!otpResponse.ok) {
      const error = await otpResponse.json();
      console.log('❌ OTP send failed:', error);
      return;
    }
    
    console.log('✅ OTP sent successfully');
    
    // Step 2: Verify OTP (this would normally be done by user)
    console.log('\n2️⃣ Verifying OTP...');
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'niteshkumar9591@gmail.com', 
        otp: '123456' // This would be the actual OTP
      })
    });
    
    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      console.log('❌ OTP verification failed:', error);
      return;
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ OTP verification successful');
    console.log('🔍 Verify result:', verifyResult);
    
    // Step 3: Check authentication status
    console.log('\n3️⃣ Checking authentication status...');
    const statusResponse = await fetch(`${BASE_URL}/api/auth/status`, {
      method: 'GET',
      headers: {
        'Cookie': `authToken=${verifyResult.session.accessToken}`
      }
    });
    
    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      console.log('❌ Auth status check failed:', error);
      return;
    }
    
    const statusResult = await statusResponse.json();
    console.log('✅ Auth status check successful');
    console.log('🔍 Status result:', statusResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthFlow(); 