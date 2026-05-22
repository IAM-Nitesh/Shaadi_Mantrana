# Admin Flow: Phone-Based Invitations & Profile Picture Fallback

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize admin workflows to support phone-based invitations as primary, handle missing profile pictures gracefully, and remove email visibility from admin UI screens while keeping email as backend-only for sending invites.

**Architecture:** 
- **Task A (Invite Flow)**: Extend `/admin/users` POST endpoint to accept `phoneNumber` as primary. Email remains optional for sending invites.
- **Task B (Admin UI)**: Hide email fields from all admin-facing screens; use phone as display identifier. Email stored but not shown.
- **Task C (Profile Picture)**: Return 200 with placeholder URL when picture missing; frontend displays default avatar; admin user list never blocks.

**Tech Stack:** 
- Node.js Express (backend routes + services)
- Next.js 15 (frontend admin components)
- MongoDB (User schema)
- B2 Cloud Storage (profile picture service)

---

## Task 1: Extend Backend User Creation to Accept Phone Number

**Files:**
- Modify: `backend/src/routes/adminRoutes.js` (POST /admin/users endpoint)
- Modify: `backend/src/models/User.js` (add phoneNumber field if missing)
- Modify: `backend/src/services/inviteEmailService.js` (handle optional email)

**Context:**
Currently, admin creates users via `/admin/users` POST with only email. We need to accept `phoneNumber` as primary identifier and make email optional (used only for sending invites, not required for user creation).

- [ ] **Step 1: Read current User schema**

```bash
grep -A 20 "phoneNumber\|phone" backend/src/models/User.js | head -30
```

Expected: Check if phoneNumber field already exists.

- [ ] **Step 2: Add phoneNumber field to User schema (if missing)**

If not present, add:
```javascript
phoneNumber: {
  type: String,
  sparse: true,
  unique: true,
  match: /^\+?[1-9]\d{1,14}$/,
  required: false
},
```

**Test: Verify schema accepts both email and phone.**

- [ ] **Step 3: Extend adminRoutes.js POST /admin/users**

Modify the endpoint to:
```javascript
const { email, phoneNumber } = req.body;

// Require at least one: phone (primary) or email (secondary)
if (!phoneNumber && !email) {
  return res.status(400).json({
    success: false,
    error: 'Either phoneNumber or email is required'
  });
}

// If phoneNumber provided, validate format
if (phoneNumber) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format'
    });
  }
}

// Check if user with phone already exists (if phone provided)
if (phoneNumber) {
  const existingUserByPhone = await User.findOne({ phoneNumber });
  if (existingUserByPhone) {
    return res.status(409).json({
      success: false,
      error: 'User with this phone number already exists'
    });
  }
}

// Create user with phone as primary
const newUser = new User({
  phoneNumber: phoneNumber || null,
  email: email ? email.toLowerCase().trim() : null,
  // ... rest of user fields
});
```

**Test:** POST request with `{ phoneNumber: "+919876543210" }` should create user without email.

- [ ] **Step 4: Update invite email service to handle optional email**

Modify `backend/src/services/inviteEmailService.js`:
```javascript
async sendInviteEmail(email, userUuid) {
  // If email is null/undefined, return success but no email sent
  if (!email) {
    return {
      success: true,
      inviteLink: `${process.env.FRONTEND_URL}/accept-invite/${userUuid}`,
      message: 'User created. Email not provided; invite link available.',
      emailSent: false
    };
  }
  
  // Normal email sending flow
  // ... existing code
}
```

**Test:** Calling `sendInviteEmail(null, userUuid)` should not throw error.

- [ ] **Step 5: Run unit tests for new endpoint**

```bash
npm run test:backend -- --testNamePattern="admin.*create.*user"
```

Expected: Tests pass for phone-only, email-only, and both phone+email scenarios.

---

## Task 2: Update Admin Users Endpoint to Hide Email

**Files:**
- Modify: `backend/src/routes/adminRoutes.js` (GET /admin/users endpoint response)

**Context:**
The GET `/admin/users` endpoint currently returns email in the response. We need to either omit it or mark it as internal-only (not sent to frontend).

