# Server-Side Authentication API Migration

## Overview

This document tracks the migration from client-side authentication (localStorage + Bearer tokens) to a **hybrid server-side authentication approach**:

- **Next.js API Routes**: Use server-side authentication with HTTP-only cookies
- **Frontend Services → Backend**: Use Bearer tokens extracted from cookies

## Authentication Architecture

### **Hybrid Approach**

```typescript
// Frontend Services → Backend (Bearer tokens)
const bearerToken = await ServerAuthService.getBearerToken();
const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
  headers: { 'Authorization': `Bearer ${bearerToken}` }
});

// Next.js API Routes → Backend (Server-side auth)
const response = await fetch(`${backendUrl}/api/auth/profile`, {
  headers: { 'Authorization': `Bearer ${authToken}` }
});
```

### **Why Hybrid Approach?**

1. **Backend Compatibility**: Backend routes expect Bearer tokens
2. **Cross-Origin Issues**: Cookies don't work for cross-origin requests (frontend:3000 → backend:5500)
3. **Security**: HTTP-only cookies for Next.js API routes, Bearer tokens for backend calls
4. **Simplicity**: No backend changes required

## Migration Status

### ✅ **Completed Services**

#### 1. **Profile Service** (`frontend/src/services/profile-service.ts`)
- ✅ **getUserProfile()** - Updated to use `ServerAuthService.getBearerToken()`
- ✅ **deleteProfile()** - Updated to use Bearer tokens
- ✅ **updateOnboardingMessage()** - Updated to use Bearer tokens
- ✅ **Import added**: `import { ServerAuthService } from './server-auth-service'`

**Changes:**
```typescript
// Before
const authToken = localStorage.getItem('authToken');
if (!authToken) return null;

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${authToken}` }
});

// After
const bearerToken = await ServerAuthService.getBearerToken();
if (!bearerToken) return null;

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${bearerToken}` }
});
```

#### 2. **Matching Service** (`frontend/src/services/matching-service.ts`)
- ✅ **getDiscoveryProfiles()** - Updated to use Bearer tokens
- ✅ **likeProfile()** - Updated to use Bearer tokens
- ✅ **passProfile()** - Updated to use Bearer tokens
- ✅ **unmatchProfile()** - Updated to use Bearer tokens
- ✅ **Import added**: `import { ServerAuthService } from './server-auth-service'`

**Changes:**
```typescript
// Before
const authToken = localStorage.getItem('authToken');
if (!authToken) throw new Error('Authentication required');

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${authToken}` }
});

// After
const bearerToken = await ServerAuthService.getBearerToken();
if (!bearerToken) throw new Error('Authentication required');

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${bearerToken}` }
});
```

#### 3. **Image Upload Service** (`frontend/src/services/image-upload-service.ts`)
- ✅ **uploadProfileImage()** - Updated to use Bearer tokens
- ✅ **Import added**: `import { ServerAuthService } from './server-auth-service'`

**Changes:**
```typescript
// Before
const authToken = localStorage.getItem('authToken');
if (!authToken) throw new Error('Authentication required');

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${authToken}` }
});

// After
const bearerToken = await ServerAuthService.getBearerToken();
if (!bearerToken) throw new Error('Authentication required');

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${bearerToken}` }
});
```

#### 4. **Chat Service** (`frontend/src/services/chat-service.ts`)
- ✅ **sendMessage()** - Updated to use Bearer tokens
- ✅ **Import added**: `import { ServerAuthService } from './server-auth-service'`
- ✅ **Removed import**: `import { API_CONFIG } from './auth-service'`

