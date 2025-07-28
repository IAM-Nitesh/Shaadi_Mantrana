# Shaadi Mantra API Testing Guide

## Overview
This guide provides comprehensive instructions for testing all Shaadi Mantra API endpoints in Static, MongoDB Dev, and MongoDB Prod modes.

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
**Important**: The frontend is configured to connect to the backend at `http://localhost:4500`. 
- Frontend runs on: `http://localhost:3000`
- Backend runs on: `http://localhost:4500`
- CORS is configured to allow requests from `http://localhost:3000` to `http://localhost:4500`

**Troubleshooting**: If you encounter "Failed to fetch" errors:
1. Ensure both frontend and backend servers are running
2. Check that the backend is accessible at `http://localhost:4500/health`
3. Verify CORS configuration allows frontend origin
4. Frontend API calls should use the full backend URL, not relative paths

## Quick Start

### Prerequisites
- Postman installed
- Backend server running
- Frontend server running (optional, for full-stack testing)

### Server Configurations

#### Static Mode (Port 3500)
```bash
cd backend
NODE_ENV=static DATA_SOURCE=static USE_MONGODB=false PORT=3500 node start.js
```

#### MongoDB Dev Mode (Port 4500)
```bash
cd backend  
NODE_ENV=development DATA_SOURCE=mongodb PORT=4500 node start.js
```

#### MongoDB Prod Mode (Port 5500)
```bash
cd backend  
NODE_ENV=production DATA_SOURCE=mongodb PORT=5500 node start.js
```

### Frontend Configuration
Set the backend port for the frontend by setting the environment variable `NEXT_PUBLIC_API_BASE_URL`:
- For static: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3500`
- For dev:    `NEXT_PUBLIC_API_BASE_URL=http://localhost:4500`
- For prod:   `NEXT_PUBLIC_API_BASE_URL=http://localhost:5500`

You can set this in your `.env`, `.env.local`, or via npm scripts.

## Postman Collection Setup

### 1. Import Collection
- Open Postman
- Click "Import" → "File"
- Select `postman/Shaadi_Mantra_API_Collection_v2.json`
- Collection will be imported with pre-configured variables

### 2. Environment Variables
The collection includes these variables:
- `base_url_static`: http://localhost:3500
- `base_url_dev`: http://localhost:4500  
- `base_url_prod`: http://localhost:5500
- `test_email`: niteshkumar9591@gmail.com
- `demo_otp`: 123456
- `auth_token`: (auto-populated after authentication)

### 3. Test Sequence
**Always follow this order for authenticated endpoints:**

1. **Health Check** → 2. **Send OTP** → 3. **Verify OTP** → 4. **Authenticated Endpoints**

### 4. Troubleshooting

#### MongoDB Enum Validation Errors
If you encounter validation errors like:
```
User validation failed: profile.gender: `` is not a valid enum value for path `profile.gender`
```

**Solution**: Run the database cleanup script:
```bash
cd backend
npm run db:cleanup-enums
```

This script removes empty string values from enum fields, which are not valid in MongoDB schemas.

**Note**: This issue has been fixed in the codebase. The cleanup script will resolve any existing users with empty enum values, and new users will not have this issue.

#### Profile Completeness Validation Errors
If you encounter errors like:
```
User validation failed: profile.profileCompleteness: Path `profile.profileCompleteness` (110) is more than maximum allowed value (100).
```

