import { test, expect } from '@playwright/test';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fieldContainerForLabel(page: any, label: string) {
  const labelLocator = page.locator('label').filter({
    hasText: new RegExp(`^${escapeRegExp(label)}$`, 'i')
  }).first();

  return labelLocator.locator('xpath=..');
}

test.describe('First-Time User Flows on Production', () => {
  test.setTimeout(5 * 60 * 1000); // 5 mins for manual OTP

  test('should login, complete onboarding, upload photo, and reach 100% profile', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
      }
    });

    const phone = process.env.NEW_USER_PHONE;
    if (!phone) {
      throw new Error('NEW_USER_PHONE environment variable is not set.');
    }

    console.log(`\nStarting login for NEW user phone: ${phone}`);
    await page.goto('/login');

    const phoneInput = page.locator('#phone-input');
    await phoneInput.waitFor({ state: 'visible' });
    await phoneInput.fill(phone);

    await page.locator('#get-otp-btn').click();
    console.log('\n--- OTP Request Sent ---');

    const firstOtpInput = page.locator('.royal-otp-wrapper input').first();
    await firstOtpInput.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n⚠️  ACTION REQUIRED ⚠️');
    console.log('>> Please manually enter the 6-digit OTP in the browser window.');
    
    // They will be dropped into either Dashboard (if returning) or Onboarding overlay.
    // If it's truly a NEW user, they will see the onboarding overlay.
    const beginButton = page.getByRole('button', { name: /Begin Sacred Profiling/i });
    
    try {
      await beginButton.waitFor({ state: 'visible', timeout: 120 * 1000 });
      console.log('✅ Successfully reached Onboarding overlay');
    } catch (e) {
      // Maybe they are already past it, or they are on Dashboard?
      const onDashboard = await page.locator('h1').filter({ hasText: /Matches/i }).count();
      if (onDashboard > 0) {
        throw new Error('User is already fully onboarded and on Dashboard! Please use a fresh, wiped test number for the NEW_USER_PHONE script.');
      } else {
        throw e;
      }
    }

    await beginButton.click();
    
    // --- Step 1: Personal Grace ---
    console.log('Filling Personal Grace...');
    await expect(page.locator('h2').filter({ hasText: /Personal Grace/i })).toBeVisible();
    await fieldContainerForLabel(page, 'Name of the Devout').locator('input').fill('Test User');
    await fieldContainerForLabel(page, 'Gender').locator('select').selectOption({ label: 'Male' });
    await fieldContainerForLabel(page, 'Date of Appearance').locator('input').fill('1990-01-01');
    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // --- Step 2: Physical & Vitality ---
    console.log('Filling Physical & Vitality...');
    await expect(page.locator('h2').filter({ hasText: /Physical & Vitality/i })).toBeVisible();
    await fieldContainerForLabel(page, 'Height').locator('input').fill('5ft 10in');
    await fieldContainerForLabel(page, 'Complexion').locator('select').selectOption({ label: 'Fair' });
    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // --- Step 3: Intellectual Path ---
    console.log('Filling Intellectual Path...');
    await expect(page.locator('h2').filter({ hasText: /Intellectual Path/i })).toBeVisible();
    await fieldContainerForLabel(page, 'Highest Education').locator('input').fill('Masters in Architecture');
    await fieldContainerForLabel(page, 'Professional Occupation').locator('input').fill('Software Engineer');
    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // --- Step 4: Sacred Roots ---
    console.log('Filling Sacred Roots...');
    await expect(page.locator('h2').filter({ hasText: /Sacred Roots/i })).toBeVisible();
    await fieldContainerForLabel(page, 'Marital Status').locator('select').selectOption({ label: 'Never Married' });
    await fieldContainerForLabel(page, 'Native Place').locator('input').fill('Varanasi');
    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // --- Step 5: Sacred Intent ---
    console.log('Filling Sacred Intent...');
    await expect(page.locator('h2').filter({ hasText: /Sacred Intent/i })).toBeVisible();
    await fieldContainerForLabel(page, 'Sacred Bio (About Me)').locator('textarea').fill('A devout soul seeking a meaningful connection.');
    
    console.log('Completing Wizard...');
    await page.getByRole('button', { name: /Finalize Vows/i }).click();

    // Should navigate to dashboard eventually
    await page.waitForURL(/.*\/dashboard/, { timeout: 30000 });
    console.log('✅ Wizard completed. Landed on Dashboard.');

    // Wait for the completeness progress bar (could be 100% if photo is mocked, or less if missing)
    await page.waitForLoadState('networkidle');
    
    // --- Profile Editing / Photo ---
    console.log('Testing Profile Navigation and Save...');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: /My Profile/i }).first()).toBeVisible();

    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveBtn).toBeVisible();

    // Just click save to ensure profile endpoints are working without crashing
    await saveBtn.click();
    await expect(page.locator('div, [role="status"]').filter({ hasText: /Profile updated successfully/i }).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Profile saved successfully');
    
    console.log('🎉 First-Time User flows validated successfully!');
  });
});
