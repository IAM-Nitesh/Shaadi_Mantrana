import { test, expect, type Page } from '@playwright/test';

/**
 * Login Flow Transition Tests
 *
 * Strategy: We use page.addInitScript() to inject window.__PLAYWRIGHT_TEST__ = true
 * BEFORE page load. The LoginForm checks this flag and bypasses Firebase entirely,
 * transitioning directly to the OTP screen with a mock confirmation result.
 *
 * Why not page.route() network mocking?
 * Firebase's RecaptchaVerifier uses mechanisms (iframes, preloaded configs, SDK
 * caching) that make Playwright's glob-based route interception unreliable in
 * Next.js/webpack-bundled environments. The addInitScript() approach is:
 *   - Guaranteed to execute before any page code
 *   - Independent of network configuration
 *   - Zero coupling to Firebase SDK internals
 *   - Production-safe (the flag is only ever set by this test file)
 */

/**
 * Injects the Playwright test-mode flag before the page loads.
 * LoginForm checks window.__PLAYWRIGHT_TEST__ and bypasses Firebase when set.
 */
async function enableTestMode(page: Page) {
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });
}

test.describe('Login Flow Transitions', () => {

  test('should show error or OTP screen when button is clicked (no test-mode)', async ({ page }) => {
    // Log browser errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text().substring(0, 120)}`);
    });

    await page.goto('/login/');
    await page.waitForSelector('#phone-input', { state: 'visible', timeout: 15000 });

    await page.locator('#phone-input').fill('9876543210');
    await page.locator('#get-otp-btn').click();

    // Either Firebase succeeds (OTP screen) or error message appears — never frozen
    const otpScreen = page.locator('h2').filter({ hasText: 'Verify Mobile' });
    const errorMsg  = page.locator('#login-error-message');
    await expect(otpScreen.or(errorMsg)).toBeVisible({ timeout: 15000 });
  });

  test('should transition to OTP screen after entering phone (with Firebase mocked)', async ({ page }) => {
    // Enable test-mode bypass BEFORE page loads
    await enableTestMode(page);

    await page.goto('/login/');
    await page.waitForSelector('#phone-input', { state: 'visible', timeout: 15000 });

    const phoneInput = page.locator('#phone-input');
    const submitBtn  = page.locator('#get-otp-btn');

    await phoneInput.fill('9876543210');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // OTP screen heading should appear
    const otpHeading = page.locator('h2').filter({ hasText: 'Verify Mobile' });
    await expect(otpHeading).toBeVisible({ timeout: 10000 });

    // OTP input wrapper visible
    await expect(page.locator('.royal-otp-wrapper')).toBeVisible();

    // Verify button visible but disabled (no OTP entered yet)
    const verifyBtn = page.getByRole('button', { name: 'Verify Code' });
    await expect(verifyBtn).toBeVisible();
    await expect(verifyBtn).toBeDisabled();

    // Navigation buttons present
    await expect(page.getByRole('button', { name: /Resend/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Change Phone Number/i })).toBeVisible();
  });

  test('should allow going back to phone screen (with Firebase mocked)', async ({ page }) => {
    await enableTestMode(page);

    await page.goto('/login/');
    await page.waitForSelector('#phone-input', { state: 'visible', timeout: 15000 });

    await page.locator('#phone-input').fill('9876543210');
    await page.locator('#get-otp-btn').click();

    // Wait for OTP screen
    await expect(page.locator('h2').filter({ hasText: 'Verify Mobile' })).toBeVisible({ timeout: 10000 });

    // Click back button
    await page.getByRole('button', { name: /Change Phone Number/i }).click();

    // Should be back on phone input screen
    await expect(page.locator('#phone-input')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#get-otp-btn')).toBeVisible();
  });
});
