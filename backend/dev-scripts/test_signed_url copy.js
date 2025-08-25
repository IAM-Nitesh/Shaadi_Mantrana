async function testSignedUrl() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // First, let's try to get a profile to see if we can get a valid token
    const profileResponse = await fetch('http://localhost:5500/api/profiles/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Profile response status:', profileResponse.status);
    const profileData = await profileResponse.text();
    console.log('Profile response:', profileData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSignedUrl(); 