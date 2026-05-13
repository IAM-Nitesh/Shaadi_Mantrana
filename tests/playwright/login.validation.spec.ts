import { test, expect } from '@playwright/test';

test.describe('Login Phone Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login/');
    // Wait for the splash screen to finish and form to be ready
    await page.waitForSelector('input[type="tel"]', { state: 'visible', timeout: 10000 });
  });

  test('button should be disabled initially', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: 'Get Verification Code' });
    await expect(submitBtn).toBeDisabled();
  });

  test('button should be disabled for < 10 digits', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    const submitBtn = page.getByRole('button', { name: 'Get Verification Code' });
    
    await phoneInput.fill('123456789');
    await expect(submitBtn).toBeDisabled();
  });

  test('button should be enabled for 10 digits', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    const submitBtn = page.getByRole('button', { name: 'Get Verification Code' });
    
    await phoneInput.fill('9876543210');
    await expect(submitBtn).toBeEnabled();
  });
});
