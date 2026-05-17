# Golden Standard: Custom Subdomain Authentication Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish secure, production-grade authentication using custom subdomain (`api.shaadimantrana.live`) with HttpOnly cookies instead of localStorage fallback. Eliminate XSS token-theft vulnerability while maintaining flawless Safari/Chrome compatibility.

**Architecture:** 
- Frontend (`www.shaadimantrana.live`) and backend (`api.shaadimantrana.live`) share root domain `shaadimantrana.live`
- Browsers treat cookies set by `api.shaadimantrana.live` as first-party for `www.shaadimantrana.live`
- HttpOnly flag prevents JavaScript from reading tokens (absolute XSS protection)
- Render handles API traffic; DNS CNAME routes subdomain to Render's infrastructure

**Tech Stack:** 
- Render (backend hosting + custom domain)
- Vercel (frontend hosting)
- DNS provider (Cloudflare, GoDaddy, Namecheap, etc.)
- Node.js Express (existing backend unchanged)
- Next.js 15 (existing frontend)

**Security Constraints:**
- NO tokens in localStorage (violation of DPDP/XSS best practice)
- NO Bearer token fallback in Authorization headers (unless absolutely required)
- Refresh tokens MUST remain HttpOnly-only (never readable by JavaScript)
- Access tokens stored in HttpOnly cookies with Secure flag

---

## Task 1: Revert localStorage Fallback Commits

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`
- Modify: `frontend/src/utils/api-client.ts`
- Revert: Delete local commit that added localStorage storage

**Context:**
Your current branch (`nitesh.kumar/revisit-datastructure`) has 1 local commit ahead of origin that added the `localStorage` fallback. We need to discard this entire commit to maintain security purity before deploying the custom domain solution.

- [ ] **Step 1: Verify current branch state**

```bash
git log --oneline -3
git status
```

Expected output: Branch ahead by 1 commit titled "fix(auth): add client-side local token fallback..."

- [ ] **Step 2: Create safety backup branch**

```bash
git branch backup/pre-golden-standard
```

This preserves your current state in case we need to revert the revert.

- [ ] **Step 3: Revert the localStorage commit**

```bash
git reset --hard HEAD~1
```

This discards the localStorage addition and moves HEAD to the "make email field optional" commit (702f71d).

- [ ] **Step 4: Verify revert was successful**

```bash
git log --oneline -3
git diff HEAD~1..HEAD -- frontend/src/contexts/AuthContext.tsx frontend/src/utils/api-client.ts
```

Expected: AuthContext.tsx and api-client.ts should NO LONGER contain `localStorage` references or Bearer token fallback logic.

- [ ] **Step 5: Commit (optional — already committed via reset)**

No commit needed; `git reset --hard` already rewrote history locally.

---

## Task 2: Configure Render Custom Domain

**Files:** None (configuration-only, no code changes)

**Context:**
Render allows you to attach custom domains to your web service. You'll point `api.shaadimantrana.live` to your existing `shaadi-mantrana` backend service.

- [ ] **Step 1: Log in to Render Dashboard**

Go to https://dashboard.render.com and log in with your credentials.

- [ ] **Step 2: Select your backend service**

Navigate to **Services** → Click on `shaadi-mantrana` (your backend).

- [ ] **Step 3: Go to Settings**

In the service dashboard, click **Settings** (gear icon).

- [ ] **Step 4: Scroll down to Custom Domains section**

Look for the **Custom Domains** section (usually near the bottom).

- [ ] **Step 5: Add new custom domain**

Click **Add Custom Domain** and enter:
```
api.shaadimantrana.live
```

- [ ] **Step 6: Copy the CNAME target provided by Render**

Render will display something like:
```
Target: shaadi-mantrana.onrender.com
```

**IMPORTANT**: Copy this exact target. You'll need it in Task 3.

- [ ] **Step 7: Verify domain status in Render**

The status should show **Pending** until DNS CNAME is created in Task 3. Once DNS propagates, it will show **Active**.

---

## Task 3: Update DNS Provider (CNAME Record)

**Files:** None (DNS configuration, external)

**Context:**
Your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.) is where your domain `shaadimantrana.live` is managed. You'll add a CNAME record to route `api.shaadimantrana.live` to Render.

- [ ] **Step 1: Log in to your DNS provider**

Go to your domain registrar (e.g., https://dash.cloudflare.com if using Cloudflare).

- [ ] **Step 2: Find the DNS settings for `shaadimantrana.live`**

Navigate to the DNS records section for your domain.

- [ ] **Step 3: Add a new CNAME record with these values:**

- **Type**: `CNAME`
- **Name**: `api` (NOT `api.shaadimantrana.live` — just the subdomain prefix)
- **Target**: `shaadi-mantrana.onrender.com` (the value Render provided in Task 2)
- **TTL**: Auto or 3600 seconds (standard)
- **Proxy**: Off (if DNS provider offers this; keep DNS-only)

- [ ] **Step 4: Save the DNS record**

Click Save or Publish.

- [ ] **Step 5: Wait for DNS propagation (5-60 minutes)**

DNS propagation is asynchronous. Use this command to check status:

```bash
# Check if CNAME is resolving
dig api.shaadimantrana.live +short