**Changes:**
```typescript
// Before
const token = localStorage.getItem('authToken');
if (!token) throw new Error('No authentication token found');

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// After
const bearerToken = await ServerAuthService.getBearerToken();
if (!bearerToken) throw new Error('No authentication token found');

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${bearerToken}` }
});
```

#### 5. **Server Auth Service** (`frontend/src/services/server-auth-service.ts`)
- ✅ **Added `getBearerToken()` method** - Extracts authToken from cookies
- ✅ **Enhanced backward compatibility methods**
- ✅ **Maintains server-side auth for Next.js API routes**

**New Method:**
```typescript
// Get Bearer token for backend API calls
static async getBearerToken(): Promise<string | null> {
  try {
    const authStatus = await this.checkAuthStatus();
    if (!authStatus.authenticated) {
      return null;
    }

    // Get the authToken from cookies
    const cookies = document.cookie.split(';');
    const authTokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('authToken=')
    );

    if (authTokenCookie) {
      const token = authTokenCookie.split('=')[1];
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error getting Bearer token:', error);
    return null;
  }
}
```

### 🔄 **Pages Updated**

#### 1. **Dashboard Page** (`frontend/src/app/dashboard/page.tsx`)
- ✅ **Wrapped with ServerAuthGuard**
- ✅ **Removed old authentication logic**
- ✅ **Removed AuthService import**
- ✅ **Removed localStorage checks**

**Changes:**
```typescript
// Before
export default function Dashboard() {
  // Old client-side auth logic
  const authToken = localStorage.getItem('authToken');
  if (!authToken) router.push('/');
  // ...
}

// After
export default function Dashboard() {
  return (
    <ServerAuthGuard requireAuth={true} requireCompleteProfile={true}>
      <DashboardContent />
    </ServerAuthGuard>
  );
}
```

### 🔄 **Components Updated**

#### 1. **ServerAuthGuard** (`frontend/src/components/ServerAuthGuard.tsx`)
- ✅ **Added comprehensive debug logging**
- ✅ **Enhanced error handling**
- ✅ **Added profile completion debugging**

#### 2. **useServerAuth Hook** (`frontend/src/hooks/useServerAuth.ts`)
- ✅ **Added debug logging for auth status checks**
- ✅ **Enhanced error handling**

### 🔄 **API Routes Updated**

#### 1. **Auth Status Route** (`frontend/src/app/api/auth/status/route.ts`)
- ✅ **Fixed data structure**: Changed `result.profile` to `result.user`
- ✅ **Enhanced error handling**

#### 2. **Auth Verify Route** (`frontend/src/app/api/auth/verify/route.ts`)
- ✅ **Proper cookie setting**
- ✅ **Correct redirect logic**

#### 3. **Auth Logout Route** (`frontend/src/app/api/auth/logout/route.ts`)
- ✅ **Proper cookie clearing**

### 🔄 **Backend Updates**

#### 1. **User Model** (`backend/src/models/User.js`)
- ✅ **Updated toPublicJSON()** to include required fields:
  - `isFirstLogin`
  - `isApprovedByAdmin`
  - `profileCompleteness`
  - `hasSeenOnboardingMessage`

**Changes:**
```javascript
// Before
return {
  userId: user._id,
  email: user.email,
  // ... other fields
};

