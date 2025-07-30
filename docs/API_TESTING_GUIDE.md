# Shaadi Mantra API Testing Guide

## Overview
This guide provides comprehensive instructions for testing all Shaadi Mantra API endpoints in MongoDB mode for both development and production environments.

## 🔄 **NEW: Comprehensive Matching System**

The application now implements a complete matching system with daily limits and mutual matching:

### **Key Features:**
- **Daily Limit**: Users can like up to 5 profiles per day
- **Discovery Tab**: Shows new profiles for swiping (with daily limit)
- **Request Tab**: Shows all profiles the user has liked
- **Matches Tab**: Shows only mutual matches (both users liked each other)
- **Chat Activation**: Only mutual matches can chat

### **Daily Limit System:**
- Users get 5 likes per day
- After reaching the limit, Discovery shows "Try again tomorrow for more matches"
- Daily limit resets at midnight
- Passes (swipe left) don't count against the limit

## Frontend-Backend Connection
**Important**: The frontend is configured to connect to the backend at `http://localhost:5500`. 
- Frontend runs on: `http://localhost:3000`
- Backend runs on: `http://localhost:5500`
- CORS is configured to allow requests from `http://localhost:3000` to `http://localhost:5500`

**Troubleshooting**: If you encounter "Failed to fetch" errors:
1. Ensure both frontend and backend servers are running
2. Check that the backend is accessible at `http://localhost:5500/health`
3. Verify CORS configuration allows frontend origin
4. Frontend API calls should use the full backend URL, not relative paths

**Port Configuration Fix**: 
- The Next.js proxy in `frontend/next.config.js` is configured to forward API requests to `http://localhost:5500`
- If you encounter "Failed to send invitation" errors, ensure the backend is running on port 5500
- The frontend uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:5500` environment variable

## Quick Start

### Prerequisites
- Postman installed
- Backend server running
- Frontend server running (optional, for full-stack testing)

### Server Configurations

#### MongoDB Development Mode (Port 5500)
```bash
cd backend
NODE_ENV=development DATA_SOURCE=mongodb PORT=5500 node start.js
```

#### MongoDB Production Mode (Port 5500)
```bash
cd backend  
NODE_ENV=production DATA_SOURCE=mongodb PORT=5500 node start.js
```

### Frontend Configuration
Set the backend port for the frontend by setting the environment variable `NEXT_PUBLIC_API_BASE_URL`:
- For dev:    `NEXT_PUBLIC_API_BASE_URL=http://localhost:5500`
- For prod:   `NEXT_PUBLIC_API_BASE_URL=https://your-production-domain.com`

You can set this in your `.env`, `.env.local`, or via npm scripts.

## Postman Collection Setup

### 1. Import Collection
- Open Postman
- Click "Import" → "File"
- Select `postman/Shaadi_Mantra_API_Collection_v3_MongoDB_Only.json`
- Collection will be imported with pre-configured variables

### 2. Environment Variables
The collection includes these variables:
- `base_url_dev`: http://localhost:5500
- `base_url_prod`: https://your-production-domain.com
- `test_email`: niteshkumar9591@gmail.com
- `auth_token`: (auto-populated after authentication)
- `user_uuid`: (for testing specific user endpoints)

### 3. Test Sequence
**Always follow this order for authenticated endpoints:**

1. **Health Check** → 2. **Send OTP** → 3. **Verify OTP** → 4. **Authenticated Endpoints**

### 4. Troubleshooting

#### MongoDB Schema Optimization
The application now uses optimized MongoDB schemas:
- **Login History**: Replaced with `lastLogin` object (prevents unbounded growth)
- **Legacy Fields**: Removed `age`, `profession`, `location` (calculated from other fields)
- **Preferences**: Optimized to store only selected values
- **TTL Indexes**: Automatic cleanup of old data

#### Common Issues and Solutions

**Issue**: "User validation failed" errors
**Solution**: The schema has been optimized. Ensure you're using the latest API endpoints.

**Issue**: "Database connection failed"
**Solution**: 
1. Check MongoDB connection string in `.env`

**Issue**: "Failed to send invitation" error in admin email invitations
**Solution**: 
1. Ensure backend is running on port 5500: `lsof -i :5500`
2. Check Next.js proxy configuration in `frontend/next.config.js` points to `http://localhost:5500`
3. Verify frontend environment variable: `NEXT_PUBLIC_API_BASE_URL=http://localhost:5500`
4. Test API connectivity: `curl http://localhost:5500/health`
5. Check browser console for detailed error messages (enhanced error logging added)

**Issue**: `profileCompleted` field not available in API responses
**Solution**: 
1. The `profileCompleted` field is now included in all user-related API responses
2. Available in: `/api/admin/users`, `/api/profiles/me`, `/api/matching/discovery`, `/api/matching/liked`
3. Field indicates whether user has completed their profile (100% completion)
4. Used for profile completion tracking and user status management