- [ ] **Step 1: Locate GET /admin/users endpoint**

```bash
grep -n "router.get.*'/users'" backend/src/routes/adminRoutes.js
```

- [ ] **Step 2: Update response transformation**

Change the response object to exclude email and use phone as identifier:
```javascript
const transformedUsers = allUsers.map(user => {
  return {
    _id: user._id,
    userUuid: user.userUuid,
    phoneNumber: user.phoneNumber || 'No phone', // Primary identifier
    // email removed - kept internal only
    firstName: user.profile?.name?.split(' ')[0] || '',
    lastName: user.profile?.name?.split(' ').slice(1).join(' ') || '',
    fullName: user.profile?.name || '',
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastActive: user.lastActive,
    approvedByAdmin: user.isApprovedByAdmin,
    isPending: false,
    profileCompleted: user.profileCompleted,
    profileCompleteness: user.profile?.profileCompleteness || 0,
    // ... other fields
  };
});
```

**Test:** GET `/admin/users` response should NOT contain `email` field.

- [ ] **Step 3: Run GET /admin/users and verify**

```bash
# Local test or curl to backend
curl -H "Authorization: Bearer <admin-token>" https://api.shaadimantrana.live/admin/users | jq '.users[0]'
```

Expected: Response has `phoneNumber` but no `email` field.

---

## Task 3: Update Frontend Admin Screens to Remove Email Display

**Files:**
- Modify: `frontend/src/app/admin/users/page.tsx` (users list component)
- Modify: `frontend/src/app/admin/email-invitations/page.tsx` (invitations screen)
- Modify: `frontend/src/app/admin/moderation/page.tsx` (if showing user emails)
- Modify: `frontend/src/components/AdminNavigation.tsx` (ensure no email fields in forms)

**Context:**
Admin-facing screens currently display email. We need to hide email and show phone as primary identifier instead.

- [ ] **Step 1: Find and read admin users page**

```bash
find frontend/src -name "*users*" -o -name "*admin*" | grep -E "\.tsx?$"
```

- [ ] **Step 2: Update users list table (remove email column, add phone)**

```typescript
// Before: columns = ['email', 'name', 'status', ...]
// After:
columns = [
  { key: 'phoneNumber', label: 'Phone', render: (phone) => phone || 'N/A' },
  { key: 'fullName', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'profileCompleteness', label: 'Profile %' },
  // email removed
];
```

**Test:** Admin users page displays phone numbers instead of emails.

- [ ] **Step 3: Update invite modal/form (accept phone number)**

If there's an "Add User" modal/form in admin panel:
```typescript
// Remove: <input name="email" ... />
// Add:
<input 
  name="phoneNumber" 
  placeholder="+919876543210"
  pattern="^\+?[1-9]\d{1,14}$"
  required
/>
```

**Test:** Can submit form with phone number only.

- [ ] **Step 4: Update API call to send phone instead of email**

```typescript
// Before:
const response = await apiClient.post('/admin/users', { 
  email: formData.email 
});

// After:
const response = await apiClient.post('/admin/users', { 
  phoneNumber: formData.phoneNumber 
});
```

**Test:** Admin can create user with phone number via UI.

---

## Task 4: Fix Profile Picture 400 Error with Graceful Fallback

**Files:**
- Modify: `backend/src/controllers/uploadController.js` (getProfilePictureUrl method)
- Modify: `frontend/src/components/AdminBottomNavigation.tsx` (profile picture handling)
- Modify: `frontend/src/` (any component displaying user profiles)

**Context:**
Currently, when admin clicks "Users" and a user has no profile picture, the endpoint returns 404 with `PROFILE_PICTURE_NOT_FOUND`. Frontend should handle this gracefully by showing a placeholder image, and the admin users list should never block.

- [ ] **Step 1: Update backend getProfilePictureUrl to return default URL on 404**

