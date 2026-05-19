import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login Step Definitions
// ─────────────────────────────────────────────────────────────────────────────
// LOCATOR FACT-CHECK (from frontend/src):
//   - Phone input:  id="phone-input" | aria-label="Mobile Number" | type="tel"
//   - Send OTP btn: id="get-otp-btn" | text="Get Verification Code"
//   - OTP boxes:    div.royal-otp-wrapper input[type="text"] (6 individual inputs)
//   - Verify btn:   button >> text="Verify Code"
//   - Back link:    button >> text="← Change Phone Number"
//   - Error msg:    id="login-error-message" | role="alert"
//   - Login step heading (phone): h2 >> text="Shaadi Mantrana"
//   - Login step heading (otp):   h2 >> text="Verify Mobile"
//   - Admin dashboard h1:         h1 >> has-text("Admin Dashboard")
//   - Admin bottom nav:           nav[role="navigation"][aria-label="Admin bottom navigation"]
//   - Logout overlay:             div.logout-overlay
//   - Logout button:              button >> text="Logout"  (inside admin bottom nav)
// ─────────────────────────────────────────────────────────────────────────────

const { Given, When, Then } = createBdd();

// ── Helpers ──────────────────────────────────────────────────────────────────

function createMockJwt(payload: Record<string, any>) {
  const encode = (v: Record<string, any>) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  })}.e2e-sig`;
}

/** Inject a lightweight no-session guard: clears all auth artefacts */
async function clearSession(page, context) {
  await context.clearCookies();
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });
}

/** Inject admin mock session identical to navigation.steps.ts pattern. */
async function injectAdminSession(page, context) {
  const user = {
    userId: 'admin_id', userUuid: 'admin_id', email: 'admin@example.test',
    role: 'admin', isFirstLogin: false, isApprovedByAdmin: true,
    hasSeenOnboardingMessage: true, hasCompletedWizard: true, profileCompleteness: 100
  };
  const token = createMockJwt({ userId: user.userId, _id: user.userId, id: user.userId, role: user.role });

  await context.addInitScript(({ token, user }) => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
    (window as any).CURRENT_USER_UUID = user.userUuid;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  await context.addCookies([{
    name: 'auth_token', value: token, domain: 'localhost',
    path: '/', expires: Math.floor(Date.now() / 1000) + 3600
  }]);

  // Register API mocks before any navigation
  await page.route('**/api/auth/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ authenticated: true, user, redirectTo: '/admin/dashboard' })
  }));
  await page.route('**/api/auth/token', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, token, expiresAt: Date.now() + 3_600_000 })
  }));
  await page.route('**/api/auth/refresh', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true })
  }));
  await page.route('**/api/profiles/me*', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, user: { ...user, profile: { name: 'Royal Admin', images: [] } } })
  }));
  await page.route('**/api/admin/stats', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      stats: {
        storageStats: {
          b2Usage: '12.4 MB', b2Total: '10 GB', b2Files: 6,
          mongoUsage: '4.2 MB', mongoTotal: '512 MB', mongoProfiles: 4
        }
      }
    })
  }));
  await page.route('**/api/admin/users', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      users: [
        {
          _id: 'user-1', email: 'alice@example.com', role: 'user', status: 'active',
          approvedByAdmin: true, profileCompleteness: 100,
          createdAt: '2026-01-01T00:00:00Z', lastActive: '2026-05-19T00:00:00Z',
          profile: { name: 'Alice' }, verification: { isVerified: true }
        },
        {
          _id: 'user-2', email: 'bob@example.com', role: 'user', status: 'paused',
          approvedByAdmin: false, profileCompleteness: 60,
          createdAt: '2026-02-01T00:00:00Z', lastActive: '2026-05-10T00:00:00Z',
          profile: { name: 'Bob' }, verification: { isVerified: false }
        }
      ]
    })
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// GIVEN steps
// ─────────────────────────────────────────────────────────────────────────────

Given('I am on the {string} page with no session', async ({ page, context }, path) => {
  await clearSession(page, context);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
});

// ─────────────────────────────────────────────────────────────────────────────
// WHEN steps
// ─────────────────────────────────────────────────────────────────────────────

When('I type {string} into the phone input', async ({ page }, phoneNumber) => {
  const input = page.locator('#phone-input, [aria-label="Mobile Number"]').first();
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(phoneNumber);
});

When('I enter the OTP {string}', async ({ page }, otp) => {
  // FACT: OTPInput renders individual <input type="text"> inside div.royal-otp-wrapper
  const digits = otp.split('');
  const boxes = page.locator('div.royal-otp-wrapper input[type="text"]');
  await expect(boxes.first()).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < digits.length; i++) {
    await boxes.nth(i).fill(digits[i]);
  }
});

When('I click the {string} button', async ({ page }, buttonText) => {
  const btn = page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
});

When('I click the {string} link', async ({ page }, linkText) => {
  const link = page.getByRole('button', { name: new RegExp(linkText, 'i') }).first();
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click();
});

When('I click the admin nav link {string}', async ({ page }, linkName) => {
  // FACT: Admin bottom nav is a <div role="navigation" aria-label="Admin bottom navigation">
  // Nav items are <a href=...> anchors for pages and a <button> for logout
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  const link = adminNav.locator('a').filter({ hasText: new RegExp(linkName, 'i') }).first();
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click({ force: true });
});

When('I click the logout button in the admin nav bar', async ({ page }) => {
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  const logoutBtn = adminNav.getByRole('button', { name: /logout/i }).first();
  await expect(logoutBtn).toBeVisible({ timeout: 10_000 });
  await logoutBtn.click();
});

// ─────────────────────────────────────────────────────────────────────────────
// THEN steps
// ─────────────────────────────────────────────────────────────────────────────

Then('I should see the "Shaadi Mantrana" heading on the login screen', async ({ page }) => {
  // FACT: Phone step renders <h2 class="... text-royal-gold ...">Shaadi Mantrana</h2>
  await expect(
    page.locator('h2').filter({ hasText: /Shaadi Mantrana/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see a phone number input field', async ({ page }) => {
  await expect(
    page.locator('#phone-input, [aria-label="Mobile Number"]').first()
  ).toBeVisible({ timeout: 10_000 });
});

Then('I should see the {string} heading on the login screen', async ({ page }, text) => {
  await expect(
    page.locator('h1, h2').filter({ hasText: new RegExp(text, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('the {string} button should be enabled', async ({ page }, buttonText) => {
  const btn = page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first();
  await expect(btn).toBeEnabled({ timeout: 10_000 });
});

Then('the {string} button should be disabled', async ({ page }, buttonText) => {
  const btn = page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first();
  // FACT: disabled prop is set on button when otp.length !== 6
  await expect(btn).toBeDisabled({ timeout: 10_000 });
});

Then('the "Get Verification Code" button should be enabled', async ({ page }) => {
  // FACT: id="get-otp-btn", disabled when phoneNumber.length < 10
  const btn = page.locator('#get-otp-btn');
  await expect(btn).toBeEnabled({ timeout: 10_000 });
});

Then('I should see the {string} heading', async ({ page }, text) => {
  await expect(
    page.locator('h1, h2, h3').filter({ hasText: new RegExp(text, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see 6 OTP input boxes', async ({ page }) => {
  // FACT: OTPInput renders 6 <input type="text"> inside div.royal-otp-wrapper
  const boxes = page.locator('div.royal-otp-wrapper input[type="text"]');
  await expect(boxes).toHaveCount(6, { timeout: 10_000 });
});

Then('I should see a login error message', async ({ page }) => {
  // FACT: Error div has id="login-error-message" and role="alert"
  await expect(
    page.locator('#login-error-message, [role="alert"]').first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see the admin dashboard title', async ({ page }) => {
  await expect(
    page.locator('h1').filter({ hasText: /Admin/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see the "Admin Dashboard" heading', async ({ page }) => {
  await expect(
    page.locator('h1').filter({ hasText: /Admin Dashboard/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see the {string} widget', async ({ page }, widgetTitle) => {
  // FACT: Admin dashboard renders div.dashboard-widget with h3 headings
  await expect(
    page.locator('h3').filter({ hasText: new RegExp(widgetTitle, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see the admin bottom navigation bar', async ({ page }) => {
  await expect(
    page.locator('[aria-label="Admin bottom navigation"]')
  ).toBeVisible({ timeout: 15_000 });
});

Then('the admin nav bar should have a {string} link', async ({ page }, linkName) => {
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  await expect(
    adminNav.locator('span, a').filter({ hasText: new RegExp(`^${linkName}$`, 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

Then('I should be on the {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')), { timeout: 15_000 });
});

Then('I should see the {string} heading', async ({ page }, text) => {
  await expect(
    page.locator('h1').filter({ hasText: new RegExp(text, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see the "User Management" heading', async ({ page }) => {
  await expect(
    page.locator('h1').filter({ hasText: /User Management/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see the {string} stat card', async ({ page }, label) => {
  // FACT: stat cards contain a <div class="text-sm text-gray-500"> with the label text
  await expect(
    page.locator('.user-card').filter({ hasText: new RegExp(label, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see a user table with at least one row', async ({ page }) => {
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

Then('the user table should have the {string} column header', async ({ page }, colName) => {
  await expect(
    page.locator('thead th').filter({ hasText: new RegExp(colName, 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

Then('the logout overlay should not be visible', async ({ page }) => {
  // FACT: logout-overlay has style={{ display: 'none' }} by default (our fix)
  const overlay = page.locator('.logout-overlay').first();
  // It should either be hidden, or have display:none
  const isHidden = await overlay.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }).catch(() => true);
  expect(isHidden).toBeTruthy();
});

Then('the logout animation overlay should be visible', async ({ page }) => {
  // After clicking logout, GSAP sets display:'flex' and animates overlay in
  const overlay = page.locator('.logout-overlay').first();
  await expect(overlay).toBeVisible({ timeout: 10_000 });
});

Then('I should eventually be redirected to the {string} page', async ({ page }, path) => {
  // Logout handler calls window.location.href = '/' after animation
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`), { timeout: 15_000 });
});

