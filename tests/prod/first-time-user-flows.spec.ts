/**
 * First-Time User Flows — Production E2E Tests
 *
 * Tests against: https://www.shaadimantrana.live
 *
 * Profile Completeness (v2.0.2):
 *   12 mandatory text fields + 1 photo = 13 total = 100%
 *   Fields: name, gender, dateOfBirth, maritalStatus, education, occupation,
 *           nativePlace, height, complexion, manglik, eatingHabit, about
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

/**
 * Returns the parent container (<div class="space-y-2 w-full">) of the first
 * label whose FULL text exactly matches `label` (case-insensitive).
 *
 * RoyalInput / RoyalSelect both render:
 *   <div class="space-y-2 w-full">
 *     <label>…label text…</label>
 *     <div class="relative group">
 *       <input|select …/>
 *     </div>
 *   </div>
 */
function fieldByLabel(page: any, label: string) {
  return page
    .locator('label')
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`, 'i') })
    .first()
    .locator('xpath=..');
}

async function scrollFill(locator: any, value: string) {
  await locator.scrollIntoViewIfNeeded();
  await locator.fill(value);
}

async function scrollSelect(locator: any, value: string) {
  await locator.scrollIntoViewIfNeeded();
  await locator.selectOption(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('First-Time User Flows on Production', () => {
  test.setTimeout(5 * 60 * 1000); // 5 minutes to allow manual OTP entry

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1 — Full onboarding → 100% profile completeness
  // ───────────────────────────────────────────────────────────────────────────
  test('should login, complete onboarding, upload photo, and reach 100% profile', async ({ page }) => {
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    const phone = process.env.NEW_USER_PHONE;
    if (!phone) throw new Error('NEW_USER_PHONE environment variable is not set.');

    // ── 1. LOGIN ─────────────────────────────────────────────────────────────
    console.log(`\nStarting login for NEW user phone: ${phone}`);
    await page.goto('/login');

    await page.locator('#phone-input').waitFor({ state: 'visible' });
    await page.locator('#phone-input').fill(phone);
    await page.locator('#get-otp-btn').click();
    console.log('\n--- OTP Request Sent ---');

    // Wait for OTP inputs then pause for manual entry
    await page.locator('.royal-otp-wrapper input').first().waitFor({ state: 'visible', timeout: 30000 });
    console.log('\n⚠️  ACTION REQUIRED ⚠️');
    console.log('>> Please manually enter the 6-digit OTP in the browser window.');

    // ── 2. ONBOARDING OVERLAY ────────────────────────────────────────────────
    const beginBtn = page.getByRole('button', { name: /Begin Sacred Profiling/i });
    try {
      await beginBtn.waitFor({ state: 'visible', timeout: 120_000 });
      console.log('✅ Reached Onboarding overlay');
    } catch {
      if (await page.locator('h1').filter({ hasText: /Matches/i }).count() > 0) {
        throw new Error('User already onboarded — use a fresh test phone number.');
      }
      throw new Error('Timed out waiting for the "Begin Sacred Profiling" button.');
    }
    await beginBtn.click();

    // ── 3. WIZARD STEP 1: Personal Grace ─────────────────────────────────────
    // Labels (exact, from PersonalGraceStep.tsx):
    //   "Name of the Devout", "Gender", "Date of Appearance",
    //   "Time of Arrival", "Place of Birth"
    // Mandatory fields filled here: name, gender, dateOfBirth
    console.log('\nStep 1: Filling Personal Grace...');
    await expect(page.locator('h2').filter({ hasText: 'Personal Grace' })).toBeVisible({ timeout: 10000 });

    await fieldByLabel(page, 'Name of the Devout').locator('input').fill('Test User');
    await fieldByLabel(page, 'Gender').locator('select').selectOption('Male');
    await fieldByLabel(page, 'Date of Appearance').locator('input').fill('1990-01-01');
    // Optional: fill time + place for richer profile
    await fieldByLabel(page, 'Time of Arrival').locator('input').fill('06:30');
    await fieldByLabel(page, 'Place of Birth').locator('input').fill('Delhi');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── 4. WIZARD STEP 2: Physical & Vitality ────────────────────────────────
    // Labels (exact, from PhysicalVitalityStep.tsx):
    //   "Height", "Weight", "Complexion",
    //   "Eating Habit", "Smoking Habit", "Drinking Habit"
    // Mandatory fields filled here: height, complexion, eatingHabit
    console.log('Step 2: Filling Physical & Vitality...');
    await expect(page.locator('h2').filter({ hasText: 'Physical & Vitality' })).toBeVisible({ timeout: 10000 });

    // Height in wizard is a free-text RoyalInput (profile page uses two selects)
    await fieldByLabel(page, 'Height').locator('input').fill("5'10\"");
    await fieldByLabel(page, 'Weight').locator('input').fill('70');
    await fieldByLabel(page, 'Complexion').locator('select').selectOption('Fair');
    await fieldByLabel(page, 'Eating Habit').locator('select').selectOption('Vegetarian');
    await fieldByLabel(page, 'Smoking Habit').locator('select').selectOption('No');
    await fieldByLabel(page, 'Drinking Habit').locator('select').selectOption('No');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── 5. WIZARD STEP 3: Intellectual Path ──────────────────────────────────
    // Labels (exact, from IntellectualPathStep.tsx):
    //   "Highest Education", "Professional Occupation",
    //   "Annual Income", "Open to Settle Abroad?"
    // Mandatory fields filled here: education, occupation
    console.log('Step 3: Filling Intellectual Path...');
    await expect(page.locator('h2').filter({ hasText: 'Intellectual Path' })).toBeVisible({ timeout: 10000 });

    await fieldByLabel(page, 'Highest Education').locator('input').fill('Masters in Architecture');
    await fieldByLabel(page, 'Professional Occupation').locator('input').fill('Software Engineer');
    // Optional selects
    await fieldByLabel(page, 'Annual Income').locator('select').selectOption('10L - 20L');
    await fieldByLabel(page, 'Open to Settle Abroad?').locator('select').selectOption('No');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── 6. WIZARD STEP 4: Sacred Roots ───────────────────────────────────────
    // Labels (exact, from SacredRootsStep.tsx):
    //   "Marital Status", "Manglik", "Native Place", "Current Residence",
    //   "Father's Name", "Mother's Name", "Brothers", "Sisters",
    //   "Father's Gotra", "Mother's Gotra",
    //   "Paternal Grandfather's Gotra", "Maternal Grandmother's Gotra"
    // Mandatory fields filled here: maritalStatus, manglik, nativePlace
    console.log('Step 4: Filling Sacred Roots...');
    await expect(page.locator('h2').filter({ hasText: 'Sacred Roots' })).toBeVisible({ timeout: 10000 });

    await fieldByLabel(page, 'Marital Status').locator('select').selectOption('Never Married');
    await fieldByLabel(page, 'Manglik').locator('select').selectOption('No');
    await fieldByLabel(page, 'Native Place').locator('input').fill('Varanasi');
    // Optional fields
    await fieldByLabel(page, 'Current Residence').locator('input').fill('Mumbai');
    await fieldByLabel(page, "Father's Name").locator('input').fill('Rajesh Sharma');
    await fieldByLabel(page, "Mother's Name").locator('input').fill('Sunita Sharma');
    await fieldByLabel(page, "Father's Gotra").locator('input').fill('Kashyap');
    await fieldByLabel(page, "Mother's Gotra").locator('input').fill('Bharadwaj');

    await page.getByRole('button', { name: /Continue Journey/i }).click();

    // ── 7. WIZARD STEP 5: Sacred Intent ──────────────────────────────────────
    // Labels (exact, from SacredIntentStep.tsx):
    //   "Sacred Bio (About Me)", "Interests & Passions", "Specific Requirements"
    // Mandatory fields filled here: about
    console.log('Step 5: Filling Sacred Intent...');
    await expect(page.locator('h2').filter({ hasText: 'Sacred Intent' })).toBeVisible({ timeout: 10000 });

    await fieldByLabel(page, 'Sacred Bio (About Me)').locator('textarea').fill(
      'A devout soul seeking a meaningful connection grounded in values and mutual respect.'
    );
    // Optional
    await fieldByLabel(page, 'Interests & Passions').locator('input').fill('Classical Music, Yoga, Travel');

    // ── 8. FINALIZE WIZARD ────────────────────────────────────────────────────
    // All 12 mandatory text fields are now filled.
    // Button on last step: "Finalize Vows"
    console.log('Finalizing wizard (all 12 mandatory text fields complete)...');
    await page.getByRole('button', { name: /Finalize Vows/i }).click();

    // ── 9. DASHBOARD ──────────────────────────────────────────────────────────
    await page.waitForURL(/.*\/dashboard/, { timeout: 30000 });
    console.log('✅ Wizard complete — landed on Dashboard.');
    await page.waitForLoadState('networkidle');

    // ── 10. PROFILE PAGE ──────────────────────────────────────────────────────
    console.log('\nNavigating to /profile...');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('h1').filter({ hasText: /(My Profile|Sacred Profile)/i }).first()
    ).toBeVisible({ timeout: 15000 });

    // Enter edit mode if a "Refine" button is visible
    const refineBtn = page.locator('button').filter({ hasText: /Refine/i });
    try {
      await refineBtn.waitFor({ state: 'visible', timeout: 5000 });
      console.log('Clicking Refine to enter edit mode...');
      await refineBtn.click({ force: true });
    } catch {
      console.log('Already in edit mode (no Refine button found).');
    }

    // Confirm Save button is visible
    const saveBtn = page.getByRole('button', { name: /Save( Changes| Complete Profile)?|🎉/i });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });

    // ── 11. UPLOAD PHOTO (final mandatory field → 100%) ───────────────────────
    console.log('Uploading profile photo...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/prod/test-photo.jpg');
    // Allow React to recompute completeness after image preview loads
    await page.waitForTimeout(2500);

    // ── 12. ASSERT 100% COMPLETENESS ─────────────────────────────────────────
    // The completeness indicator renders: <span>{calculatedCompleteness}%</span>
    // When completeness = 100, the save button text becomes "🎉 Save Complete Profile"
    console.log('Asserting 100% profile completeness...');

    await expect(
      page.locator('span').filter({ hasText: /^100%$/ }).first()
    ).toBeVisible({ timeout: 8000 });
    console.log('✅ Completeness shows 100%');

    await expect(
      page.getByRole('button', { name: /Save Complete Profile|🎉/i })
    ).toBeVisible({ timeout: 5000 });
    console.log('✅ Save button reads "🎉 Save Complete Profile"');

    // ── 13. SAVE ──────────────────────────────────────────────────────────────
    console.log('Saving...');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    await expect(
      page
        .locator('[role="status"], [class*="toast"], [class*="Toastify"]')
        .filter({ hasText: /profile saved|profile updated/i })
        .first()
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ Profile saved at 100% completeness!');
    console.log('🎉 Test 1 PASSED — First-Time User flow validated!');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2 — Settings page royal UI
  // ───────────────────────────────────────────────────────────────────────────
  test('should render settings page with royal dark UI', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
    });

    const phone = process.env.NEW_USER_PHONE;
    if (!phone) throw new Error('NEW_USER_PHONE environment variable is not set.');

    // Navigate to settings — session should still be alive from Test 1
    await page.goto('/settings');

    // If redirected to login, re-authenticate
    if (page.url().includes('/login')) {
      console.log('Session expired — re-authenticating...');
      await page.locator('#phone-input').fill(phone);
      await page.locator('#get-otp-btn').click();
      await page.locator('.royal-otp-wrapper input').first().waitFor({ state: 'visible', timeout: 30000 });
      console.log('\n⚠️  ACTION REQUIRED ⚠️');
      console.log('>> Please manually enter the 6-digit OTP in the browser window.');
      await page.waitForURL(/.*\/(dashboard|settings)/, { timeout: 120_000 });
      if (!page.url().includes('/settings')) await page.goto('/settings');
    }

    await page.waitForLoadState('networkidle');
    console.log('\nValidating Settings page royal UI...');

    // Page heading
    await expect(
      page.locator('h1').filter({ hasText: /^Settings$/i })
    ).toBeVisible({ timeout: 10000 });
    console.log('✅ "Settings" heading visible');

    // Sacred subtitle
    await expect(
      page.locator('p').filter({ hasText: /Manage your sacred account/i }).first()
    ).toBeVisible();
    console.log('✅ "Manage your sacred account" subtitle visible');

    // Verified badge
    await expect(
      page.locator('span').filter({ hasText: /Verified/i }).first()
    ).toBeVisible();
    console.log('✅ Verified badge visible');

    // Account → Sacred Profile link
    await expect(
      page.locator('a[href="/profile"]').filter({ hasText: /Sacred Profile/i })
    ).toBeVisible();
    console.log('✅ "Sacred Profile" link visible');

    // Support section links
    await expect(page.locator('a[href="/help"]').filter({ hasText: /Help.*Support/i })).toBeVisible();
    await expect(page.locator('a[href="/terms"]').filter({ hasText: /Terms/i })).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').filter({ hasText: /Privacy/i })).toBeVisible();
    console.log('✅ Support links visible');

    // Log Out button
    await expect(page.locator('button').filter({ hasText: /Log Out/i })).toBeVisible();
    console.log('✅ "Log Out" button visible');

    // Logout modal appears and can be dismissed
    await page.locator('button').filter({ hasText: /Log Out/i }).click();
    await expect(
      page.getByText(/Ready to leave\?|Your sacred journey/i).first()
    ).toBeVisible({ timeout: 3000 });
    console.log('✅ Logout confirmation modal appeared');

    await page.getByRole('button', { name: /Stay/i }).click();
    await expect(page.locator('h1').filter({ hasText: /^Settings$/i })).toBeVisible();
    console.log('✅ "Stay" dismissed modal — still on Settings');

    // Version footer
    await expect(
      page.locator('p').filter({ hasText: /Shaadi Mantrana.*v2/i }).first()
    ).toBeVisible();
    console.log('✅ Version footer visible');

    console.log('🎉 Test 2 PASSED — Settings royal UI validated!');
  });
});