```javascript
async getProfilePictureUrl(req, res) {
  const { userId } = req.params;
  const b2Storage = new B2StorageService();
  
  try {
    const exists = await b2Storage.profilePictureExists(userId);
    
    if (!exists) {
      // Return default placeholder instead of 404
      return res.status(200).json({
        success: true,
        data: {
          url: process.env.DEFAULT_PROFILE_PICTURE_URL || '/images/default-avatar.png',
          isDefault: true,
          userId: userId
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Normal signed URL for existing picture
    const signedUrl = await b2Storage.getSignedUrl(userId, parseInt(expiry));
    res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        isDefault: false,
        userId: userId
      }
    });
  } catch (error) {
    // Even on error, return default instead of failing
    res.status(200).json({
      success: true,
      data: {
        url: process.env.DEFAULT_PROFILE_PICTURE_URL || '/images/default-avatar.png',
        isDefault: true,
        error: error.message
      }
    });
  }
}
```

**Test:** GET `/profile-picture/user123/url` should return 200 with default image URL if user has no picture.

- [ ] **Step 2: Update frontend image component to handle isDefault flag**

```typescript
<img 
  src={profileData?.data?.url} 
  alt="Profile"
  onError={(e) => {
    e.target.src = '/images/default-avatar.png';
  }}
  className="rounded-full w-12 h-12"
/>
```

**Test:** If profile picture URL is invalid, image shows default avatar without breaking page.

- [ ] **Step 3: Update admin users list to handle missing pictures**

Ensure the users list component never calls picture endpoint without fallback:
```typescript
const getPictureUrl = async (userId) => {
  try {
    const response = await fetch(`/api/profile-picture/${userId}/url`);
    const data = await response.json();
    return data.data?.url || '/images/default-avatar.png';
  } catch (error) {
    return '/images/default-avatar.png';
  }
};
```

**Test:** Admin users page loads and displays all users with their pictures (or default avatar if missing).

- [ ] **Step 4: Verify admin navigation doesn't break**

Open admin dashboard → Click "Users" → Should load list of users with pictures/avatars, no 400 errors.

**Test:** Admin users page loads successfully even if zero users have profile pictures.

---

## Task 5: Update AdminNavigation.tsx to Support Phone Field

**Files:**
- Modify: `frontend/src/components/AdminNavigation.tsx`

**Context:**
Navigation component shows user information. If it displays user email, update it to show phone instead (or omit user info entirely).

- [ ] **Step 1: Read AdminNavigation.tsx**

```bash
grep -n "email\|user\." frontend/src/components/AdminNavigation.tsx
```

- [ ] **Step 2: Remove email references (if any)**

If it shows `user.email`, replace with `user.phoneNumber`.

- [ ] **Step 3: Add logout functionality with fallback**

Ensure navigation handles case where admin hasn't uploaded profile picture:
```typescript
<img
  src={user.profilePictureUrl || '/images/default-avatar.png'}
  alt={user.name}
  className="w-8 h-8 rounded-full"
/>
```

---

## Task 6: Update Invitation Email Service (Optional Field)

**Files:**
- Modify: `backend/src/services/inviteEmailService.js`

**Context:**
Invite email service should gracefully handle null/undefined email addresses.

- [ ] **Step 1: Check current inviteEmailService implementation**

```bash
head -50 backend/src/services/inviteEmailService.js
```

- [ ] **Step 2: Add null-check**

```javascript
async sendInviteEmail(email, userUuid) {
  if (!email) {
    logger.info(`Invite created for userUuid ${userUuid} without email`);
    return {
      success: true,
      inviteLink: `${process.env.FRONTEND_URL}/accept-invite/${userUuid}`,
      emailSent: false,
      message: 'Invite link generated. Email not sent (no email provided).'
    };
  }
  
  // ... normal email sending
}
```

---

## Task 7: Comprehensive Backend Testing

**Files:**
- Create: `backend/tests/admin-phone-flow.test.js`

**Context:**
Write E2E tests for new phone-based admin flow.

- [ ] **Step 1: Write test for create user with phone only**

```javascript
test('Admin can create user with phone number only', async () => {
  const res = await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      phoneNumber: '+919876543210'
    });
  
  expect(res.status).toBe(201);
  expect(res.body.user.phoneNumber).toBe('+919876543210');
  expect(res.body.user.email).toBeUndefined();
});
```

