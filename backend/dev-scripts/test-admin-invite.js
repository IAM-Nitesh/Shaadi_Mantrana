async function testAdminInvite() {
  const fetch = (await import('node-fetch')).default;
  try {
    console.log('🧪 Testing Admin User Addition with Invitation Email...');
    
    const apiBaseUrl = 'http://localhost:5500';
    const adminEmail = 'codebynitesh@gmail.com';
    const testEmail = 'niteshkumar9591@gmail.com';
    
    // Step 1: Send OTP to admin
    console.log('📧 Step 1: Sending OTP to admin...');
    const otpResponse = await fetch(`${apiBaseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: adminEmail }),
    });
    
    if (!otpResponse.ok) {
      throw new Error(`Failed to send OTP: ${otpResponse.statusText}`);
    }
    
    console.log('✅ OTP sent to admin');
    
    // Step 2: Verify OTP to get admin token
    console.log('🔐 Step 2: Verifying OTP...');
    const verifyResponse = await fetch(`${apiBaseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: adminEmail, otp: '123456' }),
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify OTP: ${verifyResponse.statusText}`);
    }
    
    const verifyData = await verifyResponse.json();
    const authToken = verifyData.session?.accessToken || verifyData.token;
    
    if (!authToken) {
      throw new Error('No auth token received');
    }
    
    console.log('✅ Admin authenticated successfully');
    
    // Step 3: Add new user (should trigger invitation email)
    console.log('👤 Step 3: Adding new user...');
    const addUserResponse = await fetch(`${apiBaseUrl}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    if (!addUserResponse.ok) {
      const errorData = await addUserResponse.json();
      throw new Error(`Failed to add user: ${errorData.error || addUserResponse.statusText}`);
    }
    
    const addUserData = await addUserResponse.json();
    console.log('✅ User added successfully');
    console.log('📧 Email sent:', addUserData.emailSent);
    console.log('🔗 Invitation link:', addUserData.inviteLink);
    
    // Step 4: Get all users to verify
    console.log('📋 Step 4: Verifying user list...');
    const usersResponse = await fetch(`${apiBaseUrl}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!usersResponse.ok) {
      throw new Error(`Failed to get users: ${usersResponse.statusText}`);
    }
    
    const usersData = await usersResponse.json();
    const newUser = usersData.users.find(user => user.email === testEmail);
    
    if (newUser) {
      console.log('✅ New user found in database');
      console.log('👤 User details:', {
        email: newUser.email,
        role: newUser.role,
        isFirstLogin: newUser.isFirstLogin,
        status: newUser.status
      });
    } else {
      console.log('❌ New user not found in database');
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('📧 Check the email inbox for the invitation email');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Failed to send OTP')) {
      console.log('\n💡 Make sure the backend server is running on port 5500');
    }
    
    if (error.message.includes('Failed to verify OTP')) {
      console.log('\n💡 Make sure the admin email is approved and OTP is correct');
    }
  }
}

// Run the test
testAdminInvite(); 