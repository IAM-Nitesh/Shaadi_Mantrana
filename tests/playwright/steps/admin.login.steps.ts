import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login Steps — FINAL CONFLICT-FREE VERSION
//
// COMPLETE REGISTRY OF EXISTING STEPS (do NOT re-register any of these):
//
// navigation.steps.ts:
//   Given 'I am on the {string} page'
//   Given 'the test user is in the {string} state'
//   Given 'I am logged in with phone {string} and OTP {string}'
//   Given 'I am a logged-in user with a complete profile'
//   When  'I navigate to {string}'
//   When  /^I click the "([^"]+)" button$/     ← REGEX, matches ALL button clicks
//   When  'I click the {string} link in the navigation'
//   When  'I click the {string} button on the first profile card'
//   When  'I click on the match {string}'
//   When  'I type {string} into the message box'
//   Then  'I should see the {string} heading'
//   Then  'I should see the admin dashboard title'
//   Then  'I should be redirected to the {string} page'
//   Then  'the {string} navigation link should be disabled'
//   Then  'I should see a list of mutual matches'
//   Then  'I should see the chat interface for {string}'
//   Then  'I should see a success toast {string}'
//   Then  'I should see my message in the chat history'
//
// onboarding.steps.ts:
//   When 'I fill in {string} with {string}'
//   When 'I select {string} for {string}'
//   Then 'I should see the {string} section'
//
// ── NEW steps only below — zero overlap with the registry above ───────────────
// ─────────────────────────────────────────────────────────────────────────────

const { Given, When, Then } = createBdd();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────────────
// GIVEN
// ─────────────────────────────────────────────────────────────────────────────

// UNIQUE: "with no session" suffix not in any existing Given
Given('I am on the {string} page with no session', async ({ page, context }, path) => {
  await context.clearCookies();
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Enable Playwright bypass — LoginForm.handleSendOTP skips Firebase when this is set
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });
  // Mock auth BEFORE navigation — ensures AuthContext resolves as unauthenticated immediately
  // without making a real network call that could cause race conditions or redirect to '/'
  await page.route('**/api/auth/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ authenticated: false, user: null })
  }));
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
});

// ─────────────────────────────────────────────────────────────────────────────
// WHEN
// ─────────────────────────────────────────────────────────────────────────────

// UNIQUE: "into the phone input" suffix — navigation.steps.ts has "into the message box"
When('I type {string} into the phone input', async ({ page }, phoneNumber) => {
  // FACT: LoginForm.tsx:183 — id="phone-input", aria-label="Mobile Number"
  const input = page.locator('#phone-input, [aria-label="Mobile Number"]').first();
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(phoneNumber);
});

// UNIQUE: "the OTP" — no existing step matches this pattern
When('I enter the OTP {string}', async ({ page }, otp) => {
  // FACT: OTPInput.tsx — 6 inputs inside div.royal-otp-wrapper
  const boxes = page.locator('div.royal-otp-wrapper input[type="text"]');
  await expect(boxes.first()).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < otp.length; i++) {
    await boxes.nth(i).fill(otp[i]);
  }
});

// UNIQUE: "the {string} link" — navigation has "the {string} link in the navigation"
When('I click the {string} back link', async ({ page }, linkText) => {
  // FACT: LoginForm.tsx:286 — "← Change Phone Number" button
  const link = page.getByRole('button', { name: new RegExp(linkText, 'i') }).first();
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click();
});

// UNIQUE: "admin nav link" — not in any existing step file
When('I click the admin nav link {string}', async ({ page }, linkName) => {
  // FACT: AdminBottomNavigation.tsx — aria-label="Admin bottom navigation"
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  const link = adminNav.locator('a').filter({ hasText: new RegExp(linkName, 'i') }).first();
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click({ force: true });
});

// UNIQUE: fully literal with unique phrase "logout button in the admin nav bar"
When('I click the logout button in the admin nav bar', async ({ page }) => {
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  const btn = adminNav.getByRole('button', { name: /logout/i }).first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
});

// ─────────────────────────────────────────────────────────────────────────────
// THEN
// ─────────────────────────────────────────────────────────────────────────────

// UNIQUE: "a phone number input field" — fully literal, no {string}
Then('I should see a phone number input field', async ({ page }) => {
  await expect(
    page.locator('#phone-input, [aria-label="Mobile Number"]').first()
  ).toBeVisible({ timeout: 10_000 });
});

