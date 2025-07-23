# Shaadi Mantra API Testing Guide

## Overview
This guide provides comprehensive instructions for testing all Shaadi Mantra API endpoints in both Static (Demo) and MongoDB modes.

## Quick Start

### Prerequisites
- Postman installed
- Backend server running
- Frontend server running (optional, for full-stack testing)

### Server Configurations

#### Static Mode (Port 4500)
```bash
cd backend
NODE_ENV=development DATA_SOURCE=static node start.js
```

#### MongoDB Mode (Port 5500)
```bash
cd backend  
NODE_ENV=development DATA_SOURCE=mongodb node start.js
```

## Postman Collection Setup

### 1. Import Collection
- Open Postman
- Click "Import" → "File"
- Select `postman/Shaadi_Mantra_API_Collection_v2.json`
- Collection will be imported with pre-configured variables

### 2. Environment Variables
The collection includes these variables:
- `base_url_static`: http://localhost:4500
- `base_url_mongodb`: http://localhost:5500  
- `test_email`: niteshkumar9591@gmail.com
- `demo_otp`: 123456
- `auth_token`: (auto-populated after authentication)

### 3. Test Sequence
**Always follow this order for authenticated endpoints:**

1. **Health Check** → 2. **Send OTP** → 3. **Verify OTP** → 4. **Authenticated Endpoints**

## API Endpoints Reference

### 1. Health & Status Endpoints

#### Health Check
- **Static Mode**: `GET {{base_url_static}}/health`
- **MongoDB Mode**: `GET {{base_url_mongodb}}/health`
- **Purpose**: Verify server is running
- **Expected Response**: 
```json
{
  "status": "OK",
  "message": "Shaadi Mantra Backend API is running",
  "timestamp": "2025-07-22T14:30:00.000Z",
  "environment": "development"
}
```

#### Database Status
- **Static Mode**: `GET {{base_url_static}}/health/database`
- **MongoDB Mode**: `GET {{base_url_mongodb}}/health/database`
- **Purpose**: Check database connection status

### 2. Authentication Endpoints

#### Send OTP
- **Endpoint**: `POST /api/auth/send-otp`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "niteshkumar9591@gmail.com"
}
```
- **Static Mode Response**:
```json
{
  "success": true,
  "message": "Demo OTP sent! Use: 123456",
  "demo": true,
  "email": "nit***@gmail.com"
}
```

#### Verify OTP
- **Endpoint**: `POST /api/auth/verify-otp`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "niteshkumar9591@gmail.com",
  "otp": "123456"
}
```
- **Success Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "email": "niteshkumar9591@gmail.com",
    "verified": true
  },
  "session": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

⚠️ **Important**: The `accessToken` from the response is automatically stored in the `auth_token` variable for subsequent authenticated requests.

### 3. Profile Endpoints (Authentication Required)

#### Get All Profiles
- **Endpoint**: `GET /api/profiles`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 10)
  - `ageMin`, `ageMax`: Age range filter
  - `professions`: Comma-separated professions
  - `locations`: Comma-separated locations

#### Get My Profile
- **Endpoint**: `GET /api/profiles/me`
- **Headers**: `Authorization: Bearer {{auth_token}}`

#### Update My Profile
- **Endpoint**: `PUT /api/profiles/me`
- **Headers**: 
  - `Authorization: Bearer {{auth_token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "name": "Test User",
  "age": 28,
  "profession": "Software Engineer",
  "location": "Mumbai, Maharashtra",
  "education": "B.Tech Computer Science",
  "interests": ["Technology", "Travel", "Movies"],
  "about": "Looking for a life partner who shares similar values."
}
```

### 4. File Upload Endpoints (Authentication Required)

#### Upload Single File
- **Endpoint**: `POST /api/upload/single`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Body**: Form-data with `image` field (file)

#### Upload Multiple Files
- **Endpoint**: `POST /api/upload/multiple`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Body**: Form-data with `images` field (multiple files)

### 5. Admin Endpoints

