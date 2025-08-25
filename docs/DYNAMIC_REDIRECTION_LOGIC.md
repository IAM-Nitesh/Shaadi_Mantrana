# Dynamic Redirection Logic & Access Control System

## 🎯 **Overview**

This document outlines the comprehensive dynamic redirection logic and access control system implemented for Shaadi Mantra, ensuring proper user onboarding and feature access based on profile completion status.

## 🔐 **Access Control Logic**

### **Core Principle**
Users should only be allowed to access `/dashboard` and `/matches` if their profile completion (`profile.profileCompleteness`) is 100%.

### **User Flags Management**
The system uses the following flags in the MongoDB User document:

```javascript
{
  isFirstLogin: boolean,              // Tracks first-time users
  hasSeenOnboardingMessage: boolean,  // Prevents duplicate onboarding messages
  profileCompleted: boolean,          // Legacy flag (deprecated)
  profile: {
    profileCompleteness: number       // 0-100, determines access rights
  }
}
```

## 🚦 **Redirection Rules**

### **Case 1: First-Time User (`isFirstLogin: true`)**
- **Action**: Always redirect to `/profile`
- **Reason**: New users must complete onboarding
- **Logic**: `if (isFirstLogin) return '/profile'`

### **Case 2: Returning User with Incomplete Profile (`profileCompleteness < 100`)**
- **Action**: Redirect to `/profile`
- **Reason**: Profile must be 100% complete to access features
- **Logic**: `if (profileCompleteness < 100) return '/profile'`

### **Case 3: User with Complete Profile (`profileCompleteness >= 100`)**
- **Action**: Allow access to `/dashboard` and `/matches`
- **Reason**: User has completed all requirements
- **Logic**: `if (profileCompleteness >= 100) return '/dashboard'`

### **Case 4: Admin Users**
- **Action**: Redirect to `/admin/dashboard`
- **Reason**: Admins have different access patterns
- **Logic**: `if (user.role === 'admin') return '/admin/dashboard'`

### **Case 5: Unapproved Users**
- **Action**: Redirect to home with error
- **Reason**: Account paused or not approved
- **Logic**: `if (!isApprovedByAdmin) return '/?error=account_paused'`

## 🎨 **Onboarding Experience**

### **Onboarding Message Display**
The onboarding message is shown only once per user based on these conditions:

```javascript
shouldShowOnboardingMessage(user) {
  return user.isFirstLogin && 
         !user.hasSeenOnboardingMessage && 
         (user.profileCompleteness || 0) < 100;
}
```

### **Flag Management**
- **`hasSeenOnboardingMessage`**: Set to `true` when user dismisses onboarding message
- **`isFirstLogin`**: Set to `false` when profile reaches 100% completion
- **`profileCompleteness`**: Calculated automatically based on filled fields

## 🔧 **Implementation Details**

### **Backend API Endpoints**

#### **Profile Flag Management**
```javascript
// Update onboarding message flag
PUT /api/profile/onboarding-flag
Body: { hasSeenOnboardingMessage: boolean }

// Update first login flag
PUT /api/profile/first-login-flag
Body: { isFirstLogin: boolean }
```

#### **Auth Status API**
```javascript
GET /api/auth/status
Response: {
  authenticated: boolean,
  user: {
    isFirstLogin: boolean,
    hasSeenOnboardingMessage: boolean,
    profileCompleteness: number,
    isApprovedByAdmin: boolean,
    role: string
  },
  redirectTo: string | null
}
```

### **Frontend Services**

#### **OnboardingService**
```typescript
class OnboardingService {
  // Update onboarding flag
  static async updateOnboardingFlag(hasSeenOnboardingMessage: boolean)
  
  // Update first login flag
  static async updateFirstLoginFlag(isFirstLogin: boolean)
  
  // Mark onboarding message as seen
  static async markOnboardingMessageSeen()
  
  // Mark user as not first login
  static async markProfileCompleted()
  
  // Check if user should see onboarding message
  static shouldShowOnboardingMessage(user: any): boolean
  
  // Check if user can access restricted features
  static canAccessRestrictedFeatures(user: any): boolean
  
  // Get appropriate redirect path
  static getRedirectPath(user: any): string | null
}
```

### **Navigation Components**

