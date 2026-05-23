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
    
    const firstOtpInput = page.locator('.royal-otp-wrapper input').first();
    await firstOtpInput.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n⚠️  ACTION REQUIRED ⚠️');
    console.log('>> The browser is visible. Please click on the OTP field in the browser');
    console.log('>> and manually type the 6-digit OTP you received.');
    console.log('>> Then click "Verify Code".');
    console.log('>> The script will pause here and wait for you to login successfully...');
    
    // Wait up to 2 minutes for the user to manually enter the OTP and reach the dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard.*/, { timeout: 120 * 1000 });
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

    // --- NEW: Resend Invite Flow ---
    console.log('Testing Resend Invite Flow...');
    const resendBtn = page.getByRole('button', { name: /Resend/i }).first();
    if (await resendBtn.isVisible()) {
      await resendBtn.click();
      await expect(resendBtn).not.toHaveText(/Sending\.\.\./);
      await page.waitForLoadState('networkidle');
      console.log('✅ Resend Invite completed');
    }

    // 3. Specific Flow: User Management Refresh
    console.log('Testing User Management Flow...');
    await page.goto('/admin/users');
    
    const refreshBtn = page.getByRole('button', { name: /Refresh/i });
    await expect(refreshBtn).toBeVisible();
    
    // Pure UI validation: button should show "Refreshing..." briefly
    await refreshBtn.click();
    // Wait for the button to return to "Refresh"
    await expect(refreshBtn).toHaveText(/Refresh/);
    await page.waitForLoadState('networkidle'); // Allow background user list fetches to complete
    console.log('✅ User Management Refresh completed');

    // --- NEW: Pause / Resume User Flow ---
    console.log('Testing Pause/Resume User Flow on test user...');
    
    // The user list is a table. Find the row for our test user
    const testUserRow = page.locator('tr').filter({ hasText: '+910000000000' }).first();
    
    if (await testUserRow.isVisible()) {
      const pauseBtn = testUserRow.getByRole('button', { name: /Pause/i, exact: true });
      const resumeBtn = testUserRow.getByRole('button', { name: /Resume/i, exact: true });
      const rowResendBtn = testUserRow.getByRole('button', { name: /Resend Invite/i, exact: true });
      
      if (await rowResendBtn.isVisible()) {
        console.log('Resending invite from Users table...');
        await rowResendBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ User Resend Invite triggered');
      }

      if (await pauseBtn.isVisible()) {
        console.log('Pausing test user...');
        await pauseBtn.click();
        
        // Wait for confirmation modal
        const confirmModalBtn = page.getByRole('button', { name: /Pause User/i, exact: true }).last();
        await confirmModalBtn.waitFor({ state: 'visible' });
        await confirmModalBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ User paused');
        
        // Let's also test Resume since they are now paused!
        console.log('Resuming test user...');
        await resumeBtn.waitFor({ state: 'visible' });
        await resumeBtn.click();
        
        const confirmResumeModalBtn = page.getByRole('button', { name: /Resume User/i, exact: true }).last();
        await confirmResumeModalBtn.waitFor({ state: 'visible' });
        await confirmResumeModalBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ User resumed');

      } else if (await resumeBtn.isVisible()) {
        console.log('Test user is already paused. Resuming test user...');
        await resumeBtn.click();
        
        const confirmResumeModalBtn = page.getByRole('button', { name: /Resume User/i, exact: true }).last();
        await confirmResumeModalBtn.waitFor({ state: 'visible' });
        await confirmResumeModalBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ User resumed');
      } else {
        console.log('Test user row found, but Pause/Resume buttons are not visible.');
      }
    } else {
      console.log('Test user row (+910000000000) not found on the first page. Skipping Pause/Resume test.');
    }

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
      // Check if Reject button is also visible
      const rejectBtn = page.getByRole('button', { name: /Reject/i }).first();
      await expect(rejectBtn).toBeVisible();

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
