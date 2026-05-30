/**
 * Edge-case E2E tests (local stack via playwright.config.js webServer).
 */
import { test, expect } from '@playwright/test';

test.describe('Auth & policy edge cases', () => {
  test('login page links to privacy and terms', async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_EDGE_API_ONLY === '1',
      'UI test skipped in API-only CI job'
    );
    await page.goto('/login/');
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });

  test('settings delete button disabled until DELETE is typed', async ({ page }) => {
    test.skip(true, 'Requires authenticated session — run in BDD flows');
  });
});

test.describe('API edge cases', () => {
  test('profile picture upload without auth returns 401', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000';
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('fake')], { type: 'image/jpeg' }), 'test.jpg');

    const res = await request.post(`${apiBase}/api/upload/profile-picture`, {
      multipart: {
        image: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
        },
      },
    });
    expect(res.status()).toBe(401);
  });

  test('auth rate limit returns 429 after repeated login attempts', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000';
    let lastStatus = 200;

    for (let i = 0; i < 12; i++) {
      const res = await request.post(`${apiBase}/api/auth/firebase-login`, {
        data: { idToken: 'invalid-token-for-rate-test' },
        headers: { 'Content-Type': 'application/json' },
      });
      lastStatus = res.status();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
  });
});