Then('I should see the "Admin Access" heading', async ({ page }) => {
  await expect(
    page.locator('h1').filter({ hasText: /Admin Access/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see a button labelled {string}', async ({ page }, label) => {
  await expect(
    page.getByRole('button', { name: new RegExp(label, 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// Extended "admin" state step (delegates to navigation.steps.ts via shared context)
// Reuse existing injectMockSession by composing here for admin-specific extras
// ─────────────────────────────────────────────────────────────────────────────
Given('the test user is in the "admin" state', async ({ page, context }) => {
  await injectAdminSession(page, context);
  await page.goto('/admin/dashboard', { waitUntil: 'load', timeout: 30_000 }).catch(() => {
    console.log('⚠️ Initial navigation timed out, proceeding...');
  });
  await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
  console.log('🎭 Admin Mock Session Active');
});

Given('the test user is in the "complete" state', async ({ page, context }) => {
  const user = {
    userId: 'comp_id', userUuid: 'comp_id', email: 'complete@example.test',
    role: 'user', isFirstLogin: false, isApprovedByAdmin: true,
    hasSeenOnboardingMessage: true, hasCompletedWizard: true, profileCompleteness: 100
  };
  const token = createMockJwt({ userId: user.userId, _id: user.userId, id: user.userId, role: user.role });

  await context.addInitScript(({ token, user }) => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  await context.addCookies([{
    name: 'auth_token', value: token, domain: 'localhost',
    path: '/', expires: Math.floor(Date.now() / 1000) + 3600
  }]);

  // Regular user gets a 403 / redirect-to-home for admin routes
  await page.route('**/api/auth/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ authenticated: true, user, redirectTo: '' })
  }));
  await page.route('**/api/auth/token', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, token, expiresAt: Date.now() + 3_600_000 })
  }));
  await page.route('**/api/profiles/me*', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, user: { ...user, profile: { name: 'Complete User', images: [] } } })
  }));

  await page.goto('/dashboard', { waitUntil: 'load', timeout: 30_000 }).catch(() => { /* ignore */ });
  await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
  console.log('🎭 Complete User Mock Session Active');
});
