# Implementation Plan: Disable Firebase App Verification for Testing

To resolve the issue where real OTPs are being sent despite using test phone numbers, we need to explicitly disable app verification in the Firebase SDK settings.

## 1. Frontend (Web SDK)
**File**: `frontend/src/config/firebase.ts`
**Change**: Set `_auth.settings.appVerificationDisabledForTesting = true` in the `getFirebaseAuth` function.

## 2. Android (Native SDK)
**File**: `android/app/src/main/java/com/shaadimantrana/app/MainActivity.java`
**Change**: Override `onCreate` and call `FirebaseAuth.getInstance().getFirebaseAuthSettings().setAppVerificationDisabledForTesting(true)`.

## 🧪 Verification
1. Run the app in debug mode on Android.
2. Use a test phone number registered in Firebase Console.
3. Verify that the pre-configured test code works without an SMS being sent.
