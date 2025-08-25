# Server-Side Authentication Debugging Guide

## Overview
This guide helps debug issues with the server-side authentication system that uses HTTP-only cookies and JWT tokens.

## Architecture
- **Frontend**: Next.js API routes (`/api/auth/*`) handle cookie management
- **Backend**: Express.js with JWT middleware for token verification
- **Storage**: HTTP-only cookies for security, no localStorage for auth tokens

## Debugging Steps

### 1. Check Backend Health
```bash
curl http://localhost:5500/api/auth/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "auth-service",
  "version": "1.0.0"
}
```

### 2. Check Frontend Health
```bash
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "frontend": {
    "status": "healthy",
    "environment": "development"
  },
  "backend": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "auth-service",
    "version": "1.0.0"
  }
}
```

### 3. Test OTP Flow
1. Send OTP:
```bash
curl -X POST http://localhost:5500/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

2. Verify OTP:
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}' \
  -c cookies.txt
```

### 4. Test Authentication Status
```bash
curl -X GET http://localhost:3000/api/auth/status \
  -b cookies.txt
```

### 5. Check Browser Console
Look for these log patterns:
- `🔍 ServerAuthService: Starting OTP verification`
- `✅ ServerAuthService: OTP verification successful`
- `🔍 useServerAuth: Starting authentication check`
- `✅ useServerAuth: User authenticated`

### 6. Common Issues

#### Issue: "Stuck on checking authentication loader"
**Causes:**
1. Backend not running
2. Network connectivity issues
3. JWT middleware hanging
4. Database connection issues

**Solutions:**
1. Check backend is running: `curl http://localhost:5500/api/auth/health`
2. Check network: `curl http://localhost:3000/api/health`
3. Check browser console for timeout errors
4. Verify MongoDB connection

#### Issue: "Authentication timeout"
**Causes:**
1. Backend taking too long to respond
2. Database queries hanging
3. JWT verification issues

**Solutions:**
1. Check backend logs for slow queries
2. Verify JWT secret is correct
3. Check MongoDB performance
4. Increase timeout values if needed

#### Issue: "Invalid or expired token"
**Causes:**
1. Token expired
2. Wrong JWT secret
3. Session not found

**Solutions:**
1. Check JWT expiration time
2. Verify JWT_SECRET environment variable
3. Check session storage

### 7. Environment Variables
Ensure these are set correctly:

**Backend:**
```bash
JWT_SECRET=your-secret-key
MONGODB_URI=your-mongodb-uri
```

**Frontend:**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5500
```

### 8. Database Checks
```javascript
// Check user document
db.users.findOne({email: "test@example.com"})

// Check for required fields
db.users.findOne({email: "test@example.com"}, {
  isFirstLogin: 1,
  isApprovedByAdmin: 1,
  profileCompleteness: 1,
  hasSeenOnboardingMessage: 1
})
```

### 9. Cookie Debugging
Check if cookies are being set correctly:
```javascript
// In browser console
document.cookie.split(';').forEach(cookie => {
  if (cookie.trim().startsWith('authToken=')) {
    console.log('Auth token found:', cookie.trim());
  }
});
```

### 10. Network Debugging
Use browser DevTools Network tab to:
1. Check if requests are being made
2. Verify response status codes
3. Check request/response headers
4. Look for CORS issues

### 11. Performance Monitoring
Monitor these metrics:
- Authentication check response time
- Backend API response time
- Database query performance
- Memory usage

### 12. Log Analysis
Look for these log patterns:

**Frontend Logs:**
```
🔍 ServerAuthService: Starting OTP verification
✅ ServerAuthService: OTP verification successful
🔍 useServerAuth: Starting authentication check
✅ useServerAuth: User authenticated
```

**Backend Logs:**
```
✅ New user created: test@example.com
✅ User login: test@example.com
❌ Token verification error: Invalid or expired access token
```

### 13. Recovery Procedures

#### If Authentication is Completely Broken:
1. Clear all cookies
2. Restart both frontend and backend
3. Check environment variables
4. Verify database connectivity
5. Test with a fresh user account

#### If Specific User is Stuck:
1. Check user document in database
2. Verify all required fields are present
3. Check if user is approved by admin
4. Verify profile completeness

### 14. Testing Checklist
- [ ] Backend health check passes
- [ ] Frontend health check passes
- [ ] OTP sending works
- [ ] OTP verification works
- [ ] Cookies are set correctly
- [ ] Authentication status check works
- [ ] User redirection works correctly
- [ ] Logout works
- [ ] Session cleanup works

### 15. Emergency Contacts
If all else fails:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Restart all services
4. Check network connectivity
5. Verify MongoDB is accessible 