/**
 * First-Time User Flows — Production E2E Tests
 *
 * Validates the full first-time user journey against https://www.shaadimantrana.live
 *
 * Profile Completeness Logic (as of v2.0.1):
 *   12 mandatory text fields + 1 photo = 13 total fields = 100%
 *
 *   Mandatory text fields (all covered by the 5-step wizard):
 *     name, gender, dateOfBirth, maritalStatus, education, occupation,
 *     nativePlace, height, complexion, manglik, eatingHabit, about
 *
 *   Photo: uploaded separately on the profile edit page → triggers 100%
 *
 * Running:
 *   NEW_USER_PHONE=9XXXXXXXXX ./scripts/run-prod-first-time-user-tests.sh
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns the parent container of the first label whose text exactly matches `label`. */
function fieldContainerForLabel(page: any, label: string) {
  return page
    .locator('label')
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`, 'i') })
    .first()
    .locator('xpath=..');
}

/** Scrolls into view before filling — robust on mobile-height viewports. */
async function scrollAndFill(locator: any, value: string) {
  await locator.scrollIntoViewIfNeeded();
  await locator.fill(value);
}

async function scrollAndSelect(locator: any, value: string) {
  await locator.scrollIntoViewIfNeeded();
  await locator.selectOption(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('First-Time User Flows on Production', () => {
  test.setTimeout(5 * 60 * 1000); // 5 minutes for manual OTP

  // ───────────────────────────────────────────────────────
  // Test 1 — Full onboarding → 100% profile completeness
  // ───────────────────────────────────────────────────────
  test('should login, complete onboarding, upload photo, and reach 100% profile', async ({ page }) => {
    // Relay all browser console messages for debugging
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    const phone = process.env.NEW_USER_PHONE;
    if (!phone) throw new Error('NEW_USER_PHONE environment variable is not set.');

    // ── LOGIN ─────────────────────────────────────────────
    console.log(`\nStarting login for NEW user phone: ${phone}`);
    await page.goto('/login');

    const phoneInput = page.locator('#phone-input');
    await phoneInput.waitFor({ state: 'visible' });
    await phoneInput.fill(phone);
    await page.locator('#get-otp-btn').click();
    console.log('\n--- OTP Request Sent ---');

    // Wait for OTP input to appear, then pause for manual entry
    const firstOtpInput = page.locator('.royal-otp-wrapper input').first();
    await firstOtpInput.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n⚠️  ACTION REQUIRED ⚠️');
    console.log('>> Please manually enter the 6-digit OTP in the browser window.');

    // ── ONBOARDING WIZARD ─────────────────────────────────
    const beginButton = page.getByRole('button', { name: /Begin Sacred Profiling/i });

    try {
      await beginButton.waitFor({ state: 'visible', timeout: 120 * 1000 });
      console.log('✅ Successfully reached Onboarding overlay');
    } catch {
      const onDashboard = await page.locator('h1').filter({ hasText: /Matches/i }).count();
      if (onDashboard > 0) {
        throw new Error('User already fully onboarded — please use a fresh test phone number.');
      }
      throw new Error('Timed out waiting for the onboarding overlay to appear.');
    }

    await beginButton.click();

    // ── Step 1: Personal Grace ──────────────────────────────────────────────
    // Fills: name, gender, dateOfBirth  (3 mandatory fields)
    console.log('Filling Personal Grace...');
    await expect(page.locator('h2').filter({ hasText: /Personal Grace/i })).toBeVisible();

    await fieldContainerForLabel(page, 'Name').locator('input').fill('Test User');
    await fieldContainerForLabel(page, 'Gender').locator('select').selectOption('Male');
    const dobContainer = page
      .locator('label')
      .filter({ hasText: /date of (birth|appearance)/i })
      .first()
      .locator('xpath=..');
    await dobContainer.locator('input').fill('1990-01-01');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── Step 2: Physical & Vitality ─────────────────────────────────────────
    // Fills: height, complexion, eatingHabit  (3 mandatory fields)
    //        weight, smokingHabit, drinkingHabit  (optional — fill anyway for richer profile)
    console.log('Filling Physical & Vitality...');
    await expect(page.locator('h2').filter({ hasText: /Physical.*Vitality/i })).toBeVisible();

    await fieldContainerForLabel(page, 'Height').locator('input').fill("5'10\"");
    await fieldContainerForLabel(page, 'Weight').locator('input').fill('70');
    await fieldContainerForLabel(page, 'Complexion').locator('select').selectOption('Fair');
    await fieldContainerForLabel(page, 'Eating Habit').locator('select').selectOption('Vegetarian');
    await fieldContainerForLabel(page, 'Smoking Habit').locator('select').selectOption('No');
    await fieldContainerForLabel(page, 'Drinking Habit').locator('select').selectOption('No');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── Step 3: Intellectual Path ───────────────────────────────────────────
    // Fills: education, occupation  (2 mandatory fields)
    console.log('Filling Intellectual Path...');
    await expect(page.locator('h2').filter({ hasText: /Intellectual Path/i })).toBeVisible();

    await fieldContainerForLabel(page, 'Education').locator('input').fill('Masters in Architecture');
    await fieldContainerForLabel(page, 'Occupation').locator('input').fill('Software Engineer');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── Step 4: Sacred Roots ────────────────────────────────────────────────
    // Fills: maritalStatus, manglik, nativePlace  (3 mandatory fields)
    //        currentResidence, father, mother, fatherGotra, motherGotra  (optional)
    console.log('Filling Sacred Roots...');
    await expect(page.locator('h2').filter({ hasText: /Sacred Roots/i })).toBeVisible();

    await fieldContainerForLabel(page, 'Marital Status').locator('select').selectOption('Never Married');
    await fieldContainerForLabel(page, 'Manglik').locator('select').selectOption('No');
    await fieldContainerForLabel(page, 'Native Place').locator('input').fill('Varanasi');
    await fieldContainerForLabel(page, 'Current Residence').locator('input').fill('Mumbai');

    // Optional but enrich profile
    const fatherNameContainer = page
      .locator('label').filter({ hasText: /father.?s name/i }).first().locator('xpath=..');
    await fatherNameContainer.locator('input').fill('Rajesh Sharma');
    const motherNameContainer = page
      .locator('label').filter({ hasText: /mother.?s name/i }).first().locator('xpath=..');
    await motherNameContainer.locator('input').fill('Sunita Sharma');

    const fatherGotraContainer = page
      .locator('label').filter({ hasText: /father.?s gotra/i }).first().locator('xpath=..');
    await fatherGotraContainer.locator('input').fill('Kashyap');
    const motherGotraContainer = page
      .locator('label').filter({ hasText: /mother.?s gotra/i }).first().locator('xpath=..');
    await motherGotraContainer.locator('input').fill('Bharadwaj');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── Step 5: Sacred Intent ───────────────────────────────────────────────
    // Fills: about  (1 mandatory field)
    console.log('Filling Sacred Intent...');
    await expect(page.locator('h2').filter({ hasText: /Sacred Intent/i })).toBeVisible();

    const bioContainer = page
      .locator('label').filter({ hasText: /bio|about/i }).first().locator('xpath=..');
    await bioContainer.locator('textarea').fill('A devout soul seeking a meaningful connection.');

    // Finalize wizard — all 12 mandatory text fields are now filled
    console.log('Completing Wizard...');
    await page.getByRole('button', { name: /Finalize Vows/i }).click();

    // ── Dashboard ───────────────────────────────────────────────────────────
    await page.waitForURL(/.*\/dashboard/, { timeout: 30000 });
    console.log('✅ Wizard completed. Landed on Dashboard.');
    await page.waitForLoadState('networkidle');

    // ── Profile Page ────────────────────────────────────────────────────────
    console.log('\nNavigating to Profile page...');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('h1').filter({ hasText: /(My Profile|Sacred Profile)/i }).first()
    ).toBeVisible();

    // Enter edit mode
    const refineBtn = page.locator('button').filter({ hasText: /Refine/i });
    try {
      await refineBtn.waitFor({ state: 'visible', timeout: 5000 });
      console.log('Clicking Refine to enter edit mode...');
      await refineBtn.click({ force: true });
    } catch {
      console.log('Refine button not found — already in edit mode.');
    }

    // Confirm Save button appears and note its initial text
    const saveBtn = page.getByRole('button', { name: /Save( Changes| Complete Profile)?|🎉/i });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });

    // ── Photo Upload (triggers final mandatory field → 100%) ────────────────
    console.log('Uploading profile photo...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/prod/test-photo.jpg');
    // Wait for image preview and React to recompute completeness
    await page.waitForTimeout(2000);

    // ── Assert 100% Completeness ────────────────────────────────────────────
    // After the photo upload the completeness indicator must show "100%"
    // and the save button must change to the "🎉 Save Complete Profile" variant.
    console.log('Asserting 100% profile completeness...');

    // The % text is rendered just above the save button area
    await expect(
      page.locator('span').filter({ hasText: /^100%$/ }).first()
    ).toBeVisible({ timeout: 8000 });
    console.log('✅ Completeness indicator shows 100%');

    // Save button should now read "🎉 Save Complete Profile"
    await expect(
      page.getByRole('button', { name: /Save Complete Profile|🎉/i })
    ).toBeVisible({ timeout: 5000 });
    console.log('✅ Save button indicates complete profile');

    // ── Save & Confirm Toast ─────────────────────────────────────────────────
    console.log('Saving complete profile...');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Toast: "🎉 Profile saved successfully! You can now use Discover and Matches."
    await expect(
      page
        .locator('[role="status"], [class*="toast"], [class*="Toastify"]')
        .filter({ hasText: /profile saved|profile updated/i })
        .first()
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ Profile saved successfully at 100% completeness!');
    console.log('🎉 First-Time User flow validated successfully!');
  });

  // ───────────────────────────────────────────────────────
  // Test 2 — Settings page royal UI validation
  // ───────────────────────────────────────────────────────
  test('should render settings page with royal dark UI', async ({ page }) => {
    // This test can run right after the first test since the user will already be logged in.
    // If run independently, manually complete login first.
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
    });

    const phone = process.env.NEW_USER_PHONE;
    if (!phone) throw new Error('NEW_USER_PHONE environment variable is not set.');

    // Navigate directly — if the session is still alive this will work without re-login
    await page.goto('/settings');

    // If redirected to login, re-authenticate
    const isOnLogin = page.url().includes('/login');
    if (isOnLogin) {
      console.log('Session expired — re-logging in for settings test...');
      await page.locator('#phone-input').fill(phone);
      await page.locator('#get-otp-btn').click();
      const firstOtp = page.locator('.royal-otp-wrapper input').first();
      await firstOtp.waitFor({ state: 'visible', timeout: 30000 });
      console.log('\n⚠️  ACTION REQUIRED ⚠️');
      console.log('>> Please manually enter the 6-digit OTP in the browser window.');
      await page.waitForURL(/.*\/(dashboard|settings)/, { timeout: 120 * 1000 });
      if (!page.url().includes('/settings')) await page.goto('/settings');
    }

    await page.waitForLoadState('networkidle');
    console.log('\nValidating Settings page royal UI...');

    // ── Structural checks ──────────────────────────────────────────────────

    // Page heading: "Settings" in Playfair serif gold
    await expect(
      page.locator('h1').filter({ hasText: /^Settings$/i })
    ).toBeVisible({ timeout: 10000 });
    console.log('✅ "Settings" heading visible');

    // Subtitle: "Manage your sacred account"
    await expect(
      page.locator('p').filter({ hasText: /Manage your sacred account/i }).first()
    ).toBeVisible();
    console.log('✅ Sacred subtitle visible');

    // Account info card — "Verified" badge
    await expect(
      page.locator('span').filter({ hasText: /Verified/i }).first()
    ).toBeVisible();
    console.log('✅ Verified badge visible');

    // ACCOUNT section with Sacred Profile link
    await expect(
      page.locator('a[href="/profile"]').filter({ hasText: /Sacred Profile/i })
    ).toBeVisible();
    console.log('✅ "Sacred Profile" account link visible');

    // SUPPORT section links
    await expect(page.locator('a[href="/help"]').filter({ hasText: /Help.*Support/i })).toBeVisible();
    await expect(page.locator('a[href="/terms"]').filter({ hasText: /Terms/i })).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').filter({ hasText: /Privacy/i })).toBeVisible();
    console.log('✅ Support section links visible');

    // Log Out button exists
    await expect(
      page.locator('button').filter({ hasText: /Log Out/i })
    ).toBeVisible();
    console.log('✅ Log Out button visible');

    // Logout modal — clicking Log Out should show the dark glass modal
    await page.locator('button').filter({ hasText: /Log Out/i }).click();
    await expect(
      page.getByText(/Ready to leave|Your sacred journey/i).first()
    ).toBeVisible({ timeout: 3000 });
    console.log('✅ Logout confirmation modal appeared');

    // Cancel — should dismiss modal without logging out
    await page.getByRole('button', { name: /Stay/i }).click();
    await expect(
      page.locator('h1').filter({ hasText: /^Settings$/i })
    ).toBeVisible();
    console.log('✅ "Stay" dismisses modal and remains on Settings');

    // App version footer
    await expect(
      page.locator('p').filter({ hasText: /Shaadi Mantrana.*v2/i }).first()
    ).toBeVisible();
    console.log('✅ Version footer visible');

    console.log('🎉 Settings page royal UI validated successfully!');
  });
});