#### **Access Control in Navigation**
```typescript
// Check if user can access restricted features
const canAccess = user.profileCompleteness >= 100;
const isDisabled = isRestrictedRoute && !canAccess;

// Show appropriate message
const message = isFirstLogin 
  ? 'Please complete the onboarding process first' 
  : 'Please complete your profile to access this feature';
```

## 📊 **Profile Completion Calculation**

### **Required Fields (31 fields total)**
Each field contributes equally to the 100% completion:

1. **Basic Information**: name, gender, dateOfBirth, height, weight, complexion
2. **Professional**: education, occupation, annualIncome
3. **Location**: nativePlace, currentResidence
4. **Personal**: maritalStatus, father, mother, about
5. **Birth Details**: timeOfBirth, placeOfBirth, manglik
6. **Lifestyle**: eatingHabit, smokingHabit, drinkingHabit
7. **Family**: brothers, sisters, fatherGotra, motherGotra, grandfatherGotra, grandmotherGotra
8. **Preferences**: specificRequirements, settleAbroad
9. **Media**: images, interests

### **Calculation Logic**
```javascript
const calculateProfileCompletion = (profile) => {
  const requiredFields = [/* 31 fields */];
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    if (profile[field] && profile[field].toString().trim() !== '') {
      completedFields += 1;
    }
  });
  
  return Math.min(100, Math.round((completedFields / requiredFields.length) * 100));
};
```

## 🔄 **User Journey Flow**

### **New User Registration**
1. User registers → `isFirstLogin: true`, `hasSeenOnboardingMessage: false`
2. Redirected to `/profile` (Case 1)
3. Shows onboarding message (first time only)
4. User fills profile → `profileCompleteness` increases
5. At 100% → `isFirstLogin: false`, redirect to `/dashboard`

### **Returning User with Incomplete Profile**
1. User logs in → `profileCompleteness < 100`
2. Redirected to `/profile` (Case 2)
3. No onboarding message (already seen)
4. User completes profile → `profileCompleteness = 100`
5. `isFirstLogin: false`, redirect to `/dashboard`

### **Returning User with Complete Profile**
1. User logs in → `profileCompleteness = 100`
2. Direct access to `/dashboard` and `/matches` (Case 3)
3. Full feature access granted

## 🛡️ **Security Considerations**

### **Authentication Checks**
- All API endpoints require valid JWT token
- User authorization verified for each request
- Admin approval status checked before access

### **Data Validation**
- Input sanitization for all user data
- Profile completion calculation validated
- Flag updates require authentication

### **Error Handling**
- Graceful fallbacks for API failures
- User-friendly error messages
- Logging for debugging and monitoring

## 📈 **Monitoring & Analytics**

### **Key Metrics**
- Profile completion rates
- Onboarding message engagement
- User journey conversion rates
- Access control violations

### **Logging**
```javascript
console.log('🔍 Auth Status - User flags:', {
  isFirstLogin,
  profileCompleteness,
  hasSeenOnboardingMessage,
  profileCompleted,
  isApprovedByAdmin: user.isApprovedByAdmin
});
```

## 🚀 **Future Enhancements**

### **Planned Improvements**
1. **Progressive Profile Completion**: Allow partial access based on completion tiers
2. **Onboarding A/B Testing**: Test different onboarding flows
3. **Analytics Dashboard**: Track user journey metrics
4. **Mobile-Specific Onboarding**: Optimize for mobile experience

### **Performance Optimizations**
1. **Caching**: Cache user flags to reduce API calls
2. **Lazy Loading**: Load profile data on demand
3. **Background Updates**: Update flags in background

## ✅ **Testing Checklist**

### **Access Control Tests**
- [ ] First-time user redirected to profile
- [ ] Incomplete profile user redirected to profile
- [ ] Complete profile user can access dashboard/matches
- [ ] Admin users redirected to admin dashboard
- [ ] Unapproved users see error message

### **Onboarding Tests**
- [ ] Onboarding message shown only once
- [ ] Flag updates work correctly
- [ ] Profile completion triggers flag updates
- [ ] Navigation blocks work as expected

### **Edge Cases**
- [ ] Network failures handled gracefully
- [ ] Invalid data doesn't break system
- [ ] Concurrent flag updates handled
- [ ] Session expiration handled properly

