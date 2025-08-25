# ✅ **Production Checklist**

## 🔐 Security

* [ ] Enable **HTTPS (TLS/SSL)** for all environments (Vercel, Firebase, etc.)
* [ ] Validate **CORS policies** to restrict frontend origins
* [ ] Confirm **JWT expiration & refresh** are functioning securely
* [ ] Enable **rate limiting** on all public-facing endpoints (30 req/min/IP)
* [ ] Sanitize and validate all user inputs (XSS, SQLi, etc.)
* [ ] Lock down **admin routes** with role-based access control
* [ ] Enable **security headers** via Helmet.js

## ⚙️ Backend (Express.js / Firebase Functions)

* [ ] Ensure **JWT token signing secret** is strong and stored securely
* [ ] Enable **graceful degradation** for backend services
* [ ] Set proper **error boundaries and 500 fallback routes**
* [ ] Confirm **email OTP service (Nodemailer)** is production-ready
* [ ] Setup **Socket.IO** namespaces and rate control
* [ ] Auto-clear **chat messages older than 24 hours** (cron or scheduled function)
* [ ] Enforce **pre-approved email list** check for registrations

## 🖼️ Image Handling

* [ ] Verify **adaptive compression** settings (85-92%)
* [ ] Validate **file size limits** and MIME-type checks
* [ ] Set **auto-clean rules** in B2 for stale/unused images
* [ ] Ensure signed URLs are **time-bound and scoped**

## 🔄 Matching & Swiping Logic

* [ ] Confirm **daily swipe limits** work as expected
* [ ] Ensure **unmatch & match reversal** logic is bug-free
* [ ] Profile filters (location, age, profession) are functional
* [ ] Proper **badge count tracking** is in place

## 📱 Frontend (Next.js + Capacitor)

* [ ] Enable **PWA manifest** + service workers
* [ ] Confirm **Capacitor splash screen**, status bar configs
* [ ] Validate **image caching** and page transitions
* [ ] Ensure **swipe UI**, filter modal, onboarding, and animations are responsive
* [ ] Remove **debug logs and test flags** from production build

## 🛢️ Database & Storage

* [ ] Index frequently accessed MongoDB fields (e.g., `email`, `location`, `matchIds`)
* [ ] Setup **24h TTL index** on chat messages
* [ ] Ensure **B2 bucket policy** is private with signed URL access only
* [ ] Enable **backup & restore** for MongoDB Atlas and B2

## 🔭 Monitoring & Observability

* [ ] Enable **logging** for all backend services (request IDs, timestamps)
* [ ] Hook **Vercel + Firebase + GitHub** into monitoring
* [ ] Set up **alerts** for errors, downtime, or spike in usage
* [ ] Use **CI/CD logs** and output artifacts for review

## 🚦 CI/CD & Build

* [ ] GitHub Actions runs **tests + lint + type check + build**
* [ ] Auto-push to **Vercel (Frontend)** and **Firebase (Backend)**
* [ ] Run **Capacitor Android build** and sign APK
* [ ] Test **rollback mechanism** and failover behavior
* [ ] Auto-versioning and changelog generation in CI pipeline

## 🔐 Compliance & Privacy

* [ ] Enable **GDPR-compatible data deletion**
* [ ] Define **data retention policy** (e.g., 24h chat, 6mo inactive users)
* [ ] Clearly state **privacy policy** and terms of use (onboarding + footer)
* [ ] Encrypt **sensitive user data** at rest (if applicable)

---

# 🚀 **Deployment Plan**

### 🎯 **1. Preparation**

* ✅ Final code freeze and successful CI run
* ✅ Sanitize environment variables (`.env.production`)
* ✅ Confirm Vercel and Firebase projects are connected to `main` or `release` branch
* ✅ Enable backup snapshot for MongoDB and Backblaze

---

### 🌐 **2. Frontend Deployment (Vercel + Capacitor)**

* 🚀 Build frontend (`next build`)
* 🧪 Run Lighthouse audit on PWA for performance & accessibility
* 📦 Deploy to Vercel via GitHub Actions (Production environment)
* 📱 Build Android APK via Capacitor:

  * `npx cap build android`
  * Sign APK with keystore
  * Upload to Google Play Console (internal track)

---

### 🔧 **3. Backend Deployment (Firebase Functions / Express)**

* 🔁 Deploy Express server (Firebase Function or VPS if custom Express)

  * If Firebase:

    * `firebase deploy --only functions`
  * If custom:

    * Deploy via Docker/VPS, start with `pm2` or `forever`
* ✅ Socket.IO endpoint verified and reachable
* 🔒 Ensure HTTPS endpoints and CORS headers are correctly set
* 🔍 Run load test on `/login`, `/profile`, `/match` endpoints

---

### 🧩 **4. Services & Integrations**

* 📤 Test OTP Email delivery via Nodemailer in production
* 🖼️ Upload test image to check B2 upload, compression, and signed URL
* 💬 Send/receive test messages via Socket.IO
* 🔃 Verify auto-cleanup (Mongo TTL, B2 image cleanup) is scheduled
* 🗂️ Run admin panel checks (user list, block/unblock, role updates)

---

### 📊 **5. Monitoring Setup**

* 📈 Setup Vercel analytics, Firebase logs, and external logging if needed
* 🛠️ Monitor backend logs for unexpected warnings/errors
* 📉 Set up Slack/Email alerts for:

  * 500 errors
  * Login failures spike
  * Server or DB downtime

---

### 🧪 **6. QA Checklist**

* ✅ Test email auth flow (OTP send, retry, resend)
* ✅ Test onboarding + swipe + filter + match/unmatch
* ✅ Test real-time chat, room connection, typing indicators
* ✅ Test session expiry, logout, re-login flow
* ✅ Test rate limiting and edge-case error handling

---

### 🔄 **7. Post-deployment Validation**

* 🧍 Monitor first batch of users in real time
* 🛑 Be ready to rollback if critical errors appear
* 📢 Notify stakeholders that the app is live
* 🔍 Gather logs and performance metrics from first 24h
* 📝 Document bugs or UX feedback for hotfix roadmap