**Solution**: Run the profile completeness fix script:
```bash

#### Email Configuration Issues
If you encounter email-related errors like:
```
❌ Failed to send invitation email: Error: Missing credentials for "PLAIN"
```

**This is expected behavior in development mode.** The system is designed to work without email configuration:

**Current Status**: ✅ Working correctly
- Database operations: ✅ Successful
- Invitation creation: ✅ Successful  
- Development fallback: ✅ Working

**What's happening**: The system logs invitation links to the console instead of sending emails:
```
📧 Development fallback - Invitation link for user@example.com: http://localhost:3000?invite=uuid&email=user%40example.com
```

**To enable actual email sending** (for production):

1. **Set up Gmail App Password**:
   - Enable 2-Factor Authentication on `shaadimantra.help@gmail.com`
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)" → Name it "Shaadi Mantra"

2. **Create `.env` file** in project root:
```bash
# Email Configuration
GMAIL_APP_PASSWORD=your-16-character-app-password
SMTP_USER=shaadimantra.help@gmail.com
SMTP_PASS=your-16-character-app-password
ENABLE_EMAIL=true
```

3. **Restart the backend server**

**Note**: The invitation system works perfectly in development mode without email configuration. Users can access the invitation links logged to the console.

#### Admin Dashboard Statistics Update
**Updated**: Admin dashboard statistics now exclude admin users from counts:

- **Total Users**: Excludes admin users (`role: { $ne: 'admin' }`)
- **Active Users**: Excludes admin users from active count
- **New Users**: Excludes admin users from new user count
- **Recent Registrations**: Excludes admin users from 7-day registration count
- **Preapproved Stats**: Excludes admin emails from preapproved counts

This ensures that admin users don't skew the user statistics in the dashboard.

#### User Status Management System
A new status management system has been implemented with three user statuses:

**Status: Invited**
- Set when admin approves email or sends invitation
- User has not yet completed profile details
- Users can log in but need to complete profile

**Status: Active**
- Set when user completes all required profile information
- User can fully access the application
- Profile completion is tracked automatically

**Status: Paused**
- Set when admin uses pause feature
- Disables "approved by admin" flag
- Users cannot log in until admin resumes account

**Admin Actions Available:**
- `POST /api/admin/users/:userId/pause` - Pause user account
- `POST /api/admin/users/:userId/resume` - Resume user account (restores access)
- `POST /api/admin/users/:userId/invite` - Send invitation to user
- `POST /api/admin/users/:userId/send-invite` - Alternative send invitation endpoint

**Status Flow:**
1. Admin invites user → Status: `invited`
2. User completes profile → Status: `active`
3. Admin can pause user → Status: `paused`
4. Admin can resume user → Status: `active`

**Testing Status Management:**
```bash
# Pause a user
curl -X POST "http://localhost:4500/api/admin/users/USER_ID/pause" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Resume a user
curl -X POST "http://localhost:4500/api/admin/users/USER_ID/resume" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Send invitation to user
curl -X POST "http://localhost:4500/api/admin/users/USER_ID/invite" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
cd backend
npm run db:fix-profile-completeness
```

This script fixes existing users with profileCompleteness values that exceed 100.

**Note**: This issue has been fixed in the codebase. New users will have profileCompleteness set to 17 (basic profile setup), and the virtual calculation is capped at 100.

#### Database Cleanup Scripts
To start fresh with a clean database, use these scripts:

**Quick Cleanup (recommended for fresh start):**
```bash
cd backend
npm run db:cleanup-quick
```

**Complete Cleanup (removes ALL data):**
```bash
cd backend
npm run db:cleanup-all
```

**Selective Cleanup (removes only test data):**
```bash
cd backend
npm run db:cleanup-test
```

**Invitations Cleanup (fixes duplicate key errors):**
```bash
cd backend
npm run db:cleanup-invitations
```

**Check Database State:**
```bash
cd backend
npm run db:check
```

**Check Admin Users:**
```bash
cd backend
npm run db:check-admin
```

**Cleanup Admin Users:**
```bash
cd backend
npm run db:cleanup-admin
npm run db:cleanup-admin-invitations
```

**Note**: 
- The quick cleanup is the fastest way to start fresh
- The complete cleanup removes all users, preapproved emails, and invitations
- The selective cleanup only removes test data (example.com domains, test@, demo@, admin@shaadimantra.com)
- Use `db:check` to verify the database state before and after cleanup
- Use `db:check-admin` to verify admin user status
- Use `db:cleanup-admin` to remove admin users from preapproved collection (they don't need to be there)

#### Email Not Approved Error
If you encounter an error like:
```
This email is not approved by admin. Please contact support.
```

#### Admin User Creation Error
If you encounter a MongoDB duplicate key error when adding users through the admin interface:
```
MongoServerError: E11000 duplicate key error collection: test.invitations index: invitationCode_1 dup key: { invitationCode: null }
```

**Solution**: Run the invitations cleanup script:
```bash
cd backend
npm run db:cleanup-invitations
```

This script removes problematic documents and indexes from the invitations collection that can cause duplicate key errors.

**Note**: The admin user creation has been updated to handle invitation creation failures gracefully. If invitation creation fails, the user will still be created successfully.

**Solution**: This is the new admin approval system working correctly. Only admin-approved emails can register/login. To add a user:

1. **Admin Login**: First, an admin user must log in through the admin interface
2. **Add User**: Use the admin API to add new users:
   ```
   POST /api/admin/users
   {
     "email": "user@example.com",
     "firstName": "User",
     "lastName": "Name"
   }
   ```
3. **User Registration**: The user can then register/login with the approved email

**Note**: The old hardcoded email approval system has been replaced with a database-driven admin approval system using the `preapproved` collection.

#### Admin Authentication Error
If an admin user gets "email not approved" error:

**Solution**: The authentication system has been updated to automatically handle admin users:
- Admin users can login even if not in preapproved list
- System automatically adds admin users to preapproved list
- Admin users bypass the approval check
- The `/api/auth/preapproved/check` endpoint now considers admin users

**To verify admin status:**
```bash
cd backend
npm run db:check-admin
```

**To add admin user:**
```bash
cd backend
npm run db:add-admin-simple
```

**To test the preapproved check endpoint:**
```bash
# Test admin user (should return true)
curl -X GET "http://localhost:4500/api/auth/preapproved/check?email=codebynitesh@gmail.com"

