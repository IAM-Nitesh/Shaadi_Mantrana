# Play Store & Firebase Phone Auth with Capacitor: Critical Learnings

This document captures the hard-fought lessons and solutions discovered while stabilizing Firebase Phone Auth for the production Android App (Play Store) communicating with a Render backend.

## 1. Google Play App Signing & SHA Keys

**The Problem:** Firebase Phone Auth was returning "app not registered" or reCAPTCHA fallback failures in the production build, despite working perfectly in local development.

**The Cause:** When you upload an Android App Bundle (`.aab`) to the Play Store, Google strips your local upload key and **re-signs** the app with their own secure "Play App Signing" key. Because Firebase relies on the app's cryptographic signature (SHA-1/SHA-256) to verify its identity, the signature Firebase expects no longer matched the signature of the app downloaded from the Play Store.

**The Solution:**
1. Go to the **Google Play Console** -> Select your app -> **App Integrity** -> **App Signing**.
2. Locate the **App signing key certificate** section.
3. Copy BOTH the **SHA-1** and **SHA-256** certificate fingerprints.
4. Go to the **Firebase Console** -> **Project Settings** -> Select your Android app.
5. Click **Add fingerprint** and paste both keys.
6. (Note: You do not need to download the `google-services.json` or rebuild the app if you are only using Firebase Auth; Firebase updates these keys on its backend automatically).

## 2. Environment Variables in GitHub Actions (Capacitor Next.js)

**The Problem:** The production Android app was failing to reach the backend, either timing out or falling back to `http://localhost:4000`.

**The Cause:** The GitHub Action workflow was passing the backend URL as `NEXT_PUBLIC_API_URL`, but the frontend `AuthContext` was strictly looking for `NEXT_PUBLIC_API_BASE_URL`. Additionally, because the Capacitor Android webview runs on `localhost`, the frontend fallback logic (`window.location.hostname === 'localhost'`) mistakenly assumed the app was running in local browser development and defaulted to the local `4000` port.

**The Solution:**
1. Updated the GitHub Actions `.yml` to explicitly map the secret to the exact variable the code expects:
   ```yaml
   NEXT_PUBLIC_API_BASE_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
   ```
2. Updated `AuthContext.tsx` to detect native environments (using Capacitor's `Capacitor.isNativePlatform()`) and bypass the local port fallback when running on a physical device.

## 3. Capacitor Android Origin (`https://localhost`) - CORS & CSRF

**The Problem:** After resolving the URL mapping, the mobile app successfully reached the Render backend but was rejected with a `403 Forbidden` and `failed to fetch` (CORS) error.

**The Cause:** Modern versions of Capacitor (v3+) use the **`https`** scheme for the local Android webview (`https://localhost`), whereas older versions and local browser development use `http://localhost`. 

The Render backend had `http://localhost` whitelisted, but it was actively blocking `https://localhost` at two different layers:
1. **CORS Layer:** The Express CORS configuration was missing `https://localhost`.
2. **CSRF Middleware Layer:** A custom security middleware (`isSafeOrigin`) explicitly checked the `Origin` header and blocked anything not strictly in its whitelist with a `403 Forbidden`.

**The Solution:**
Explicitly added the Capacitor origin to all security whitelists:
```javascript
// In CORS config and CSRF allowedOrigins:
'http://localhost',      // Local web dev
'https://localhost',     // Modern Capacitor Android
'capacitor://localhost'  // Capacitor iOS
```

## 4. Aggressive CORS Preflight Caching in WebViews

**The Problem:** After pushing the CORS/CSRF fixes to the Render backend, the Android app was *still* throwing CORS errors and refusing to communicate with the server. 

**The Cause:** While Render was performing a zero-downtime deployment, the app hit the old server container, which failed the CORS `OPTIONS` preflight. **Android WebViews aggressively cache failed CORS preflight requests.** 

Once a CORS preflight fails, the WebView remembers the failure and blocks subsequent requests internally (`net::ERR_FAILED`) without even sending them to the backend, rendering backend updates seemingly ineffective.

**The Solution:**
Force close the Android app (swipe it away from the recent apps screen) to clear the WebView's memory/cache, then reopen it. The app will initiate a fresh preflight request against the newly deployed backend.
