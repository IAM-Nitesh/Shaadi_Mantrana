// Test JWT flow
const jwt = require('jsonwebtoken');

// Use environment variable instead of hardcoded secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-2024-shaadi-mantra';

// Test payload
const testPayload = {
  userId: '507f1f77bcf86cd799439011',
  userUuid: 'test-uuid-123',
  email: 'test@example.com',
  role: 'user',
  verified: true,
  sessionId: 'test-session-123'
};

console.log('🔍 Testing JWT flow...');
console.log('🔍 Test payload:', testPayload);

// Generate token
const token = jwt.sign(testPayload, JWT_SECRET, {
  expiresIn: '24h',
  issuer: 'shaadi-mantra-api',
  audience: 'shaadi-mantra-app'
});

console.log('✅ Token generated:', token.substring(0, 50) + '...');

// Verify token
try {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: 'shaadi-mantra-api',
    audience: 'shaadi-mantra-app'
  });
  
  console.log('✅ Token verified successfully');
  console.log('🔍 Decoded payload:', decoded);
  
  // Test with wrong secret
  try {
    jwt.verify(token, 'wrong-secret');
    console.log('❌ Should have failed with wrong secret');
  } catch (error) {
    console.log('✅ Correctly failed with wrong secret:', error.message);
  }
  
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
} 