# Or use nslookup
nslookup api.shaadimantrana.live
```

**Expected output:**
```
shaadi-mantrana.onrender.com.
```

Keep checking every 5-10 minutes until the CNAME resolves.

- [ ] **Step 6: Verify in Render Dashboard**

Once DNS resolves, go back to Render → Settings → Custom Domains. The status for `api.shaadimantrana.live` should change from **Pending** to **Active** (this may take 1-2 minutes after DNS propagation).

---

## Task 4: Update Vercel Environment Variable

**Files:**
- Modify: Vercel project settings (not a code file)

**Context:**
Your frontend is deployed on Vercel. It currently points to `https://shaadi-mantrana.onrender.com` (the direct Render URL). After the DNS setup, the frontend should point to your new subdomain `https://api.shaadimantrana.live` instead.

- [ ] **Step 1: Log in to Vercel Dashboard**

Go to https://vercel.com and log in.

- [ ] **Step 2: Go to your project**

Navigate to your Shaadi Mantrana frontend project.

- [ ] **Step 3: Go to Settings**

Click **Settings** (gear icon in top right).

- [ ] **Step 4: Find Environment Variables**

In the left sidebar, click **Environment Variables**.

- [ ] **Step 5: Find and edit `NEXT_PUBLIC_API_BASE_URL`**

Look for the variable named `NEXT_PUBLIC_API_BASE_URL`. Click the three-dot menu and select **Edit**.

- [ ] **Step 6: Change the value**

**Old value:**
```
https://shaadi-mantrana.onrender.com
```

**New value:**
```
https://api.shaadimantrana.live
```

- [ ] **Step 7: Save the environment variable**

Click Save.

- [ ] **Step 8: Verify the change**

Re-open the environment variables section to confirm the new value is persisted.

---

## Task 5: Verify Setup with Local Test

**Files:** None (verification only)

**Context:**
Before redeploying, verify that the subdomain resolves correctly and your backend is accessible via the new domain.

- [ ] **Step 1: Test DNS resolution**

```bash
# Should resolve to shaadi-mantrana.onrender.com
nslookup api.shaadimantrana.live

# Or use dig
dig api.shaadimantrana.live +short
```

Expected output: `shaadi-mantrana.onrender.com.`

- [ ] **Step 2: Test HTTPS connectivity**

```bash
# Should return 200 OK (or redirect, but not connection refused)
curl -v https://api.shaadimantrana.live/health
```

Expected output: Should show a successful HTTP response (200, 302, etc.). If you see "Connection refused" or "Name resolution failed", DNS hasn't propagated yet.

- [ ] **Step 3: Test with a sample API call**

```bash
curl -i https://api.shaadimantrana.live/api/health
```

Expected: Should return a 200 OK or similar (not CORS error or 502).

---

## Task 6: Redeploy Frontend on Vercel

**Files:** None (triggering deployment)

**Context:**
The frontend code hasn't changed, but the environment variable has. Vercel needs to rebuild the frontend with the new `NEXT_PUBLIC_API_BASE_URL` so the client-side code uses the custom domain.

- [ ] **Step 1: Go to Vercel project**

Log in to Vercel and go to your Shaadi Mantrana frontend project.

- [ ] **Step 2: Go to Deployments**

Click **Deployments** in the top menu.

- [ ] **Step 3: Trigger a redeploy**

Find the latest deployment (usually the top one), click the three-dot menu, and select **Redeploy**.

Alternatively, push an empty commit to trigger redeployment:
```bash
git commit --allow-empty -m "trigger: redeploy with custom domain env var"
git push origin nitesh.kumar/revisit-datastructure
```

- [ ] **Step 4: Wait for build to complete**

Vercel will show a progress indicator. Wait for the status to change to **Ready**.

- [ ] **Step 5: Verify deployment logs**

Click on the deployment to view the build logs. Search for `NEXT_PUBLIC_API_BASE_URL` to confirm the new value was picked up.

---

## Task 7: End-to-End Verification (Production Phone Login)

**Files:** None (testing)

**Context:**
This is the T2 verification step: ensure that phone login now works end-to-end in production using the new custom domain, with HttpOnly cookies being set and used correctly.

- [ ] **Step 1: Open production frontend in incognito mode**