# Test non-approved user (should return false)
curl -X GET "http://localhost:4500/api/auth/preapproved/check?email=test@example.com"
```

#### Database Cleanup for Admin Users
Since admin users no longer need to be in the preapproved collection, you can clean up the database:

**Remove admin users from preapproved collection:**
```bash
cd backend
npm run db:cleanup-admin
```

**Comprehensive cleanup (admin + invitations):**
```bash
cd backend
npm run db:cleanup-admin-invitations
```

**Note**: After cleanup, admin users will still be able to login because the system checks for admin role in the users collection.

**Solution**: Add the email to the approved list using the centralized management script:
```bash
npm run emails:add <email>
```

#### Invitation Email Service
The system now includes a comprehensive invitation email service that sends beautifully styled emails to new users.

**Features**:
- Beautiful HTML email template with brand styling
- Responsive design for mobile and desktop
- Includes invitation link with user UUID
- Fallback plain text version
- Gmail integration with app password authentication
- Mobile app download section with Play Store link

**Setup**:
1. Enable 2-factor authentication on `shaadimantra.help@gmail.com`
2. Generate an App Password for the Gmail account
3. Set the environment variable:
   ```bash
   export GMAIL_APP_PASSWORD="your-app-password"
   ```

**Testing**:
```bash
cd backend
npm run test:invite-email
npm run test:specific-invite
npm run test:admin-invite
```

**Email Template Features**:
- **Clean Design**: Removed brand logo due to display issues, focused on clean typography
- **Brand Colors**: Rose gradient (#ec4899 to #f43f5e) matching app branding
- **Typography**: Inter font family for consistency
- **Tagline**: "Your journey to forever starts here" (same as app)
- **Welcome Message**: Concise and welcoming introduction
- **Feature Grid**: 3-column layout for Complete Profile, Smart Matching, Start Chatting
- **Call-to-Action**: "Download Mobile App" button with Google Play Store link
- **Web Access**: Secondary link for web browser access
- **Information Grid**: Security, Quality, Mobile, Premium features in compact layout
- **Invitation Details**: Email, UUID, and validity information
- **Footer**: Contact info and legal information
- **Single-screen layout**: Optimized to fit without scrolling
- **Mobile-responsive design** with hover effects and animations

**Solution**: Use the centralized email management system:

**Option 1: Using npm scripts (Recommended)**
```bash
# Add new email
npm run emails:add <email@example.com>

# Remove email
npm run emails:remove <email@example.com>

# List all approved emails
npm run emails:list

# Sync files across frontend/backend
npm run emails:sync
```

**Option 2: Direct script usage**
```bash
# Add new email
node scripts/manage-approved-emails.js add <email@example.com>

# Remove email
node scripts/manage-approved-emails.js remove <email@example.com>

