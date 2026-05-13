# Login Page Playwright Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive E2E validation scripts for the Shaadi Mantrana login journey (`/login/`) using Playwright.

**Architecture:** Use Playwright's Page Object Model (simplified for now) to test the transition from Phone Input to OTP Input, validating button states and presence of key UI elements.

**Tech Stack:** Playwright, TypeScript, Next.js 15.

---

### Task 1: Initialize Playwright Test Suite

**Files:**
- Create: `tests/playwright/login.smoke.spec.ts`
- Modify: `package.json` (verify script)

- [ ] **Step 1: Create the directory**
Run: `mkdir -p tests/playwright`

- [ ] **Step 2: Write a basic smoke test**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Page Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login/');
  });

  test('should load the login page and show brand name', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Shaadi');
    await expect(page.locator('h1')).toContainText('Mantrana');
  });

  test('should show the phone input field', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute('placeholder', 'Enter 10 digit number');
  });
});
```

- [ ] **Step 3: Run the smoke test**
Run: `npm run test:e2e:playwright tests/playwright/login.smoke.spec.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add tests/playwright/login.smoke.spec.ts
git commit -m "test: add login smoke tests"
```

### Task 2: Validate Phone Input Journey

**Files:**
- Create: `tests/playwright/login.validation.spec.ts`

- [ ] **Step 1: Write phone validation tests**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Phone Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login/');
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
```

- [ ] **Step 2: Run validation tests**
Run: `npm run test:e2e:playwright tests/playwright/login.validation.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add tests/playwright/login.validation.spec.ts
git commit -m "test: add phone validation journey tests"
```

### Task 3: Validate OTP Transition (Mocked/Simulated)

**Files:**
- Create: `tests/playwright/login.flow.spec.ts`

- [ ] **Step 1: Write flow transition tests**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login/');
  });

  test('should transition to OTP screen after entering phone and clicking button', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    const submitBtn = page.getByRole('button', { name: 'Get Verification Code' });
    
    await phoneInput.fill('9876543210');
    await submitBtn.click();
    
    // Check for OTP screen elements
    await expect(page.locator('h2')).toContainText('Verify Mobile');
    await expect(page.locator('text=Verification Code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Verify Code' })).toBeVisible();
  });

  test('should allow going back to phone screen', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    const submitBtn = page.getByRole('button', { name: 'Get Verification Code' });
    
    await phoneInput.fill('9876543210');
    await submitBtn.click();
    
    const backBtn = page.getByRole('button', { name: 'Change Phone Number' });
    await backBtn.click();
    
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Verification Code' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run flow tests**
Run: `npm run test:e2e:playwright tests/playwright/login.flow.spec.ts`
Expected: PASS (Note: This might require Firebase to be in a certain state or mocked if it hits reCAPTCHA/Rate limits)

- [ ] **Step 3: Commit**
```bash
git add tests/playwright/login.flow.spec.ts
git commit -m "test: add login flow transition tests"
```

### Task 4: Workflow Integration & Debugging Guide

**Files:**
- Modify: `package.json`
- Modify: `TESTING_GUIDE.md`

- [ ] **Step 1: Add shortcut script to package.json**
Add `"test:e2e:ui": "npx playwright test --ui"` to `package.json` scripts.

- [ ] **Step 2: Update TESTING_GUIDE.md**
Add a section on Playwright testing, how to run, and how to debug using the UI mode.

- [ ] **Step 3: Commit**
```bash
git add package.json TESTING_GUIDE.md
git commit -m "docs: add playwright debugging and workflow scripts"
```
