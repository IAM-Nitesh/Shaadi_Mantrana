import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am a logged-in first-time user', async ({ page }) => {
  // Set the playwright test flag
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });

  await page.goto('/login');
  
  const phone = process.env.TEST_PHONE_NUMBER || '9354799303';
  const otp = process.env.TEST_OTP || '123456';
  
  await page.fill('#phone-input', phone);
  await page.click('#get-otp-btn');
  
  const inputs = page.locator('.royal-otp-wrapper input');
  for (let i = 0; i < otp.length; i++) {
    await inputs.nth(i).fill(otp[i]);
  }
  
  await page.click('button:has-text("Verify Code")');
  
  // Wait for the redirect to profile page first - AUTH MUST BE STABLE
  await expect(page).toHaveURL(/\/profile/, { timeout: 25000 });

  // --- DYNAMIC MOCKING STRATEGY (POST-AUTH) ---
  // Now that we are logged in, we setup the mocks and reload to trigger the overlay.
  let mockedCompleteness = 0;
  (page as any)._mockedCompleteness = mockedCompleteness;

  await page.route('**/api/auth/check-auth', async route => {
    const response = await route.fetch();
    const json = await response.json();
    if (json.success && json.user) {
      json.user.isFirstLogin = true;
      json.user.hasSeenOnboardingMessage = false;
      // Ensure profile exists and set completeness
      if (!json.user.profile) json.user.profile = {};
      json.user.profile.profileCompleteness = (page as any)._mockedCompleteness;
    }
    await route.fulfill({ json });
  });

  await page.route('**/api/profiles/me', async route => {
    const response = await route.fetch();
    const json = await response.json();
    if (json.success && json.user) {
      json.user.isFirstLogin = true;
      json.user.hasSeenOnboardingMessage = false;
      // Ensure profile exists and set completeness
      if (!json.user.profile) json.user.profile = {};
      json.user.profile.profileCompleteness = (page as any)._mockedCompleteness;
    }
    await route.fulfill({ json });
  });

  // Reload once to apply the "First Time" state
  await page.reload();
  
  // Now we should DEFINITELY see the onboarding overlay
  const heading = page.locator('h2', { hasText: 'Welcome to the Royal Court' });
  await expect(heading).toBeVisible({ timeout: 15000 });
});

Given('I have clicked {string}', async ({ page }, label) => {
  const button = page.locator('button').filter({ hasText: label }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  
  // If we are finalizing the onboarding, we update the mock to 100% 
  // so the frontend triggers the redirect logic.
  if (label === 'Finalize Vows') {
    (page as any)._mockedCompleteness = 100;
  }
  
  await button.click();
});

Then('I should see the {string} section', async ({ page }, title) => {
  await expect(page.locator('h2', { hasText: title })).toBeVisible({ timeout: 15000 });
});

When('I fill in {string} with {string}', async ({ page }, label, value) => {
  const container = page.locator('div.space-y-2').filter({ 
    has: page.locator('label').filter({ hasText: label, exact: true }) 
  }).first();
  
  const input = container.locator('input, textarea');
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(value);
});

When('I select {string} for {string}', async ({ page }, value, label) => {
  const container = page.locator('div.space-y-2').filter({ 
    has: page.locator('label').filter({ hasText: label, exact: true }) 
  }).first();
  
  const select = container.locator('select');
  await expect(select).toBeVisible({ timeout: 5000 });
  await select.selectOption({ label: value });
});