**Issue**: `profileCompleteness` percentage not showing in admin users table
**Solution**: 
1. The `profileCompleteness` field is now included in the `/api/admin/users` response
2. Backend query includes `'profile.profileCompleteness': 1` in the MongoDB projection
3. Frontend displays the percentage from the database in the "Profile Complete" column
4. Used for accurate user categorization and status display
2. Ensure MongoDB Atlas is accessible
3. Verify network connectivity

**Issue**: "Rate limit exceeded"
**Solution**: 
1. Wait 15 minutes for rate limit to reset
2. Use different email for testing
3. Check rate limiting configuration

## API Endpoints Reference

### 1. Health & Status
- `GET /health` - Application health check
- `GET /health/database` - Database status

### 2. Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/preapproved/check` - Check email approval status
- `GET /api/auth/profile` - Get authenticated user profile

### 3. Profiles
- `GET /api/profiles` - Get all profiles (with filters)
- `GET /api/profiles/me` - Get current user profile
- `PUT /api/profiles/me` - Update current user profile
- `GET /api/profiles/uuid/:uuid` - Get profile by UUID (public)
- `DELETE /api/profiles/me` - Delete current user profile

### 4. File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `POST /api/upload/profile-image` - Upload profile image (legacy)
- `GET /api/upload/history` - Get upload history

### 4.1. B2 Cloud Storage (Profile Pictures)
- `POST /api/upload/profile-picture` - Upload profile picture to B2 Cloud Storage
- `DELETE /api/upload/profile-picture` - Delete profile picture from B2 Cloud Storage
- `GET /api/upload/profile-picture/:userId/url` - Get signed URL for profile picture
- `GET /api/upload/storage/stats` - Get B2 storage statistics (admin only)

### 5. Matching & Discovery
- `GET /api/matching/discovery` - Get discovery profiles
- `POST /api/matching/like` - Like a profile
- `POST /api/matching/pass` - Pass on a profile
- `GET /api/matching/liked` - Get liked profiles
- `GET /api/matching/matches` - Get mutual matches
- `GET /api/matching/stats` - Get daily like statistics
- `POST /api/matching/unmatch` - Unmatch from a profile

### 6. Connections & Chat
- `GET /api/connections` - Get user connections
- `GET /api/connections/:id` - Get connection by ID

### 7. Invitations
- `POST /api/invitations` - Create invitation (admin only)
- `GET /api/invitations` - Get all invitations (admin only)

### 8. Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Add new user (admin only)
- `POST /api/admin/users/:userId/pause` - Pause user (admin only)
- `POST /api/admin/users/:userId/resume` - Resume user (admin only)
- `POST /api/admin/users/:userId/invite` - Send invitation to user (admin only)
- `POST /api/admin/users/send-bulk-invites` - Send bulk invitations (admin only)
- `GET /api/admin/stats` - Get admin statistics (admin only)
- `GET /api/admin/users/:userId/invitations` - Get user invitation history (admin only)

### 9. Admin Dashboard Endpoints
- `GET /api/admin/stats` - Get comprehensive admin statistics including storage stats (admin only)
- `GET /api/upload/storage/stats` - Get B2 Cloud Storage statistics (admin only)

### 10. Chat Endpoints
- `GET /api/chat/:connectionId` - Get chat messages for a connection
- `POST /api/chat/:connectionId` - Send a message in a connection
- `PUT /api/chat/:connectionId/read` - Mark messages as read

### 9. Legacy Match Endpoints
- `POST /api/matches/swipe` - Swipe on a profile (legacy)

## Testing Scenarios

### Scenario 1: New User Registration
1. Admin adds user via `/api/admin/users`
2. User receives invitation email
3. User sends OTP via `/api/auth/send-otp`
4. User verifies OTP via `/api/auth/verify-otp`
5. User completes profile via `/api/profiles/me`

### Scenario 2: Profile Discovery and Matching
1. Authenticated user gets discovery profiles via `/api/matching/discovery`
2. User likes profiles via `/api/matching/like`
3. User checks mutual matches via `/api/matching/matches`
4. User can chat with mutual matches

### Scenario 3: Admin Management
1. Admin views all users via `/api/admin/users`
2. Admin sends invitations via `/api/admin/users/:userId/invite`
3. Admin monitors statistics via `/api/admin/stats`
4. Admin manages user status (pause/resume)

## Admin Panel Endpoints

### Admin Authentication

All admin endpoints require admin role verification. Admin users can:
1. Login via existing Shaadi Mantra authentication system
2. View all users via `/api/admin/users`
3. Send invitations via `/api/admin/invitations`
4. Monitor statistics via `/api/admin/stats`
5. Manage user status (pause/resume)
6. Manage email invitations

**Admin User:** `codebynitesh@gmail.com` (role: admin)

### Authentication Flow

1. **Login**: Use existing Shaadi Mantra login system
2. **Admin Check**: System verifies user role via `/api/auth/profile`
3. **Access**: Admin users can access `/admin/*` routes

### User Management

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <auth_token>
```
**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastActive": "2024-01-15T12:00:00.000Z",
      "approvedByAdmin": true,
      "userUuid": "uuid-123"
    }
  ]
}
```