Navigate to https://www.shaadimantrana.live in a Chrome or Safari **Incognito/Private** window (this simulates strictest cookie policies).

- [ ] **Step 2: Attempt phone login**

1. Enter a test phone number (e.g., +91-9876543210)
2. Verify OTP is sent (check backend logs or mock OTP if needed)
3. Enter OTP and confirm

- [ ] **Step 3: Verify no CORS error**

The response should NOT show:
```
No 'Access-Control-Allow-Origin' header present
```

If you see this, custom domain DNS hasn't fully propagated. Wait another 10 minutes and retry.

- [ ] **Step 4: Verify authentication succeeded**

After OTP confirmation, the browser should:
- Redirect to the dashboard or onboarding
- Show no "User not authenticated" message in console

- [ ] **Step 5: Open browser DevTools and inspect cookies**

Open **DevTools** → **Application** → **Cookies** → `https://www.shaadimantrana.live`

**You should see:**
- A cookie named `accessToken` with HttpOnly flag ✅ (JavaScript cannot read it)
- Likely also `sessionId` and/or other session cookies, all HttpOnly ✅

**You should NOT see:**
- Any `sm_access_token` in localStorage ✅
- Any `sm_refresh_token` in localStorage ✅

- [ ] **Step 6: Verify page refresh maintains session**

Refresh the page (Cmd+R or F5). The user should remain authenticated without any "User not authenticated" flash.

- [ ] **Step 7: Test logout**

Click the logout button. Verify that:
- Cookies are cleared
- User is redirected to login
- No residual localStorage tokens

---

## Task 8: Verification Summary & Cleanup

**Files:** None

**Context:**
Final T2 verification step to confirm all requirements are met before archiving this task.

- [ ] **Step 1: Run local E2E tests (if applicable)**

If you have Playwright tests for phone login:

```bash
npm run test:e2e:bdd -- --grep "phone"
```

Expected: All phone login tests pass with the new domain.

- [ ] **Step 2: Check Render logs**

Go to Render Dashboard → `shaadi-mantrana` service → Logs.

Look for any errors related to `api.shaadimantrana.live` requests. Should see normal API traffic, no 5xx errors.

- [ ] **Step 3: Verify no security regressions**

Check that:
- ✅ No localStorage tokens are being used
- ✅ All authentication happens via HttpOnly cookies
- ✅ CORS headers are present for `api.shaadimantrana.live` → `www.shaadimantrana.live`

- [ ] **Step 4: Delete backup branch (if confident)**

```bash
git branch -d backup/pre-golden-standard
```

Only do this if you're fully confident the custom domain setup is working.

- [ ] **Step 5: Document learnings**

Run the continuous learning capture:

```bash
./scripts/learn.sh \
  "Golden Standard Custom Domain Auth Setup" \
  "Implemented custom subdomain (api.shaadimantrana.live) for HttpOnly cookie auth. Eliminated localStorage XSS vulnerability. Safari/Chrome cross-domain cookie blocks resolved via same-root CNAME. Deployment: Render custom domain + DNS CNAME + Vercel env var." \
  "Security/Infrastructure" \
  "Review after 1 month of production usage to detect any edge cases"
```

- [ ] **Step 6: Update WIP_MANIFEST.md**

Mark this task as **STABILIZED** and move it to "Recently Stabilized" section.

---

## Devil's Advocate Block

**The most likely way this change is wrong:**
- DNS CNAME misconfiguration pointing to wrong Render URL → API unreachable for 24-48 hours until noticed
- Vercel env var redeploy didn't pick up the new value → Frontend still tries to reach old `onrender.com` domain
- Render backend wasn't updated to accept requests from new domain → CORS failure on first request
- Safari/Chrome still blocks cookies if Secure flag or SameSite policy is misconfigured on backend

**The most dangerous silent assumption:**
- Assuming "DNS propagation complete" based on one successful `dig` — DNS can take up to 60 minutes globally; always test from multiple regions
- Assuming HttpOnly cookies are being set because we reverted localStorage — must verify actual cookie headers in DevTools to confirm backend is sending them correctly
- Assuming phone login flow works because local tests pass — must test in incognito mode which enforces strictest cookie policies

---

## Rollback Plan (If Needed)

If the custom domain doesn't work and you need to revert:

```bash
# Restore the localStorage fallback branch
git checkout backup/pre-golden-standard

# Push to GitHub and redeploy on Vercel
git push -f origin nitesh.kumar/revisit-datastructure

# In Vercel, revert NEXT_PUBLIC_API_BASE_URL to original:
# NEXT_PUBLIC_API_BASE_URL=https://shaadi-mantrana.onrender.com
```

However, **do not use the rollback unless critical**. The custom domain approach is the industry standard and should work.