- [ ] **Step 2: Write test for invalid phone format**

```javascript
test('Admin cannot create user with invalid phone', async () => {
  const res = await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      phoneNumber: 'invalid'
    });
  
  expect(res.status).toBe(400);
});
```

- [ ] **Step 3: Run tests**

```bash
npm run test:backend
```

Expected: All tests pass.

---

## Task 8: End-to-End Verification

**Files:** None (verification only)

**Context:**
Test the complete flow in production/staging.

- [ ] **Step 1: Admin login**

Navigate to https://www.shaadimantrana.live/admin/dashboard

- [ ] **Step 2: Add new user via admin panel**

Click "Invitations" → "Add User" → Enter phone number (+919876543210) → Submit

- [ ] **Step 3: Verify phone displayed (not email)**

Check users list → Should show phone number, NOT email

- [ ] **Step 4: Click on user → Load profile**

Should not show 400 error for missing profile picture; should show default avatar

- [ ] **Step 5: Test graceful fallback**

If user has no picture, should see default avatar (not broken image)

- [ ] **Step 6: Test resend invite**

If admin clicks "Resend Invite", should work (should resend to email if email exists, or just log success if no email)

---

## Devil's Advocate Block

**The most likely way this change is wrong:**
- Phone number format validation too strict → rejects valid international formats → admin cannot add users from other countries
- Default profile picture URL not configured in environment → Shows 500 error instead of graceful fallback
- Email field completely removed from backend but other services still expect it → Contract breaks with notification service
- Phone number duplicate check doesn't handle null values → Creates multiple users with phoneNumber=null

**The most dangerous silent assumption:**
- Assuming phone is unique identifier like email was → Phone could be null, multiple users could have null phone → Need `sparse: true` and `unique: true` in MongoDB
- Assuming all admins understand to use phone instead of email → No migration message; old admins try email field and get confused
- Assuming no existing code paths expect email to always exist → Email validation might fail in onboarding or profile setup
- Assuming default avatar URL is always accessible → If URL breaks, entire admin panel fails to load user list

---

## Implementation Priority & Risk

| Task | Priority | Risk | Mitigation |
|------|----------|------|-----------|
| 1: Backend phone field | **HIGH** | Phone format regex too strict | Test international formats: +1234567890, +919876543210, +441234567890 |
| 2: Backend response hiding email | **MEDIUM** | Breaks existing API consumers | Check if mobile app or external integrations depend on email field |
| 3: Frontend hide email | **MEDIUM** | Email still in localStorage/cookies | Verify authentication state doesn't rely on email |
| 4: Profile picture fallback | **HIGH** | Default URL misconfigured | Set `DEFAULT_PROFILE_PICTURE_URL` in `.env` before deploying |
| 5: AdminNavigation update | **LOW** | UI inconsistency | Test on desktop and mobile |
| 6: Invite service null handling | **LOW** | Email sending breaks | Test `sendInviteEmail(null, uuid)` doesn't throw |
| 7: Tests | **HIGH** | Untested code path | Write tests BEFORE implementation |
| 8: E2E verification | **CRITICAL** | False positive pass | Test in staging, not production |

---

## Rollback Plan

If anything breaks:

1. **Database**: Phone field is optional (sparse), so no migration needed
2. **API**: Old email field still works; phone is additive, not breaking
3. **Frontend**: Remove phone from UI, restore email display
4. **If critical**: `git revert <commit-hash>`

---

## Continuous Learning Capture (After Implementation)

```bash
./scripts/learn.sh \
  "Phone-Based Admin Invitations & Profile Picture Fallback" \
  "Replaced email-centric admin flow with phone as primary identifier. Made email optional (used only for sending invites, not displayed). Implemented graceful profile picture fallback (default avatar on missing pictures). All admin screens updated to hide email while keeping it in backend. Phone validation uses international E.164 format. Default avatar sourced from DEFAULT_PROFILE_PICTURE_URL env var." \
  "Admin/Auth/Security" \
  "Review after 2 weeks for user feedback on phone vs email UX. Check for any hidden email field leakage in logs."
```