# List all approved emails
node scripts/manage-approved-emails.js list
```

**Option 3: Database only (for existing users)**
```bash
cd backend
npm run db:add-approved-email -- <email@example.com>
```

**Examples**:
```bash
npm run emails:add savita.rani6620@gmail.com
npm run emails:list
```

**Note**: The centralized system uses a single shared file (`shared/approved-emails.json`) that both frontend and backend reference. No duplicate files are maintained.

## API Endpoints Reference

### 1. Health & Status Endpoints

#### Health Check
- **Static Mode**: `GET {{base_url_static}}/health`
- **Dev Mode**: `GET {{base_url_dev}}/health`
- **Prod Mode**: `GET {{base_url_prod}}/health`
- **Purpose**: Verify server is running

#### Database Status
- **Static Mode**: `GET {{base_url_static}}/health/database`
- **Dev Mode**: `GET {{base_url_dev}}/health/database`
- **Prod Mode**: `GET {{base_url_prod}}/health/database`
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
- **Notes**: 
  - Rate limited to prevent abuse
  - Checks `preapproved` collection for `approvedByAdmin: true`
  - Only allows login for admin-approved emails
  - Returns error if email not approved or account paused

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

⚠️ **Important**: The `accessToken` from the response is automatically stored in the `auth_token` variable for subsequent authenticated requests.

### 3. Admin API Endpoints (Admin Authentication Required)

#### Get All Users
- **Endpoint**: `GET /api/admin/users`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Notes**: 
  - Requires admin role
  - Returns users from `users` collection with `approvedByAdmin` status from `preapproved` collection
  - Includes `userUuid` for tracking

#### Add New User
- **Endpoint**: `POST /api/admin/users`
- **Headers**: 
  - `Authorization: Bearer {{auth_token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "email": "user@example.com",
  "firstName": "User",
  "lastName": "Name"
}
```
- **Notes**:
  - Creates entries in `preapproved`, `invitations`, and `users` collections
  - Generates unique `userUuid` and `invitationId`
  - Sets `approvedByAdmin: true` and `isFirstLogin: true`
  - Sends invitation email automatically

#### Pause/Unpause User
- **Endpoint**: `PATCH /api/admin/users/:userId/pause`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Notes**:
  - Updates `approvedByAdmin` flag in `preapproved` collection
  - Paused users cannot login

#### Send Invite to User
- **Endpoint**: `POST /api/admin/users/:userId/send-invite`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Notes**:
  - Creates/updates `invitation` record with history tracking
  - Increments invitation count
  - Sends invitation email

#### Send Bulk Invites
- **Endpoint**: `POST /api/admin/users/send-bulk-invites`
- **Headers**: 
  - `Authorization: Bearer {{auth_token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "userIds": ["userId1", "userId2", "userId3"]
}
```

#### Get Admin Statistics
- **Endpoint**: `GET /api/admin/stats`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Notes**:
  - Returns comprehensive stats from `users`, `preapproved`, and `invitations` collections
  - Includes total users, approved users, paused users, total invitations, etc.

#### Get User Invitation History
- **Endpoint**: `GET /api/admin/users/:userId/invitations`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Notes**:
  - Returns detailed invitation history for a specific user
  - Includes all sent invitations with timestamps and status

#### Check Preapproved Email
- **Endpoint**: `GET /api/auth/preapproved/check?email=user@example.com`
- **Notes**:
  - Public endpoint to check if an email is approved
  - Returns `{"preapproved": true/false}`
- **Test Emails**:
  - `test@example.com` - Test user
  - `user@example.com` - Regular user
  - `admin@shaadimantra.com` - Admin user

### 4. Profile Endpoints (Authentication Required)

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
- **Body**: Complete profile data (all fields are required for profile completion)

**Important**: When a user completes their profile (all required fields filled), the system automatically:
1. Updates the user's status from 'invited' to 'active' in the User collection
2. Sets `profileCompleted: true` in the User collection  
3. Updates `isFirstLogin: false` in the PreapprovedEmail collection
4. Enables full access to the application

**Backend Logs**: When profile completion is detected, you'll see logs like:
```
🔍 Checking profile completion for user: user@example.com
📋 Current profile data: { name: "John Doe", gender: "Male", ... }
  ✅ name: John Doe (string)
  ✅ gender: Male (string)
  ...
📊 Profile completion check: COMPLETE
🎉 Profile is complete! Updating user status...
✅ PreapprovedEmail updated: success
✅ User user@example.com status updated to active (profile completed)
```
```json
{
  "name": "Rahul Kumar Sharma",
  "gender": "Male",
  "nativePlace": "Lucknow",
  "currentResidence": "Noida",
  "maritalStatus": "Never Married",
  "manglik": "No",
  "dateOfBirth": "1995-06-15",
  "timeOfBirth": "14:30",
  "placeOfBirth": "Dehradun",
  "height": "5'8\"",
  "weight": "70 kg",
  "complexion": "Fair",
  "education": "B.Tech MBA",
  "occupation": "Software Engineer",
  "annualIncome": "8 LPA",
  "eatingHabit": "Vegetarian",
  "smokingHabit": "No",
  "drinkingHabit": "No",
  "father": "Rajesh Kumar Sharma",
  "mother": "Sunita Sharma",
  "brothers": "1",
  "sisters": "0",
  "fatherGotra": "Kashyap",
  "motherGotra": "Bharadwaj",
  "specificRequirements": "Looking for a well-educated, family-oriented person",
  "settleAbroad": "Maybe",
  "about": "I am a software engineer working in a reputed company. I am looking for a life partner who shares similar values and goals.",
  "interests": ["Technology", "Travel", "Music", "Reading"],
  "isFirstLogin": false
}
```

**Profile Schema Details:**
- **Basic Info**: name, gender, nativePlace, currentResidence, maritalStatus, manglik
- **Birth Details**: dateOfBirth, timeOfBirth, placeOfBirth  
- **Physical**: height, weight, complexion
- **Professional**: education, occupation, annualIncome
- **Lifestyle**: eatingHabit, smokingHabit, drinkingHabit
- **Family**: father, mother, brothers, sisters
- **Gotra**: fatherGotra, motherGotra, grandfatherGotra, grandmotherGotra
- **Preferences**: specificRequirements, settleAbroad, about
- **Interests**: Array of interest strings (max 10)
- **System**: isFirstLogin (auto-managed)

**Note:** Images are not currently stored in MongoDB and will be implemented in a future update.

### 4. Match & Like Endpoints (Authentication Required)

#### Swipe on User
- **Endpoint**: `POST /api/matches/swipe`
- **Headers**: 
  - `Authorization: Bearer {{auth_token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "likedUserId": "userId",
  "action": "like",
  "source": "discovery",
  "platform": "web"
}
```
- **Actions**: `like`, `super_like`, `pass`
- **Notes**: 
  - Records swipe action in `matches` collection
  - Automatically detects mutual matches
  - Prevents duplicate swipes on same user

#### Get My Matches
- **Endpoint**: `GET /api/matches/matches`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20)
- **Notes**: Returns users with mutual likes (both users swiped right)

#### Get My Likes
- **Endpoint**: `GET /api/matches/likes`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20)
- **Notes**: Returns all users current user has swiped right on

#### Get Users Who Liked Me
- **Endpoint**: `GET /api/matches/liked-by`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20)
- **Notes**: Returns users who have swiped right on current user

#### Get Match Statistics
- **Endpoint**: `GET /api/matches/stats`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Notes**: Returns match statistics including total matches, likes, and match rate

### 5. File Upload Endpoints (Authentication Required)

#### Upload Single File
- **Endpoint**: `POST /api/upload/single`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Body**: Form-data with `image` field (file)

#### Upload Multiple Files
- **Endpoint**: `POST /api/upload/multiple`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Body**: Form-data with `images` field (multiple files)

### 5. Admin Endpoints

#### Get All Users (Admin Only)
- **Endpoint**: `GET /api/admin/users`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Array of users with profile information, first/last name, and approval status
- **Notes**: 
  - Returns `firstName`, `lastName`, `fullName`, `approvedByAdmin` fields, and `userUuid`
  - Includes both registered users and pending preapproved emails
  - Pending users have `isPending: true` and `role: 'pending'`
  - Shows complete preapproved email count including those not yet registered
- **Database**: Queries both `users` and `preapproved` collections

#### Add New User (Admin Only)
- **Endpoint**: `POST /api/admin/users`
- **Headers**: `Authorization: Bearer {{auth_token}}`, `Content-Type: application/json`
- **Body**:
```json
{
  "email": "newuser@example.com"
}
```
- **Response**: User created with invitation email sent
- **Notes**: 
  - Creates entries in `preapproved`, `invitations`, and `users` collections
  - Automatically sends invitation email to the new user
  - Generates unique UUID and invitation ID
  - Sets `approvedByAdmin: true` and `isFirstLogin: true`

#### Pause User (Admin Only)
- **Endpoint**: `POST /api/admin/users/:userId/pause`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: User pause confirmation
- **Notes**: Updates user status to 'paused' and sets `approvedByAdmin` flag to false

#### Resume User (Admin Only)
- **Endpoint**: `POST /api/admin/users/:userId/resume`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: User resume confirmation
- **Notes**: Updates user status to 'active' and sets `approvedByAdmin` flag to true

#### Resume User (Admin Only)
- **Endpoint**: `POST /api/admin/users/:userId/resume`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: User resume confirmation
- **Notes**: Restores user access by re-enabling the "approved by admin" flag, allowing them to log in again

#### Send Invitation Email (Admin Only)
- **Endpoint**: `POST /api/admin/users/:userId/send-invite`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Invitation email sent with link
- **Notes**: 
  - Sends beautiful HTML invitation email to existing user
  - Creates or updates invitation record in `invitations` collection
  - Maintains invitation history and count
  - Generates new invitation ID for each send

#### Send Bulk Invitation Emails (Admin Only)
- **Endpoint**: `POST /api/admin/users/send-bulk-invites`
- **Headers**: `Authorization: Bearer {{auth_token}}`, `Content-Type: application/json`
- **Body**:
```json
{
  "userIds": ["userId1", "userId2", "userId3"]
}
```
- **Response**: Bulk email results with success/failure counts

#### Get Admin Dashboard Stats (Admin Only)
- **Endpoint**: `GET /api/admin/stats`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Dashboard statistics including user counts, preapproved counts, and invitation statistics
- **Notes**: Returns comprehensive stats from `users`, `preapproved`, and `invitations` collections

#### Get Invitation History (Admin Only)
- **Endpoint**: `GET /api/admin/users/:userId/invitations`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Invitation history for a specific user
- **Notes**: Returns current invitation details and historical invitation records

### 6. Connection Endpoints (Authentication Required)

#### Create Connection
- **Endpoint**: `POST /api/connections`
- **Headers**: `Authorization: Bearer {{auth_token}}`, `Content-Type: application/json`
- **Body**:
```json
{
  "targetUserId": "<MongoDB ObjectId>",
  "type": "like" // or "super_like", "interest", "match"
}
```
- **Response**: Connection object with UUID

#### Get All Connections
- **Endpoint**: `GET /api/connections`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Array of connections for the current user

#### Get Connection by UUID
- **Endpoint**: `GET /api/connections/:uuid`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Connection object

#### Update Connection
- **Endpoint**: `PATCH /api/connections/:uuid`
- **Headers**: `Authorization: Bearer {{auth_token}}`, `Content-Type: application/json`
- **Body**:
```json
{
  "status": "accepted", // or "declined", "blocked", etc.
  "type": "match", // optional
  "metadata": { "source": "search" } // optional
}
```
- **Response**: Updated connection object

#### Delete Connection
- **Endpoint**: `DELETE /api/connections/:uuid`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Success message

---

## Testing Scenarios

### Scenario 1: Basic Authentication Flow (All Modes)

1. **Send OTP**:
   ```
   POST http://localhost:3500/api/auth/send-otp (static)
   POST http://localhost:4500/api/auth/send-otp (dev)
   POST http://localhost:5500/api/auth/send-otp (prod)
   Body: {"email": "niteshkumar9591@gmail.com"}
   ```
   Expected: Success with OTP message

2. **Verify OTP**:
   ```
   POST http://localhost:3500/api/auth/verify-otp (static)
   POST http://localhost:4500/api/auth/verify-otp (dev)
   POST http://localhost:5500/api/auth/verify-otp (prod)
   Body: {"email": "niteshkumar9591@gmail.com", "otp": "123456"}
   ```
   Expected: Success with access token

3. **Get Profiles**:
   ```
   GET http://localhost:3500/api/profiles (static)
   GET http://localhost:4500/api/profiles (dev)
   GET http://localhost:5500/api/profiles (prod)
   Headers: Authorization: Bearer [token from step 2]
   ```
   Expected: Array of profiles

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
- **Check**: `lsof -i :3500` for static, `lsof -i :4500` for dev, `lsof -i :5500` for prod

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
lsof -i :3500  # Static
lsof -i :4500  # Dev
lsof -i :5500  # Prod
```

#### Test with cURL
```bash
# Health check
curl http://localhost:3500/health
curl http://localhost:4500/health
curl http://localhost:5500/health
```

## Mode-Specific Differences

### Static Mode (Port 3500)
- Uses demo/mock data
- OTP is always `123456`
- No actual database required
- Faster response times
- Limited to approved emails only

### MongoDB Dev Mode (Port 4500)
- Uses actual MongoDB database
- Real OTP generation (if email service configured)
- Persistent data storage
- Full CRUD operations
- Production-like behavior

### MongoDB Prod Mode (Port 5500)
- Same as dev, but for production

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
| `base_url_static` | Static mode server URL | http://localhost:3500 |
| `base_url_dev` | Dev mode server URL | http://localhost:4500 |
| `base_url_prod` | Prod mode server URL | http://localhost:5500 |
| `test_email` | Approved test email | niteshkumar9591@gmail.com |
| `demo_otp` | Demo OTP for static mode | 123456 |
| `auth_token` | JWT token (auto-populated) | (empty initially) |

## Advanced Testing

### Load Testing
For performance testing, use tools like Apache Bench:
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3500/health
ab -n 1000 -c 10 http://localhost:4500/health
ab -n 1000 -c 10 http://localhost:5500/health
```

### Integration Testing
Test the complete flow from frontend to backend:
1. Frontend on http://localhost:3000
2. Backend on http://localhost:3500 (static), 4500 (dev), or 5500 (prod)
3. Test login flow through UI
4. Verify API calls in Network tab

This documentation covers all aspects of testing the Shaadi Mantra API. For additional support, use the secure contact methods in the application.

### 7. User Endpoints (Authentication Required unless noted)

#### Get Profile by UUID (Public)
- **Endpoint**: `GET /api/profiles/uuid/:uuid`
- **Headers**: None required
- **Response**: User profile (public fields)

#### Soft Delete (Deactivate) User
- **Endpoint**: `DELETE /api/profiles/me`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Success message and deactivated profile

---

### 8. Invitation Endpoints (Admin Only for Creation)

#### Create Invitation (Admin Only)
- **Endpoint**: `POST /api/invitations`
- **Headers**: `Authorization: Bearer {{auth_token}}`, `Content-Type: application/json`
- **Body**:
```json
{
  "email": "invitee@example.com"
}
```
- **Notes**: Only admin users can send invitations. Email must be in the preapproved list.
- **Response**: Invitation object with code/UUID

#### Get All Invitations (Admin Only)
- **Endpoint**: `GET /api/invitations`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Array of invitations

#### Get Invitation by Code/UUID
- **Endpoint**: `GET /api/invitations/:code`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Invitation object

#### Update Invitation (Accept/Decline/Resend)
- **Endpoint**: `PATCH /api/invitations/:code`
- **Headers**: `Authorization: Bearer {{auth_token}}`, `Content-Type: application/json`
- **Body**: `{ "status": "accepted" }` or `{ "status": "declined" }`
- **Response**: Updated invitation object

#### (Optional) Delete Invitation (Admin Only)
- **Endpoint**: `DELETE /api/invitations/:code`
- **Headers**: `Authorization: Bearer {{auth_token}}`
- **Response**: Success message

---

## Profile API: isFirstLogin Flag

### Overview
- The `isFirstLogin` boolean flag is now always returned in all profile API responses (both MongoDB and demo controllers).
- This flag indicates whether the user is logging in for the first time (i.e., their profile is incomplete or onboarding is required).
- The frontend uses this flag for onboarding and navigation logic (e.g., showing onboarding modals, restricting access to features until profile completion).

### Example: Get Current User Profile

**Endpoint:** `GET /api/profiles/me`

**Response:**
```json
{
  "success": true,
  "profile": {
    "userId": "...",
    "email": "user@example.com",
    "profile": { /* ... */ },
    "isFirstLogin": true,
    // ... other fields ...
  }
}
```

### Example: Get Profiles (Discovery)

**Endpoint:** `GET /api/profiles`

**Response:**
```json
{
  "success": true,
  "profiles": [
    {
      "id": "...",
      "profile": { /* ... */ },
      "isFirstLogin": false,
      // ... other fields ...
    },
    // ...
  ],
  // ...
}
```

### Postman Collection
- Ensure your Postman tests for `/api/profiles/me` and `/api/profiles` check for the presence and correctness of the `isFirstLogin` flag in the response.

---

## Testing the New Admin Approval System

### Overview
The new admin approval system replaces the old hardcoded email approval with a database-driven approach using MongoDB collections.

### Database Collections
- **`preapproved`**: Stores admin-approved emails with approval status
- **`invitations`**: Tracks invitation history and details
- **`users`**: User profiles and data

### Test Scripts
Run these scripts to test the system:

```bash
# Test admin approval workflow
cd backend
npm run test:admin-approval

# Test authentication flow with admin approval
npm run test:auth-flow
```

### Manual Testing Steps

#### 1. Test Admin Approval Check
```bash
# Check if email is approved (should return false)
curl -X GET "http://localhost:4500/api/auth/preapproved/check?email=test@example.com"

# Check admin email (should return true)
curl -X GET "http://localhost:4500/api/auth/preapproved/check?email=admin@shaadimantra.com"
```

#### 2. Test OTP with Unapproved Email
```bash
# Should fail with "Email not approved for registration"
curl -X POST http://localhost:4500/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### 3. Test Admin API Security
```bash
# Should fail with "Access token required"
curl -X GET http://localhost:4500/api/admin/users
curl -X POST http://localhost:4500/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Expected Behavior
- ✅ Only admin-approved emails can send OTP
- ✅ Admin API endpoints require authentication
- ✅ Paused users cannot login
- ✅ Invitation history is tracked
- ✅ All collections are properly synchronized

---

## First-Time User Onboarding Flow

### Overview
The application implements a comprehensive onboarding system for first-time users with profile completion tracking and navigation restrictions.

### User Status Tracking
The system tracks several key states:
- `isFirstLogin`: Whether the user is logging in for the first time
- `profileCompletion`: Percentage of profile completion (0-100%)
- `hasSeenOnboarding`: Whether the user has seen the onboarding overlay
- `isFirstTimeUser`: Whether the user should be treated as a first-time user

### Onboarding Flow
1. **First Login**: User logs in with OTP verification
2. **Onboarding Overlay**: 15-second animated welcome (only shown once)
3. **Profile Redirect**: User is automatically redirected to `/profile`
4. **Profile Completion**: User fills out required profile fields
5. **Access Restoration**: Full application access after 75% profile completion

### Navigation Restrictions
- **Restricted Routes**: `/dashboard`, `/matches`, `/settings`, `/help`
- **Allowed Routes**: `/profile`, `/`, `/auth`, `/login`, `/logout`
- **Redirect Logic**: Users with less than 75% profile completion are redirected to `/profile`

### Onboarding Persistence
- **One-Time Display**: Onboarding overlay only shows once per user
- **Button Actions**: Both "Let's Get Started" and "Skip for now" mark onboarding as seen
- **Profile Integration**: Completing 75% of profile also marks onboarding as seen
- **Persistent State**: Remembers user's choice across sessions

### Testing the Onboarding Flow

#### 1. First-Time User Journey
```bash
# 1. Login as a new user (or reset existing user's status)
# Set in localStorage:
localStorage.setItem('isFirstLogin', 'true');
localStorage.setItem('profileCompletion', '0');
localStorage.removeItem('hasSeenOnboarding');

# 2. Navigate to dashboard
# Expected: Onboarding overlay appears, then redirect to /profile

# 3. Complete 75% of profile
# Expected: Redirect to dashboard with full access
```

#### 2. Returning User with Incomplete Profile
```bash
# 1. Set user status
localStorage.setItem('isFirstLogin', 'true');
localStorage.setItem('profileCompletion', '30');
localStorage.setItem('hasSeenOnboarding', 'true');

# 2. Navigate to dashboard
# Expected: Direct redirect to /profile (no onboarding overlay)
```

#### 3. Profile Completion Validation
```bash
# Required fields (2x weight):
name, gender, dateOfBirth, height, weight, complexion,
education, occupation, annualIncome, nativePlace, currentResidence,
maritalStatus, father, mother, about

# Optional fields (1x weight):
timeOfBirth, placeOfBirth, manglik, eatingHabit, smokingHabit,
drinkingHabit, brothers, sisters, fatherGotra, motherGotra,
grandfatherGotra, grandmotherGotra, specificRequirements, settleAbroad, interests
```

### LocalStorage Keys
```javascript
// User status tracking
localStorage.setItem('isFirstLogin', 'true/false');
localStorage.setItem('profileCompletion', '0-100');
localStorage.setItem('hasSeenOnboarding', 'true/false');
localStorage.setItem('isFirstTimeUser', 'true/false');

// Authentication
localStorage.setItem('authToken', 'jwt_token');
localStorage.setItem('userRole', 'user/admin');
localStorage.setItem('userEmail', 'user@example.com');
```

### Debugging Onboarding Issues

#### Check User Status
```javascript
// In browser console
console.log('User Status:', {
  isFirstLogin: localStorage.getItem('isFirstLogin'),
  profileCompletion: localStorage.getItem('profileCompletion'),
  hasSeenOnboarding: localStorage.getItem('hasSeenOnboarding'),
  isFirstTimeUser: localStorage.getItem('isFirstTimeUser')
});
```

#### Reset User for Testing
```javascript
// Reset to first-time user state
localStorage.setItem('isFirstLogin', 'true');
localStorage.setItem('profileCompletion', '0');
localStorage.removeItem('hasSeenOnboarding');
localStorage.setItem('isFirstTimeUser', 'true');
```

#### Force Profile Completion
```javascript
// Mark profile as 75% complete
localStorage.setItem('isFirstLogin', 'false');
localStorage.setItem('profileCompletion', '75');
localStorage.setItem('isFirstTimeUser', 'false');
```

### Navigation Guard Behavior
The NavigationGuard component enforces profile completion requirements:
- **Checks**: Profile completion, localStorage values, and API response
- **Redirects**: Users with less than 75% profile completion to `/profile`
- **Logging**: Detailed console logs for debugging

## 🎯 **NEW: Matching System Endpoints**

### **Discovery Endpoints**

#### 1. Get Discovery Profiles
```http
GET /api/matching/discovery?page=1&limit=10
Authorization: Bearer {auth_token}
```

**Response:**
```json
{
  "success": true,
  "profiles": [
    {
      "_id": "user_id",
      "profile": {
        "name": "Priya S.",
        "age": 26,
        "profession": "Software Engineer",
        "images": ["image_url"],
        "about": "About me..."
      },
      "verification": {
        "isVerified": true
      }
    }
  ],
  "dailyLimitReached": false,
  "dailyLikeCount": 2,
  "remainingLikes": 3
}
```

#### 2. Like Profile (Swipe Right)
```http
POST /api/matching/like
Authorization: Bearer {auth_token}
Content-Type: application/json

{
  "targetUserId": "user_id",
  "type": "like"
}
```

**Response:**
```json
{
  "success": true,
  "like": {
    "_id": "like_id",
    "userId": "current_user_id",
    "likedProfileId": "target_user_id",
    "type": "like",
    "isMutualMatch": false
  },
  "isMutualMatch": false,
  "dailyLikeCount": 3,
  "remainingLikes": 2
}
```

#### 3. Pass Profile (Swipe Left)
```http
POST /api/matching/pass
Authorization: Bearer {auth_token}
Content-Type: application/json

{
  "targetUserId": "user_id"
}
```

### **Request Tab Endpoints**

#### 4. Get Liked Profiles
```http
GET /api/matching/liked
Authorization: Bearer {auth_token}
```

**Response:**
```json
{
  "success": true,
  "likedProfiles": [
    {
      "likeId": "like_id",
      "profile": {
        "_id": "user_id",
        "profile": {
          "name": "Priya S.",
          "age": 26,
          "profession": "Software Engineer"
        }
      },
      "likeDate": "2024-12-28T10:30:00Z",
      "type": "like",
      "isMutualMatch": false
    }
  ],
  "totalLikes": 5,
  "mutualMatches": 2
}
```

### **Matches Tab Endpoints**

#### 5. Get Mutual Matches
```http
GET /api/matching/matches
Authorization: Bearer {auth_token}
```

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "connectionId": "connection_id",
      "profile": {
        "_id": "user_id",
        "profile": {
          "name": "Priya S.",
          "age": 26,
          "profession": "Software Engineer"
        }
      },
      "matchDate": "2024-12-28T10:30:00Z",
      "lastActivity": "2024-12-28T10:30:00Z"
    }
  ],
  "totalMatches": 3
}
```

### **Statistics Endpoints**

#### 6. Get Daily Like Statistics
```http
GET /api/matching/stats
Authorization: Bearer {auth_token}
```

**Response:**
```json
{
  "success": true,
  "dailyLikeCount": 3,
  "canLikeToday": true,
  "remainingLikes": 2,
  "dailyLimit": 5
}
```

### **Daily Limit Testing**

#### Test Daily Limit Reached
```bash
# 1. Like 5 profiles
# 2. Try to like a 6th profile
# Expected: 429 status with "Daily like limit reached" message
```

#### Test Daily Limit Reset
```bash
# 1. Wait until midnight (or manually update database)
# 2. Check daily like count
# Expected: dailyLikeCount = 0, canLikeToday = true
```

### **Mutual Match Testing**

#### Test Mutual Match Creation
```bash
# 1. User A likes User B
# 2. User B likes User A
# Expected: 
# - Both likes marked as isMutualMatch = true
# - Connection created with status = 'accepted'
# - Profile appears in both users' Matches tab
```

### **Frontend Integration**

#### Dashboard (Discovery)
- Shows profiles from `/api/matching/discovery`
- Displays daily like count and remaining likes
- Shows "Try again tomorrow" when limit reached
- Handles swipe right (like) and swipe left (pass)

#### Matches Page
- **Request Tab**: Shows liked profiles from `/api/matching/liked`
- **Matches Tab**: Shows mutual matches from `/api/matching/matches`
- Only mutual matches can access chat functionality

#### Chat Activation
- Chat is only enabled for mutual matches
- Uses connection ID for chat room identification
- Mutual matches appear in both users' chat lists
- **Loading**: Shows loading state while checking user status
