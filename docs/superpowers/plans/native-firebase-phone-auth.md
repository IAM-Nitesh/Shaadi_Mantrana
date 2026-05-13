# Plan: Dual-Path Firebase Phone Auth (Web + Native Android)

## Goal
Fix login for both:
- Web browser → Firebase Web SDK + ReCAPTCHA (already works once domain is authorized)
- Android Capacitor app → @capacitor-firebase/authentication (native, no ReCAPTCHA)

## Steps

### Step 1 — Install plugin (USER runs this)
```bash
cd frontend && npm install @capacitor-firebase/authentication
npx cap sync android
```

### Step 2 — Android build.gradle
Add native Firebase Auth dependency to android/app/build.gradle

### Step 3 — AuthContext.tsx
Branch signInWithPhone() and confirmPhoneCode() between native/web paths using Capacitor.isNativePlatform()

### Step 4 — firebase.ts
Keep web SDK init but guard against SSR

### Step 5 — Verify
- Web: npm run dev:frontend → login in browser
- Android: npx cap run android → login in APK
