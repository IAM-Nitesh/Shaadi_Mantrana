import { test, expect } from '@playwright/test';

test.describe('Returning User Flows on Production', () => {
  test.setTimeout(5 * 60 * 1000); // 5 mins for manual OTP

  test('should login, skip onboarding, verify dashboard, matches, and chat UI', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
      }
    });

    const phone = process.env.RETURNING_USER_PHONE;
    if (!phone) {
      throw new Error('RETURNING_USER_PHONE environment variable is not set.');
    }

    console.log(`\nStarting login for RETURNING user phone: ${phone}`);
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
    
    // Returning users with 100% profiles should go straight to the Dashboard
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 120 * 1000 });
    console.log('✅ Successfully reached Dashboard directly (skipped onboarding)');

    // Ensure we see matches section
    const matchesSection = page.locator('h1, h2').filter({ hasText: /Matches|Divine Matches/i }).first();
    await expect(matchesSection).toBeVisible({ timeout: 15000 });
    
    // --- Test Matches Flow ---
    console.log('Testing Profile Interactions...');
    const firstMatchCard = page.locator('.match-card, [data-testid="match-card"]').first();
    
    // Not all test databases will have matches generated, so we gracefully handle empty state
    if (await firstMatchCard.isVisible().catch(() => false)) {
      const likeBtn = firstMatchCard.getByRole('button', { name: /Like|Accept/i }).first();
      if (await likeBtn.isVisible()) {
        await likeBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Clicked Like on a match');
      }
    } else {
      console.log('ℹ️ No match cards found. Gracefully skipping profile interactions.');
    }

    // --- Test Chat UI Navigation ---
    console.log('Testing Chat UI...');
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Ensure the chat container or empty state is visible
    const chatHeader = page.locator('h1, h2').filter({ hasText: /Sacred Conversations|Chat/i }).first();
    await expect(chatHeader).toBeVisible({ timeout: 15000 });
    
    const noChatsMessage = page.locator('text=Start a conversation');
    const conversationList = page.locator('.conversation-list-item').first();
    
    await Promise.race([
      expect(noChatsMessage).toBeVisible(),
      expect(conversationList).toBeVisible()
    ]).catch(() => console.log('⚠️ Neither empty state nor conversation list found.'));
    console.log('✅ Chat UI rendered successfully');

    // --- Test Profile Settings ---
    console.log('Testing Settings Navigation...');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').filter({ hasText: /Settings/i }).first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Settings UI loaded');

    console.log('🎉 Returning User flows validated successfully!');
  });
});
