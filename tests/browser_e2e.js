const { chromium } = require('playwright');

async function run() {
  const emailAdmin = 'codebynitesh@gmail.com';
  const emailUser = 'niteshkumar9591@gmail.com';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[PAGE ${msg.type()}] ${msg.text()}`);
  });

  page.on('request', request => {
    console.log(`[REQ] ${request.method()} ${request.url()}`);
  });

  page.on('response', async response => {
    try {
      const url = response.url();
      const status = response.status();
      const headers = response.headers();
      let body = '';
      // Try to read small responses only
      try {
        const ct = headers['content-type'] || '';
        if (ct.includes('application/json') || ct.includes('text/')) {
          const t = await response.text();
          body = t.length > 1000 ? t.slice(0, 1000) + '...(truncated)' : t;
        }
      } catch (e) {
        // ignore
      }
      console.log(`[RES] ${status} ${url} headers=${JSON.stringify(headers)} body-preview=${body ? body.replace(/\n/g,'') : ''}`);
    } catch (e) {
      console.log('Error logging response', e.message);
    }
  });

  console.log('Navigating to frontend root...');
  await page.goto('/');

  async function runFlow(email) {
    console.log('\n--- Running flow for', email, '---');

    const send = await page.evaluate(async (email) => {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return res.json();
    }, email);

    console.log('send-otp response:', JSON.stringify(send));
    const otp = send.otp;
    if (!otp) {
      throw new Error('No OTP returned from /api/auth/send-otp');
    }

    const verify = await page.evaluate(async (args) => {
      const { email, otp } = args;
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp })
      });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    }, { email, otp });

    console.log('verify-otp response:', JSON.stringify(verify));

    // Wait a moment for cookies to be set via proxy
    await page.waitForTimeout(500);

    // Check document.cookie (will NOT show HttpOnly cookies) but we log for completeness
    const docCookie = await page.evaluate(() => document.cookie);
    console.log('document.cookie (non-HttpOnly cookies visible):', docCookie);

    // Call profiles/me via same-origin proxy
    const profile = await page.evaluate(async () => {
      const res = await fetch('/api/profiles/me', { credentials: 'include' });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    });

    console.log('/api/profiles/me response:', JSON.stringify(profile).slice(0, 2000));
    return { send, verify, profile };
  }

  try {
    const adminResult = await runFlow(emailAdmin);
    const userResult = await runFlow(emailUser);
    console.log('\nRESULTS:\n', JSON.stringify({ adminResult, userResult }, null, 2).slice(0, 5000));
  } catch (err) {
    console.error('E2E script error:', err);
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
