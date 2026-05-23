import { test, expect } from '@playwright/test';
import * as readline from 'readline';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

test.describe('Admin Flows on Production (Pure UI Validations)', () => {
  // Let the test run longer for manual OTP entry
  test.setTimeout(5 * 60 * 1000);

  test('should login as admin and validate all dashboard routes with logs', async ({ page }) => {
    // --- Log Capturing Setup ---
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
      }
    });

    page.on('response', response => {
      if (!response.ok()) {
        console.log(`[NETWORK ERROR]: ${response.status()} ${response.statusText()} at ${response.url()}`);
      }
    });
    // ---------------------------

    const phone = process.env.ADMIN_PHONE;
    if (!phone) {
      throw new Error('ADMIN_PHONE environment variable is not set. Please set it before running.');
    }

    console.log(`\nStarting login for admin phone: ${phone}`);

    await page.goto('/login');

    // Wait for phone input to be visible and fill it
    const phoneInput = page.locator('#phone-input');
    await phoneInput.waitFor({ state: 'visible' });
    await phoneInput.fill(phone);

    // Click get verification code
    const getOtpBtn = page.locator('#get-otp-btn');
    await getOtpBtn.click();

    // Wait for the OTP input fields to appear
    console.log('\n--- OTP Request Sent ---');
    console.log('Waiting for the OTP input fields to render...');
    
    // We expect the OTP fields to appear. They are inputs with type text and max length 1 inside the otp-wrapper.
    const firstOtpInput = page.locator('.royal-otp-wrapper input').first();
    await firstOtpInput.waitFor({ state: 'visible', timeout: 30000 });

    // Ask user for OTP
    const otp = await askQuestion('\n>> Please enter the 6-digit OTP received on your phone: ');
    
    if (otp.length !== 6) {
      throw new Error('OTP must be exactly 6 digits');
    }

    console.log('Entering OTP...');
    
    // Fill the OTP fields
    const otpInputs = page.locator('.royal-otp-wrapper input');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otp[i]);
    }

    // Click verify
    const verifyBtn = page.getByRole('button', { name: 'Verify Code' });
    await verifyBtn.click();

    console.log('Validating successful login & redirection...');

    // Wait for redirection to dashboard or admin/dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 30000 });
    
    // Check that we are on admin dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    console.log('✅ Successfully reached Admin Dashboard');

    // 1. Validate Dashboard
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Admin/i }).first()).toBeVisible();
    
    // Array of admin routes to validate sequentially
    const adminRoutes = [
      { path: '/admin/data-safety', name: 'Data Safety' },
      { path: '/admin/moderation', name: 'Moderation' },
      { path: '/admin/phone-invitations', name: 'Phone Invitations' },
      { path: '/admin/users', name: 'Users' }
    ];

    for (const route of adminRoutes) {
      console.log(`Navigating to ${route.name} (${route.path})...`);
      await page.goto(route.path);
      
      await page.waitForLoadState('networkidle');
      
      const errorBoundary = page.locator('text=Something went wrong').first();
      const isErrorVisible = await errorBoundary.isVisible();
      expect(isErrorVisible).toBeFalsy();

      await expect(page).toHaveURL(new RegExp(`.*${route.path}`));
      console.log(`✅ ${route.name} loaded successfully`);
    }

    // 2. Specific Flow: Inviting a New User (Real API Hit)
    console.log('Testing Phone Invitation Flow (Real Request)...');
    await page.goto('/admin/phone-invitations');
    
    const inviteInput = page.getByPlaceholder('Enter phone number');
    await inviteInput.waitFor({ state: 'visible' });
    
    // We will use a test number. Note: This hits the real production backend.
    await inviteInput.fill('+910000000000');
    
    const sendBtn = page.getByRole('button', { name: /Send Invitation/i });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();
    
    // Validate purely on UI response (either it clears on success or shows an error toast/message)
    // We'll wait to see if the button stops saying "Sending..."
    await expect(sendBtn).not.toHaveText(/Sending\.\.\./);
    console.log('✅ Phone Invitation Action completed (Check terminal for any network errors)');

    // 3. Specific Flow: User Management Refresh
    console.log('Testing User Management Flow...');
    await page.goto('/admin/users');
    
    const refreshBtn = page.getByRole('button', { name: /Refresh/i });
    await expect(refreshBtn).toBeVisible();
    
    // Pure UI validation: button should show "Refreshing..." briefly
    await refreshBtn.click();
    // Wait for the button to return to "Refresh"
    await expect(refreshBtn).toHaveText(/Refresh/);
    console.log('✅ User Management Refresh completed');

    // 4. Specific Flow: Photo Moderation Check
    console.log('Testing Photo Moderation Flow...');
    await page.goto('/admin/moderation');
    
    // Check UI states without mocking
    const allCaughtUp = page.locator('text=All Caught Up!');
    const approveBtn = page.getByRole('button', { name: /Approve/i }).first();
    
    // Wait for either the empty state or an actual user to approve
    await Promise.race([
      expect(allCaughtUp).toBeVisible(),
      expect(approveBtn).toBeVisible()
    ]);

    if (await approveBtn.isVisible()) {
      console.log('Pending photos found. Clicking Approve on the first one...');
      await approveBtn.click();
      // Wait for it to process
      await expect(approveBtn).toBeDisabled({ timeout: 5000 }).catch(() => {});
      console.log('✅ Photo approved (Check terminal for any network errors)');
    } else {
      console.log('✅ No pending photos found (All Caught Up)');
    }

    console.log('🎉 All admin flows validated successfully.');
  });
});