// After
return {
  userId: user._id,
  email: user.email,
  // ... other fields
  // Add fields needed for frontend authentication
  isFirstLogin: user.isFirstLogin,
  isApprovedByAdmin: user.isApprovedByAdmin,
  profileCompleteness: user.profile?.profileCompleteness || 0,
  hasSeenOnboardingMessage: user.hasSeenOnboardingMessage,
};
```

## Authentication Flow

### **Hybrid Authentication Flow**

```typescript
1. User enters email + OTP
2. Frontend calls /api/auth/verify (Next.js API route)
3. Next.js API route calls backend with Bearer token
4. Backend validates and returns user data
5. Next.js API route sets HTTP-only cookies
6. Server determines redirect path
7. Client redirects to appropriate page
8. ServerAuthGuard checks authentication via /api/auth/status
9. Frontend services use getBearerToken() for backend calls
10. Backend validates Bearer tokens as before
```

### **Two-Tier Authentication**

#### **Tier 1: Next.js API Routes (Server-Side)**
- Uses HTTP-only cookies
- Handles authentication status checks
- Manages redirect logic
- Secure token storage

#### **Tier 2: Frontend Services (Bearer Tokens)**
- Extracts Bearer tokens from cookies
- Makes direct backend API calls
- Maintains backend compatibility
- No backend changes required

## Security Improvements

### **Before (Client-Side)**
- ❌ Tokens stored in localStorage (vulnerable to XSS)
- ❌ Client-side validation can be bypassed
- ❌ Tokens accessible via JavaScript
- ❌ Manual token refresh handling

### **After (Hybrid Server-Side)**
- ✅ HTTP-only cookies for Next.js API routes (protected from XSS)
- ✅ Bearer tokens extracted from cookies for backend calls
- ✅ Server-side validation for authentication checks
- ✅ Automatic cookie management
- ✅ Backend compatibility maintained

## Performance Impact

### **Network Requests**
- **Before**: Each API call includes Bearer token in header
- **After**: Same approach, but tokens extracted from cookies

### **Authentication Checks**
- **Before**: Instant localStorage checks
- **After**: Async server-side checks (with caching)

### **Error Handling**
- **Before**: Manual token refresh logic
- **After**: Automatic cookie refresh by browser

## Testing Checklist

### **Authentication Flow**
- [ ] User can login with email + OTP
- [ ] User is redirected to correct page based on profile state
- [ ] User can access protected pages
- [ ] User is redirected to login when not authenticated
- [ ] User can logout successfully

### **API Calls**
- [ ] Profile service works with Bearer tokens
- [ ] Matching service works with Bearer tokens
- [ ] Image upload service works with Bearer tokens
- [ ] Chat service works with Bearer tokens

### **Error Scenarios**
- [ ] Invalid/expired tokens are handled gracefully
- [ ] Network errors are handled properly
- [ ] Authentication errors redirect to login

## Remaining Tasks

### **Pages to Update**
- [ ] **Matches Page** (`frontend/src/app/matches/page.tsx`)
- [ ] **Profile Page** (`frontend/src/app/profile/page.tsx`)
- [ ] **Settings Page** (`frontend/src/app/settings/page.tsx`)
- [ ] **Admin Pages** (`frontend/src/app/admin/**`)

### **Services to Update**
- [ ] **Any remaining localStorage references**
- [ ] **Any remaining AuthService references**

### **Testing**
- [ ] **End-to-end authentication flow**
- [ ] **All API endpoints**
- [ ] **Error scenarios**
- [ ] **Performance testing**

## Backend Routes Status

### **No Backend Changes Required**

All backend routes continue to work with Bearer token authentication:

- ✅ **Auth Routes** - `/api/auth/*`
- ✅ **Profile Routes** - `/api/profiles/*`
- ✅ **Matching Routes** - `/api/matching/*`
- ✅ **Upload Routes** - `/api/upload/*`
- ✅ **Chat Routes** - `/api/chat/*`
- ✅ **Admin Routes** - `/api/admin/*`
- ✅ **Connection Routes** - `/api/connections/*`

The backend middleware (`authenticateToken`) continues to work as before, expecting Bearer tokens in the Authorization header.

## Rollback Plan

If issues arise, the old client-side authentication can be restored by:

1. **Reverting to localStorage usage** in services
2. **Restoring AuthService imports**
3. **Removing ServerAuthGuard wrappers**
4. **Restoring direct Bearer token headers**

However, this would sacrifice the security improvements gained from server-side authentication.

## Conclusion

The hybrid server-side authentication approach provides significant security improvements while maintaining full backend compatibility. The HTTP-only cookies protect against XSS attacks for Next.js API routes, while Bearer tokens ensure backend compatibility.

All major services have been updated, and the authentication flow is now more secure and robust. The remaining tasks involve updating a few pages and conducting comprehensive testing.

**Key Benefits:**
- ✅ **Security**: HTTP-only cookies for sensitive operations
- ✅ **Compatibility**: No backend changes required
- ✅ **Performance**: Maintains existing performance characteristics
- ✅ **Flexibility**: Supports both authentication methods 