#### Check Email Approval
- **Endpoint**: `POST /api/admin/check-email`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "niteshkumar9591@gmail.com"
}
```
- **Response**:
```json
{
  "approved": true,
  "email": "nit***@gmail.com",
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## Testing Scenarios

### Scenario 1: Basic Authentication Flow (Static Mode)

1. **Send OTP**:
   ```
   POST http://localhost:4500/api/auth/send-otp
   Body: {"email": "niteshkumar9591@gmail.com"}
   ```
   Expected: Success with demo OTP message

2. **Verify OTP**:
   ```
   POST http://localhost:4500/api/auth/verify-otp
   Body: {"email": "niteshkumar9591@gmail.com", "otp": "123456"}
   ```
   Expected: Success with access token

3. **Get Profiles**:
   ```
   GET http://localhost:4500/api/profiles
   Headers: Authorization: Bearer [token from step 2]
   ```
   Expected: Array of demo profiles

### Scenario 2: Error Handling Tests

#### Invalid OTP
```
POST /api/auth/verify-otp
Body: {"email": "niteshkumar9591@gmail.com", "otp": "000000"}
Expected: 400 error with "Invalid OTP" message
```

#### Unauthorized Access
```
GET /api/profiles
Headers: Authorization: Bearer invalid_token
Expected: 401 error with "Authentication required" message
```

#### Non-approved Email
```
POST /api/auth/send-otp
Body: {"email": "unapproved@example.com"}
Expected: 403 error with "Email not approved" message
```

### Scenario 3: File Upload Testing

1. First authenticate (Steps 1-2 from Scenario 1)
2. Upload file:
   ```
   POST /api/upload/single
   Headers: Authorization: Bearer [token]
   Body: Form-data with image file
   ```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
- **Problem**: Cannot connect to server
- **Solution**: Ensure backend server is running on correct port
- **Check**: `lsof -i :4500` for static mode, `lsof -i :5500` for MongoDB mode

#### 2. Authentication Required Error
- **Problem**: 401 errors on authenticated endpoints
- **Solution**: 
  1. Verify OTP first to get fresh token
  2. Check that token is properly set in `auth_token` variable
  3. Ensure Authorization header format: `Bearer [token]`

#### 3. Email Not Approved
- **Problem**: Cannot send OTP to email
- **Solution**: Use approved email `niteshkumar9591@gmail.com` or add new email to approved list

#### 4. Invalid OTP in Static Mode
- **Problem**: OTP verification fails
- **Solution**: Always use `123456` as OTP in static/demo mode

### Debug Commands

#### Check Server Status
```bash
# Check if servers are running
lsof -i :4500  # Static mode
lsof -i :5500  # MongoDB mode

# Check server logs
tail -f backend/logs/app.log
```

#### Test with cURL
```bash
# Health check
curl http://localhost:4500/health

# Send OTP
curl -X POST http://localhost:4500/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"niteshkumar9591@gmail.com"}'

# Verify OTP and get token
curl -X POST http://localhost:4500/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"niteshkumar9591@gmail.com","otp":"123456"}'
```

## Mode-Specific Differences

### Static Mode (Port 4500)
- Uses demo/mock data
- OTP is always `123456`
- No actual database required
- Faster response times
- Limited to approved emails only

### MongoDB Mode (Port 5500)
- Uses actual MongoDB database
- Real OTP generation (if email service configured)
- Persistent data storage
- Full CRUD operations
- Production-like behavior

## Security Notes

### Contact Information Protection
- Phone numbers and emails are now obfuscated in frontend
- Direct `tel:` and `mailto:` links replaced with secure handlers
- Network requests don't expose contact details in URLs

### Authentication Security
- JWT tokens expire in 24 hours
- Refresh tokens available for extended sessions
- Secure storage recommendations for production

## Collection Variables Reference

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `base_url_static` | Static mode server URL | http://localhost:4500 |
| `base_url_mongodb` | MongoDB mode server URL | http://localhost:5500 |
| `test_email` | Approved test email | niteshkumar9591@gmail.com |
| `demo_otp` | Demo OTP for static mode | 123456 |
| `auth_token` | JWT token (auto-populated) | (empty initially) |

## Advanced Testing

### Load Testing
For performance testing, use tools like Apache Bench:
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:4500/health

# Test authenticated endpoint (after getting token)
ab -n 100 -c 5 -H "Authorization: Bearer [token]" http://localhost:4500/api/profiles
```

### Integration Testing
Test the complete flow from frontend to backend:
1. Frontend on http://localhost:3000
2. Backend on http://localhost:4500
3. Test login flow through UI
4. Verify API calls in Network tab

This documentation covers all aspects of testing the Shaadi Mantra API. For additional support, use the secure contact methods in the application.
