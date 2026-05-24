import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';


const { Given, When, Then } = createBdd();

// MASTER BRAIN: Sacred Onboarding Steps (Fact-Checked)

async function isVisible(locator: any, timeout = 500) {
  try {
    return await locator.isVisible({ timeout });
  } catch (e) {
    return false;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fieldContainerForLabel(page: any, label: string) {
  const labelLocator = page.locator('label').filter({
    hasText: new RegExp(`^${escapeRegExp(label)}$`, 'i')
  }).first();

  return labelLocator.locator('xpath=..');
}

Then('I should see the {string} section', async ({ page }, sectionTitle: string) => {
  const beginButton = page.getByRole('button', { name: /Begin Sacred Profiling/i });
  const refineButton = page.getByRole('button', { name: /Refine/i });
  const sectionHeading = page.locator('h1, h2, h3').filter({ hasText: new RegExp(sectionTitle, 'i') }).first();

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await isVisible(sectionHeading)) {
      break;
    }

    if (await isVisible(beginButton, 1000)) {
      await beginButton.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(750);
      continue;
    }

    if (await isVisible(refineButton, 1000)) {
      await refineButton.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(750);
      continue;
    }

    await page.waitForTimeout(500);
  }

  // Fact: Wizard titles are visually rendered headings, but WebKit snapshots showed
  // the accessible role lookup can miss them while the heading is plainly visible.
  await expect(sectionHeading).toBeVisible({ timeout: 30000 });
});

When('I fill in {string} with {string}', async ({ page }, label: string, value: string) => {
  // Fact: RoyalInput doesn't link labels to inputs via 'for' (Action 131)
  const input = fieldContainerForLabel(page, label).locator('input:not([type="file"]), textarea').first();
  await input.fill(value);
});

When('I select {string} for {string}', async ({ page }, value: string, label: string) => {
  // Fact: RoyalSelect doesn't link labels to selects via 'for' (Action 131)
  const select = fieldContainerForLabel(page, label).locator('select').first();
  await select.selectOption({ label: value });
});
