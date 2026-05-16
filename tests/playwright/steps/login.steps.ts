import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the login page', async ({ page }) => {
  // Set the playwright test flag
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });
  await page.goto('/login');
});

When('I enter the test phone number', async ({ page }) => {
  const phone = process.env.TEST_PHONE_NUMBER;
  if (!phone) throw new Error('TEST_PHONE_NUMBER is not defined in .env');
  await page.fill('#phone-input', phone);
});

When('I click the {string} button', async ({ page }, label) => {
  const button = page.locator('button').filter({ hasText: label }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
});

Then('I should see the OTP input screen', async ({ page }) => {
  await expect(page.locator('.royal-otp-wrapper input').first()).toBeVisible({ timeout: 15000 });
});

When('I enter the test OTP', async ({ page }) => {
  const otp = process.env.TEST_OTP;
  if (!otp) throw new Error('TEST_OTP is not defined in .env');
  
  const inputs = page.locator('.royal-otp-wrapper input');
  for (let i = 0; i < otp.length; i++) {
    await inputs.nth(i).fill(otp[i]);
  }
});

Then('I should be redirected to the {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(path), { timeout: 25000 });
});

Then('I should see the onboarding message {string}', async ({ page }, message) => {
  // --- MOCKING STRATEGY ---
  // We only start mocking AFTER we are already on the profile page and authenticated.
  // This avoids interfering with the initial login/session creation.
  
  await page.route('**/api/auth/check-auth', async route => {
    const response = await route.fetch();
    const json = await response.json();
    if (json.success && json.user) {
      json.user.isFirstLogin = true;
      json.user.hasSeenOnboardingMessage = false;
      if (json.user.profile) json.user.profile.profileCompleteness = 0;
    }
    await route.fulfill({ json });
  });

  await page.route('**/api/profiles/me', async route => {
    const response = await route.fetch();
    const json = await response.json();
    if (json.success && json.user) {
      json.user.isFirstLogin = true;
      json.user.hasSeenOnboardingMessage = false;
      if (json.user.profile) json.user.profile.profileCompleteness = 0;
    }
    await route.fulfill({ json });
  });

  // Reload to apply the mocked state to the already-authenticated session
  await page.reload();
  
  const heading = page.locator('h2', { hasText: message });
  await expect(heading).toBeVisible({ timeout: 15000 });
});

Then('I should see the {string} wizard', async ({ page }, title) => {
  const heading = page.locator('h1', { hasText: title });
  await expect(heading).toBeVisible({ timeout: 15000 });
});