#### Pause User Account
```http
PUT /api/admin/users/:userId/pause
Authorization: Bearer <auth_token>
Content-Type: application/json
```
**Response:**
```json
{
  "success": true,
  "message": "User paused successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "paused"
  }
}
```

#### Resume User Account
```http
PUT /api/admin/users/:userId/resume
Authorization: Bearer <auth_token>
Content-Type: application/json
```
**Response:**
```json
{
  "success": true,
  "message": "User resumed successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "active"
  }
}
```

### Email Invitations Management

#### Get All Invitations
```http
GET /api/admin/invitations
Authorization: Bearer <auth_token>
```
**Response:**
```json
{
  "success": true,
  "invitations": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "status": "pending",
      "sentAt": "2024-01-15T10:30:00.000Z",
      "count": 1
    }
  ]
}
```

#### Create New Invitation
```http
POST /api/admin/invitations
Authorization: Bearer <auth_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "invitation": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "pending",
    "sentAt": "2024-01-15T10:30:00.000Z",
    "count": 1
  }
}
```

#### Resend Invitation
```http
POST /api/admin/invitations/:invitationId/resend
Authorization: Bearer <auth_token>
Content-Type: application/json
```
**Response:**
```json
{
  "success": true,
  "message": "Invitation resent successfully",
  "invitation": {
    "_id": "507f1f77bcf86cd799439011",
    "count": 2,
    "sentAt": "2024-01-15T11:30:00.000Z"
  }
}
```

### Storage Statistics

#### Get Storage Stats
```http
GET /api/upload/storage/stats
Authorization: Bearer <auth_token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 25,
    "totalSizeBytes": 5242880,
    "totalSizeMB": 5.0,
    "averageSizeBytes": 209715,
    "averageSizeKB": 205
  }
}
```

#### Get Admin Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <auth_token>
```
**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 50,
    "activeUsers": 40,
    "newUsers": 5,
    "adminUsers": 2,
    "recentRegistrations": 8,
    "totalPreapproved": 30,
    "approvedUsers": 25,
    "pausedUsers": 5,
    "totalInvitations": 15,
    "totalInvitationCount": 20
  },
  "storageStats": {
    "totalUsers": 50,
    "totalProfiles": 45,
    "totalImages": 30,
    "totalStorageSize": "2.1 MB",
    "averageProfileCompleteness": 75,
    "profilesWithImages": 30,
    "profilesWithoutImages": 15,
    "recentActivity": {
      "last24Hours": 3,
      "last7Days": 12,
      "last30Days": 35
    }
  }
}
```

## Performance Monitoring

### Key Metrics to Monitor
1. **Response Times**: All endpoints should respond within 2 seconds
2. **Database Performance**: Monitor MongoDB query performance
3. **Rate Limiting**: Track rate limit hits and adjust if needed
4. **Error Rates**: Monitor for 4xx and 5xx errors
5. **Storage Usage**: Monitor MongoDB storage growth

### Monitoring Commands
```bash
# Check application health
curl http://localhost:5500/health

# Check database status
curl http://localhost:5500/health/database

# Test authentication flow
curl -X POST http://localhost:5500/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Security Considerations

### Authentication
- All sensitive endpoints require JWT authentication
- OTP verification is required for login
- Admin endpoints require admin role verification

### Rate Limiting
- General API: 100 requests per 15 minutes (prod)
- Authentication: 30 requests per 15 minutes (prod)
- More lenient limits in development

### Data Protection
- All user data is encrypted in transit
- Sensitive data is not logged
- Admin approval required for user registration

## Troubleshooting Guide

### Common Issues

**Issue**: "Failed to fetch" in frontend
**Solution**: 
1. Check backend is running on port 5500
2. Verify CORS configuration
3. Check network connectivity

**Issue**: "Database connection failed"
**Solution**:
1. Verify MongoDB connection string
2. Check MongoDB Atlas status
3. Ensure network connectivity

**Issue**: "Rate limit exceeded"
**Solution**:
1. Wait for rate limit to reset (15 minutes)
2. Use different email for testing
3. Check rate limiting configuration

**Issue**: "User not found" errors
**Solution**:
1. Ensure user exists in database
2. Check user approval status
3. Verify authentication token

### Debug Mode
When `NODE_ENV=development`, the application provides:
- Detailed error messages
- Request/response logging
- Development OTP responses
- Enhanced debugging information

## Migration Notes

### From Static Mode
The application no longer supports static/demo mode. All data is now stored in MongoDB with optimized schemas.

### Schema Changes
- **Login History**: Now uses `lastLogin` object instead of array
- **Legacy Fields**: Removed redundant fields (age, profession, location)
- **Preferences**: Optimized to store only selected values
- **TTL Indexes**: Automatic cleanup of old data

### Backward Compatibility
All API endpoints maintain backward compatibility. The frontend will continue to work without changes.

---

**🎉 Updated for MongoDB-Only Setup!**

This guide now reflects the optimized MongoDB-only architecture with improved performance, reduced storage costs, and better maintainability.
