# Shaadi Mantrana - Release & Deployment Guide

This document outlines the standard operating procedures for releasing new versions of the Shaadi Mantrana mobile app, updating security keys, managing Git tags, and automating deployments via CI/CD.

---

## 1. The Manual Release Workflow

If you are building and releasing the app manually from your local machine, follow this exact workflow:

### Step 1: Bump the version number
In `android/app/build.gradle`, update these two lines:
```gradle
versionCode 4      // ← Increment by 1 every release (Play Store requires this to go up)
versionName "1.0.3" // ← Human-readable version shown in the store
```
> **Important:** `versionCode` must **always** go up. Google Play will reject the AAB if it's the same or lower than the last upload. `versionName` is just for display.

### Step 2: Pre-build check — google-services.json
`google-services.json` is intentionally excluded from git for security. Before every build, confirm the file exists at `android/app/google-services.json`.

If it's missing, download a fresh copy from:
**Firebase Console → Project Settings → General → Your Android App → Download google-services.json**

Then place it manually:
```bash
cp ~/Downloads/google-services.json android/app/google-services.json
```

> **When to re-download it:** Any time you add new SHA fingerprints to Firebase, you must re-download this file and rebuild. The old file won't contain the new OAuth client IDs.

### Step 3: Run the automated build script
From the root of your project, run the build script:
```bash
./scripts/build-release.sh
```
This script automatically:
1. Builds the Next.js frontend (`npm run build`).
2. Syncs the web assets into Android using Capacitor (`npx cap sync android`).
3. Builds the signed release AAB via Gradle.

### Step 3: Upload to Play Console
Take the freshly minted `.aab` file located at:
`android/app/build/outputs/bundle/release/app-release.aab`
Upload this file to the Google Play Console under your desired track (Internal Testing, Production, etc.).

---

## 2. Release Tagging Strategy (GitHub)

Whenever a new build is generated and uploaded, you should tag that exact snapshot of code in Git. **Do not reuse old tags.**

### Step 1: Create the new tag locally
Make sure you are on your release branch (e.g., `release/v1.0.0`), and run this command to create a new annotated tag:
```bash
git tag -a Release/v1.0.1 -m "Release notes or description of changes"
```

### Step 2: Push the tag to GitHub
Tags don't get pushed automatically when you do `git push`. You must push the tag specifically:
```bash
git push origin Release/v1.0.1
```

### Step 3: Create the GitHub Release
1. Go to your repository on GitHub -> **Releases** -> **Draft a new release**.
2. Select your new tag (`Release/v1.0.1`).
3. Add a title and release notes.
4. Attach your `app-release.aab` file to the release as a backup.
5. Click **Publish release**.

---

## 3. Play Console App Integrity & Firebase (SHA Keys)

Google Play automatically re-signs your app with an official "App Signing Key" before distributing it to users. Because Firebase Phone Authentication relies on Android's Play Integrity/SafetyNet, Firebase needs the exact `SHA-1` and `SHA-256` fingerprints of the installed app.

### Getting the Official Keys from Play Console
1. In the Google Play Console, go to **Protected with Play** (left menu).
2. Expand it and click **Play Store distribution**.
3. Click on the **App signing** tab.
4. Scroll down to the **App signing key certificate** section.
5. Copy the **SHA-1** and **SHA-256** fingerprints.

### Updating Firebase
1. Open your **Firebase Console**.
2. Click the gear icon next to "Project Overview" and select **Project settings**.
3. Scroll down the **General** tab until you see your Android app listed under "Your apps".
4. Look for the "SHA certificate fingerprints" section. Hover over any old/invalid keys and click the trash can icon to **delete them**.
5. Click **Add fingerprint** and paste the new **SHA-1** and **SHA-256** keys you copied from the Play Console.

### Step 6: Re-download google-services.json (Crucial)
When you add new SHA keys, Firebase updates your app's security profile and OAuth client IDs behind the scenes. Your Android app doesn't automatically know about this change.
1. Still in Firebase Console -> Project settings -> General, scroll down to your Android app.
2. Download the `google-services.json` file again.
3. Replace the old file in your project at `android/app/google-services.json`.
4. Rebuild your app (`./scripts/build-release.sh`) and upload the new version to the Play Console.

*Note: It may take 5-10 minutes for Google's servers to sync the new keys globally.*

---

## 4. Automated CI/CD (GitHub Actions)

We have set up GitHub Actions to handle the release workflow automatically. 

### How It Works
* **Push to `main`**: Automatically builds and deploys to **Internal Testing** (testers can download immediately).
* **Push tag `v*`**: Automatically builds and deploys to **Production** (goes to all users after Google review).

### One-Time Setup Required
Before the workflow will function, you need to add the following **secrets** to GitHub:
*(Go to GitHub → Your Repo → Settings → Secrets and Variables → Actions → New repository secret)*

| Secret Name | How to get it |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Run `base64 -i android/shaadi-mantrana-release.jks | pbcopy` |
| `ANDROID_KEYSTORE_PASSWORD` | The password you set when creating the keystore |
| `ANDROID_KEY_ALIAS` | `shaadi-mantrana` |
| `ANDROID_KEY_PASSWORD` | Same as keystore password |
| `GOOGLE_SERVICES_JSON` | Paste the full contents of `android/app/google-services.json` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | See below ↓ |
| `NEXT_PUBLIC_API_URL` | Your Render backend URL |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase env vars (add all required UI vars) |

### Getting the `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
1. Go to [Google Play Console](https://play.google.com/console) → **Setup → API access**.
2. Link to a Google Cloud project → **Create new service account**.
3. Give it the **"Release manager"** role.
4. Download the JSON key file.
5. Paste the entire JSON content as the secret value for `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
