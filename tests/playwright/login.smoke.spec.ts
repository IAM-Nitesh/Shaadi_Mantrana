import { test, expect } from '@playwright/test';

test.describe('Login Page Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`BROWSER_ERROR: ${msg.text()}`);
      }
    });
    await page.goto('/login/');
  });

  test('should load the login page and show brand name', async ({ page }) => {
    // Wait for the splash screen/GSAP animations to stabilize
    // Increased timeout to 15s to handle hydration delays
    await page.waitForSelector('h1, h2', { state: 'visible', timeout: 15000 });
    const heading = page.locator('h1, h2').filter({ hasText: 'Shaadi' });
    await expect(heading.first()).toContainText('Shaadi');
    await expect(heading.first()).toContainText('Mantrana');
  });

  test('should show the phone input field', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 15000 });
    await expect(phoneInput).toHaveAttribute('placeholder', 'Enter 10 digit number');
  });
});
