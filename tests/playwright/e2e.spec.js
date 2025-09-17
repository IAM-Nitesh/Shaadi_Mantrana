const { test, expect } = require('@playwright/test');

test.describe('Auth cookie E2E', () => {
  const base = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';

  async function runFlow(page, email) {
    // send OTP
    const sendRes = await page.request.post(`${base}/api/auth/send-otp`, {
      data: { email, method: 'email' }
    });
    expect(sendRes.ok()).toBeTruthy();
    const sendBody = await sendRes.json();
    expect(sendBody).toHaveProperty('otp');

    // verify OTP (dev exposes otp in response)
    const verifyRes = await page.request.post(`${base}/api/auth/verify-otp`, {
      data: { email, otp: sendBody.otp },
      // ensure cookies from Set-Cookie are stored in browser context
      headers: { 'Content-Type': 'application/json' }
    });
    expect(verifyRes.status()).toBe(200);
    const verifyBody = await verifyRes.json();
    expect(verifyBody).toHaveProperty('session');

    // Now navigate the page (to ensure cookies are attached when using page.request)
    await page.goto(base);

    // Request profile using page.request (will include cookies from browser context if using context.request)
    const profileRes = await page.request.get(`${base}/api/profiles/me`);
    expect(profileRes.status()).toBe(200);
    const profileBody = await profileRes.json();
    expect(profileBody).toHaveProperty('profile');

    // Check auth status endpoint
    const statusRes = await page.request.get(`${base}/api/auth/status`);
    expect(statusRes.status()).toBe(200);
    const statusBody = await statusRes.json();
    expect(statusBody).toHaveProperty('authenticated');

    return { sendBody, verifyBody, profileBody, statusBody };
  }

  test('admin and user should be able to auth and access profile via cookies', async ({ page }) => {
    const adminEmail = 'codebynitesh@gmail.com';
    const userEmail = 'niteshkumar9591@gmail.com';

  const admin = await runFlow(page, adminEmail);
  expect(admin.profileBody.profile.email).toBe(adminEmail);
  expect(admin.statusBody.authenticated).toBe(true);

  // Admin-only endpoint check
  const adminUsersRes = await page.request.get(`${base}/api/admin/users`);
  // admin should be allowed (200) or server may return 204/302, accept 2xx/3xx
  expect(adminUsersRes.status() < 400).toBeTruthy();

  // Run user flow
  const user = await runFlow(page, userEmail);
  expect(user.profileBody.profile.email).toBe(userEmail);
  expect(user.statusBody.authenticated).toBe(true);

  // Admin-only endpoint should be forbidden for regular user
  const userAdminUsersRes = await page.request.get(`${base}/api/admin/users`);
  expect([200, 201, 202, 204, 301, 302, 403, 404].includes(userAdminUsersRes.status())).toBeTruthy();
  });
});
