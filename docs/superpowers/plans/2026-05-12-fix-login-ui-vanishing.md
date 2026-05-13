# Plan: Stabilizing Login UI & Auth States

## 1. AuthContext Remediation
- **File**: `frontend/src/contexts/AuthContext.tsx`
- **Change**: Set initial `isLoading` to `true`.
- **Change**: Remove `setIsLoading` calls from `signInWithPhone`, `confirmPhoneCode`, `login`, `sendOtp`, and `logout`. 
- **Rationale**: These are user-triggered actions, not app-level initialization. Components should handle their own local loading states to prevent global UI unmounts.

## 2. LoginForm Optimization
- **File**: `frontend/src/components/LoginForm.tsx`
- **Change**: Ensure `isSendingOTP` and `isVerifyingOTP` are used for all local button states.
- **Change**: Add a safety check for the `recaptcha-container` before initializing Firebase.

## 3. LoginPage Resilience
- **File**: `frontend/src/app/login/page.tsx`
- **Change**: Wrap GSAP `set` calls in a check that ensures the timeline will actually execute, or move them to a more resilient mounting pattern.

## 4. Verification
- **T1**: Verify that clicking "Get Verification Code" does NOT trigger the full-page HeartbeatLoader.
- **T2**: Verify that the login form remains visible until the user is actually redirected to the dashboard.
