import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login Step Definitions — CONFLICT-FREE
// ─────────────────────────────────────────────────────────────────────────────
// RULE: No literal step whose text matches any {string} pattern in this or
//       any other step file. Tested by grep + comm before every commit.
//
// DELEGATED TO navigation.steps.ts (do NOT redefine here):
//   Given 'the test user is in the {string} state'   ← handles "admin","complete"
//   When  'I navigate to {string}'
//   Then  'I should see the {string} heading'
//   Then  'I should see the admin dashboard title'
//   Then  'I should be redirected to the {string} page'
//
// NEW steps only — all unique patterns, no overlap with existing registrations.
// ─────────────────────────────────────────────────────────────────────────────

const { Given, When, Then } = createBdd();

// ─────────────────────────────────────────────────────────────────────────────
// GIVEN steps
// ─────────────────────────────────────────────────────────────────────────────

Given('I am on the {string} page with no session', async ({ page, context }, path) => {
  // Clear all auth so route guards redirect to home
  await context.clearCookies();
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });
  await page.goto(path);
  await page.waitForLoadState('networkidle');
});

// ─────────────────────────────────────────────────────────────────────────────
// WHEN steps
// ─────────────────────────────────────────────────────────────────────────────

When('I type {string} into the phone input', async ({ page }, phoneNumber) => {
  // FACT: LoginForm.tsx:183 — id="phone-input" | aria-label="Mobile Number"
  const input = page.locator('#phone-input, [aria-label="Mobile Number"]').first();
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(phoneNumber);
});

When('I enter the OTP {string}', async ({ page }, otp) => {
  // FACT: OTPInput.tsx:78 — 6 individual inputs inside div.royal-otp-wrapper
  const boxes = page.locator('div.royal-otp-wrapper input[type="text"]');
  await expect(boxes.first()).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < otp.length; i++) {
    await boxes.nth(i).fill(otp[i]);
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
  // FACT: AdminBottomNavigation.tsx — aria-label="Admin bottom navigation"
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  const link = adminNav.locator('a').filter({ hasText: new RegExp(linkName, 'i') }).first();
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click({ force: true });
});

When('I click the logout button in the admin nav bar', async ({ page }) => {
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  const btn = adminNav.getByRole('button', { name: /logout/i }).first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
});

// ─────────────────────────────────────────────────────────────────────────────
// THEN steps — every pattern here is UNIQUE across all step files
// ─────────────────────────────────────────────────────────────────────────────

// ── Login page ────────────────────────────────────────────────────────────────

Then('I should see a phone number input field', async ({ page }) => {
  await expect(
    page.locator('#phone-input, [aria-label="Mobile Number"]').first()
  ).toBeVisible({ timeout: 10_000 });
});

// Suffix "on the login screen" makes this UNIQUE vs navigation.steps.ts's generic "{string} heading"
Then('I should see the {string} heading on the login screen', async ({ page }, text) => {
  // phone step: <h2>Shaadi Mantrana</h2>  |  otp step: <h2>Verify Mobile</h2>
  await expect(
    page.locator('h1, h2').filter({ hasText: new RegExp(text, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

// "send otp button" is a UNIQUE literal phrase — no {string} pattern can match it
// because no step has pattern 'the send otp button should be ...'
Then('the send otp button should be enabled', async ({ page }) => {
  // FACT: LoginForm.tsx:198-199 — id="get-otp-btn", disabled when phoneNumber.length < 10
  await expect(page.locator('#get-otp-btn')).toBeEnabled({ timeout: 10_000 });
});

Then('the send otp button should be disabled', async ({ page }) => {
  await expect(page.locator('#get-otp-btn')).toBeDisabled({ timeout: 10_000 });
});

// Generic button state — safe because feature file uses "Verify Code" not "Get Verification Code"
// "Verify Code" does NOT match 'send otp button' steps above
Then('the {string} button should be enabled', async ({ page }, buttonText) => {
  await expect(
    page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first()
  ).toBeEnabled({ timeout: 10_000 });
});

Then('the {string} button should be disabled', async ({ page }, buttonText) => {
  await expect(
    page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first()
  ).toBeDisabled({ timeout: 10_000 });
});

Then('I should see 6 OTP input boxes', async ({ page }) => {
  const boxes = page.locator('div.royal-otp-wrapper input[type="text"]');
  await expect(boxes).toHaveCount(6, { timeout: 10_000 });
});

Then('I should see a login error message', async ({ page }) => {
  // FACT: LoginForm.tsx:216 — id="login-error-message" | role="alert"
  await expect(
    page.locator('#login-error-message, [role="alert"]').first()
  ).toBeVisible({ timeout: 15_000 });
});

// ── Admin dashboard ───────────────────────────────────────────────────────────

// "storage widget" suffix = UNIQUE, different from generic "{string} heading" or "{string} widget"
Then('I should see the {string} storage widget', async ({ page }, widgetTitle) => {
  // FACT: AdminDashboard page.tsx — <h3> inside div.dashboard-widget
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

// ── User management ───────────────────────────────────────────────────────────

// "admin {string} page" prefix = UNIQUE, different from navigation.steps.ts's '{string} page'
Then('I should be on the admin {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')), { timeout: 15_000 });
});

Then('I should see the {string} stat card', async ({ page }, label) => {
  // FACT: AdminUsers page.tsx — .user-card with text-sm label
  await expect(
    page.locator('.user-card').filter({ hasText: new RegExp(label, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

Then('I should see a user table with at least one row', async ({ page }) => {
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
});

Then('the user table should have the {string} column header', async ({ page }, colName) => {
  await expect(
    page.locator('thead th').filter({ hasText: new RegExp(colName, 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

// ── Logout ────────────────────────────────────────────────────────────────────

Then('the logout overlay should not be visible', async ({ page }) => {
  // FACT: AdminBottomNavigation.tsx — style={{ display:'none' }} by default
  const overlay = page.locator('.logout-overlay').first();
  const isHidden = await overlay.evaluate(el => {
    const s = window.getComputedStyle(el);
    return s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0';
  }).catch(() => true);
  expect(isHidden).toBeTruthy();
});

Then('the logout animation overlay should be visible', async ({ page }) => {
  await expect(page.locator('.logout-overlay').first()).toBeVisible({ timeout: 10_000 });
});

Then('I should eventually be redirected to the {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`), { timeout: 15_000 });
});

// ── Admin login redirect page ─────────────────────────────────────────────────

Then('I should see a button labelled {string}', async ({ page }, label) => {
  await expect(
    page.getByRole('button', { name: new RegExp(label, 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});