// UNIQUE: "on the login screen" suffix differs from navigation's "the {string} heading"
Then('I should see the {string} heading on the login screen', async ({ page }, text) => {
  // phone step: <h2>Shaadi Mantrana</h2> | otp step: <h2>Verify Mobile</h2>
  await expect(
    page.locator('h1, h2').filter({ hasText: new RegExp(text, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "send otp button" — fully literal phrase, no step has {string} before "send otp"
Then('the send otp button should be enabled', async ({ page }) => {
  // FACT: LoginForm.tsx:198 — id="get-otp-btn", disabled when phoneNumber.length < 10
  await expect(page.locator('#get-otp-btn')).toBeEnabled({ timeout: 10_000 });
});

Then('the send otp button should be disabled', async ({ page }) => {
  await expect(page.locator('#get-otp-btn')).toBeDisabled({ timeout: 10_000 });
});

// UNIQUE: "Verify Code" via parameterized — navigation's regex is for /button click/ not state check
Then('the {string} button should be disabled', async ({ page }, buttonText) => {
  // FACT: LoginForm.tsx:260 — "Verify Code" disabled when otp.length !== 6
  await expect(
    page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first()
  ).toBeDisabled({ timeout: 10_000 });
});

// UNIQUE: 6 OTP boxes — fully literal
Then('I should see 6 OTP input boxes', async ({ page }) => {
  const boxes = page.locator('div.royal-otp-wrapper input[type="text"]');
  await expect(boxes).toHaveCount(6, { timeout: 10_000 });
});

// UNIQUE: "a login error message" — fully literal, no {string}
Then('I should see a login error message', async ({ page }) => {
  // FACT: LoginForm.tsx:216 — id="login-error-message" | role="alert"
  await expect(
    page.locator('#login-error-message, [role="alert"]').first()
  ).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "storage widget" suffix — navigation has no widget step
Then('I should see the {string} storage widget', async ({ page }, widgetTitle) => {
  // FACT: AdminDashboard — <h3> inside div.dashboard-widget
  await expect(
    page.locator('h3').filter({ hasText: new RegExp(widgetTitle, 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "admin bottom navigation bar" — fully literal
Then('I should see the admin bottom navigation bar', async ({ page }) => {
  await expect(
    page.locator('[aria-label="Admin bottom navigation"]')
  ).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "admin nav bar should have" — no existing step matches
Then('the admin nav bar should have a {string} link', async ({ page }, linkName) => {
  const adminNav = page.locator('[aria-label="Admin bottom navigation"]');
  await expect(adminNav).toBeVisible({ timeout: 15_000 });
  await expect(
    adminNav.locator('span, a').filter({ hasText: new RegExp(`^${escapeRegExp(linkName)}$`, 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

// UNIQUE: "admin {string} page" prefix differs from navigation's "the {string} page"
Then('I should be on the admin {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(escapeRegExp(path)), { timeout: 15_000 });
});

// UNIQUE: "stat card" suffix — no existing step
Then('I should see the {string} stat card', async ({ page }, label) => {
  await expect(
    page.locator('.user-card').filter({ hasText: new RegExp(escapeRegExp(label), 'i') }).first()
  ).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "user table with at least one row" — fully literal
Then('I should see a user table with at least one row', async ({ page }) => {
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
});

// UNIQUE: "column header" suffix — no existing step
Then('the user table should have the {string} column header', async ({ page }, colName) => {
  await expect(
    page.locator('thead th').filter({ hasText: new RegExp(escapeRegExp(colName), 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

// UNIQUE: "logout overlay should not be visible" — fully literal
Then('the logout overlay should not be visible', async ({ page }) => {
  const overlay = page.locator('.logout-overlay').first();
  const isHidden = await overlay.evaluate(el => {
    const s = window.getComputedStyle(el);
    return s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0';
  }).catch(() => true);
  expect(isHidden).toBeTruthy();
});

// UNIQUE: "logout animation overlay" — fully literal
Then('the logout animation overlay should be visible', async ({ page }) => {
  await expect(page.locator('.logout-overlay').first()).toBeVisible({ timeout: 10_000 });
});

// UNIQUE: "eventually redirected" — navigation has "redirected to the {string} page" (different phrasing)
Then('I should eventually be redirected to the {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(path)}$`), { timeout: 15_000 });
});

// UNIQUE: "button labelled" — no existing step uses this exact phrasing
Then('I should see a button labelled {string}', async ({ page }, label) => {
  await expect(
    page.getByRole('button', { name: new RegExp(escapeRegExp(label), 'i') }).first()
  ).toBeVisible({ timeout: 10_000 });
});

// UNIQUE: "input with placeholder" — no existing step uses this exact phrasing
Then('I should see an input with placeholder {string}', async ({ page }, placeholder) => {
  await expect(page.locator(`input[placeholder="${placeholder}"]`).first()).toBeVisible({ timeout: 10_000 });
});

// UNIQUE: "into the invitation phone input" — no existing step uses this exact phrasing
When('I type {string} into the invitation phone input', async ({ page }, phoneVal) => {
  const input = page.locator('input[placeholder="Enter phone number"]').first();
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(phoneVal);
});

// UNIQUE: "invited phone number" — no existing step uses this exact phrasing
Then('I should see the invited phone number {string} in the invitation history table', async ({ page }, phoneNumber) => {
  await expect(page.locator('tbody tr').filter({ hasText: phoneNumber }).first()).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "invitation error" — no existing step uses this exact phrasing
Then('I should see the invitation error {string}', async ({ page }, errorText) => {
  await expect(page.locator('p').filter({ hasText: new RegExp(escapeRegExp(errorText), 'i') }).first()).toBeVisible({ timeout: 15_000 });
});

// UNIQUE: "admin support email" — no existing step uses this exact phrasing
Then('I should see the admin support email {string} within the styled box', async ({ page }, email) => {
  const box = page.locator('.bg-blue-950').first();
  await expect(box).toBeVisible({ timeout: 10_000 });
  const mailLink = box.locator(`a[href="mailto:${email}"]`).first();
  await expect(mailLink).toHaveText(email);
});

