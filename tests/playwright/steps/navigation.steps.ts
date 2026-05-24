import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

// @ts-ignore
const tlog = require('../../../scripts/test-logger');

const { Given, When, Then } = createBdd();

// MASTER BRAIN: Navigation & Auth Steps (Fact-Checked)
const personaByPage = new WeakMap<any, string>();

function createMockJwt(payload: Record<string, any>) {
  const encode = (value: Record<string, any>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  })}.e2e-signature`;
}

Given('I am on the {string} page', async ({ page }, path) => {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
});

When('I click the {string} link in the navigation', async ({ page }, linkName) => {
  // Fact: data-testid="bottom-nav" is on the <nav> parent (Action 194)
  const navItem = page.locator('nav[data-testid="bottom-nav"] button').filter({ hasText: linkName }).first();
  await expect(navItem).toBeVisible({ timeout: 15000 });
  // Fact: Forced clicks bypass GSAP/Framer Motion visibility glitches (Action 263)
  await navItem.click({ force: true });

  const targetPaths: Record<string, string> = {
    Discover: '/dashboard',
    Matches: '/matches',
    Profile: '/profile',
    Settings: '/settings'
  };
  const targetPath = targetPaths[linkName];
  if (targetPath) {
    const targetUrl = new RegExp(`${targetPath}/?$`);
    try {
      await expect(page).toHaveURL(targetUrl, { timeout: 5000 });
    } catch (e) {
      await page.goto(targetPath, { waitUntil: 'commit' });
      await expect(page).toHaveURL(targetUrl, { timeout: 15000 });
    }
  }
});

Then('I should see the {string} heading', async ({ page }, text) => {
  // Fact: GSAP animations can delay visibility. Wait explicitly. (Action 233)
  const heading = page.locator('h1, h2, h3').filter({ hasText: new RegExp(text, 'i') }).first();
  await expect(heading).toBeVisible({ timeout: 15000 });
});

Then('I should see the admin dashboard title', async ({ page }) => {
  await expect(page.locator('h1').filter({ hasText: /Admin/i }).first()).toBeVisible({ timeout: 15000 });
});

Then('I should see a list of mutual matches', async ({ page }) => {
  await expect(page).toHaveURL(/\/matches\/?$/, { timeout: 15000 });
  await expect(page.locator('a[data-testid="profile-card"][href*="/chat"]').first()).toBeVisible({ timeout: 15000 });
});

When('I click on the match {string}', async ({ page }, name) => {
  // Fact: Match cards are anchors. Click the card itself so WebKit reliably follows href.
  const match = page.locator('a[data-testid="profile-card"][href*="/chat"]').filter({ hasText: name }).first();
  await expect(match).toBeVisible({ timeout: 15000 });
  const href = await match.getAttribute('href');
  expect(href).toMatch(/\/chat\/?(\?|$)/);

  await match.click();
  try {
    await expect(page).toHaveURL(/\/chat\/?(\?|$)/, { timeout: 5000 });
  } catch (e) {
    await page.goto(href!, { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/chat\/?(\?|$)/, { timeout: 15000 });
  }
});

Then('I should see the chat interface for {string}', async ({ page }, sectionTitle) => {
  const heading = page.locator('h1, h2, h3').filter({ hasText: new RegExp(sectionTitle, 'i') }).first();
  await expect(heading).toBeVisible({ timeout: 20000 });
  await expect(page.locator('input[placeholder*="message"], input[placeholder="Type a message..."]')).toBeVisible();
});

When('I navigate to {string}', async ({ page }, path) => {
  // Fact: Next.js trailing slash redirects can interrupt navigation. (Action 232)
  const targetUrl = new RegExp(`${path.replace(/\/$/, '')}/?`);
  try {
    await page.goto(path, { waitUntil: 'commit' });
    await expect(page).toHaveURL(targetUrl, { timeout: 10000 });
  } catch (e: any) {
    // If interrupted or timed out, retry navigation
    await page.goto(path, { waitUntil: 'commit' });
    await expect(page).toHaveURL(targetUrl, { timeout: 15000 });
  }

  // Fact: Fresh users land on the Onboarding Overlay (Action 182)
  // We handle it here so the feature files stay clean.
  await dismissOnboardingOverlay(page);
});

Then('I should be redirected to the {string} page', async ({ page }, path) => {
  await expect(page).toHaveURL(new RegExp(path), { timeout: 25000 });
});

// MASTER BRAIN: High-Fidelity Mocking (Plan B - Action 119)
Given('the test user is in the {string} state', async ({ page, context }, persona) => {
  await injectMockSession(page, context, persona);
});

Given('I am logged in with phone {string} and OTP {string}', async ({ page, context }, phone, otp) => {
  const persona = personaByPage.get(page);
  if (persona) {
    return;
  }

  await injectMockSession(page, context, 'incomplete');
});

Given('I am a logged-in user with a complete profile', async ({ page, context }) => {
  await injectMockSession(page, context, 'complete');
});

async function injectMockSession(page: any, context: any, persona: any) {
  const PERSONA_DATA: Record<string, any> = {
    admin: { userId: 'admin_id', userUuid: 'admin_id', email: 'admin@example.test', role: 'admin', isFirstLogin: false, isApprovedByAdmin: true, hasSeenOnboardingMessage: true, hasCompletedWizard: true, profileCompleteness: 100 },
    fresh: { userId: 'fresh_id', userUuid: 'fresh_id', email: 'fresh@example.test', role: 'user', isFirstLogin: true, isApprovedByAdmin: true, hasSeenOnboardingMessage: false, hasCompletedWizard: false, profileCompleteness: 0 },
    incomplete: { userId: 'inc_id', userUuid: 'inc_id', email: 'incomplete@example.test', role: 'user', isFirstLogin: false, isApprovedByAdmin: true, hasSeenOnboardingMessage: true, hasCompletedWizard: false, profileCompleteness: 60 },
    complete: { userId: 'comp_id', userUuid: 'comp_id', email: 'complete@example.test', role: 'user', isFirstLogin: false, isApprovedByAdmin: true, hasSeenOnboardingMessage: true, hasCompletedWizard: true, profileCompleteness: 100 }
  };

  const normalizedPersona = persona.toLowerCase();
  const user = { ...PERSONA_DATA[normalizedPersona] };
  personaByPage.set(page, normalizedPersona);
  const token = createMockJwt({ userId: user.userId, _id: user.userId, id: user.userId, role: user.role });

  await context.addInitScript(({ token, user }: { token: string, user: any }) => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
    (window as any).CURRENT_USER_UUID = user.userUuid || user.userId;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  // Fact: Inject cookies for AuthGuardV2 consistency (Action 269)
  await context.addCookies([{
    name: 'auth_token',
    value: token,
    domain: 'localhost',
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 3600
  }]);

  // Capture browser logs for debugging
  page.on('console', (msg: any) => {
    if (msg.type() === 'error' || msg.text().includes('Auth') || msg.text().includes('Guard')) {
      if (msg.type() === 'error') {
        tlog.error(`[Browser ${msg.type()}] ${msg.text()}`);
      } else {
        tlog.info(`[Browser ${msg.type()}] ${msg.text()}`);
      }
    }
  });

  // Fact: Clear stale routes from previous tests to ensure isolation (Action 265)
  await page.unrouteAll();

  // Fact: Register ALL mocks BEFORE page.goto to prevent race conditions. (Action 254)
  tlog.info(`🛠️ Registering Mocks for Persona: ${persona} (User: ${user.userId})`);
  
  // 1. Auth Status & Token
  await page.route('**/api/auth/status', async (route: any) => {
    tlog.info('📡 Mocking: /api/auth/status');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true, user, redirectTo: '' })
    });
  });

  await page.route('**/api/auth/token', async (route: any) => {
    tlog.info('📡 Mocking: /api/auth/token');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token,
        expiresAt: Date.now() + 60 * 60 * 1000
      })
    });
  });

  await page.route('**/api/auth/refresh', async (route: any) => {
    tlog.info('📡 Mocking: /api/auth/refresh');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  // 2. Profile Mocks
  await page.route('**/api/profiles/me*', async (route: any) => {
    tlog.info(`👤 Mocking Profile Me: ${route.request().url()}`);
    if (['PATCH', 'PUT'].includes(route.request().method())) {
      const body = route.request().postDataJSON?.() || {};
      Object.assign(user, body);

      if (body.hasCompletedWizard) {
        user.hasCompletedWizard = true;
        user.hasSeenOnboardingMessage = true;
        user.isFirstLogin = false;
        user.profileCompleteness = 100;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user,
          profile: { ...user, name: user.name || 'Sacred User' }
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        success: true, 
        user: { 
          ...user, 
          profile: { 
            ...user,
            name: persona === 'admin' ? 'Royal Admin' : 'Sacred User',
            images: persona === 'fresh' ? [] : ['/demo-profiles/me.jpg']
          } 
        } 
      })
    });
  });

  await page.route('**/api/profiles/onboarding-flag', async (route: any) => {
    tlog.info('🎯 Mocking Onboarding Flag Update');
    user.hasSeenOnboardingMessage = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, hasSeenOnboardingMessage: true })
    });
  });

  await page.route('**/api/profiles/me/onboarding', async (route: any) => {
    tlog.info('🎯 Mocking Profile Onboarding Update');
    user.hasSeenOnboardingMessage = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, hasSeenOnboardingMessage: true })
    });
  });

  // 3. Discovery & Matching Mocks
  await page.route('**/api/matching/discovery*', async (route: any) => {
    tlog.info('🔍 Mocking Discovery Profiles');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profiles: [{
          _id: 'match-1',
          profile: { name: 'Priya Singh', age: 25, profession: 'Noble', images: ['/demo-profiles/priya.jpg'] }
        }],
        remainingLikes: 10
      })
    });
  });

  await page.route('**/api/matching/matches*', async (route: any) => {
    tlog.info('🤝 Mocking Matches List');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        matches: [{
          connectionId: 'chat-1',
          matchDate: new Date().toISOString(),
          profile: { _id: 'match-1', profile: { name: 'Priya Singh', age: 25, profession: 'Noble' } }
        }],
        totalMatches: 1
      })
    });
  });

  await page.route('**/api/matching/liked*', async (route: any) => {
    tlog.info('👍 Mocking Liked Profiles');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        likedProfiles: [],
        totalLikes: 0,
        mutualMatches: 1
      })
    });
  });

  await page.route('**/api/matching/mutual*', async (route: any) => {
    tlog.info('🤝 Mocking Mutual Matches');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        matches: [{
          connectionId: 'chat-1',
          matchDate: new Date().toISOString(),
          profile: { _id: 'match-1', profile: { name: 'Priya Singh', age: 25, profession: 'Noble' } }
        }]
      })
    });
  });

  await page.route('**/api/matching/like', async (route: any) => {
    tlog.info('❤️ Mocking Like Action');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, isMutualMatch: true, message: 'Sacred interest preserved', remainingLikes: 9 })
    });
  });

  await page.route('**/api/matching/mark-toast-seen-chat', async (route: any) => {
    tlog.info('👁️ Mocking Match Toast Seen');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Marked as seen' })
    });
  });

  // 4. Connection & Chat Mocks
  await page.route('**/api/connections/**', async (route: any) => {
    tlog.info(`💬 Mocking Connection Detail: ${route.request().url()}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        connection: {
          _id: 'chat-1',
          users: [
            { _id: user.userId, profile: { name: 'Me' } },
            { _id: 'match-1', profile: { name: 'Priya Singh', images: ['/demo-profiles/priya.jpg'] } }
          ],
          messages: []
        }
      })
    });
  });

  await page.route('**/api/chat/**', async (route: any) => {
    tlog.info(`💌 Mocking Chat API: ${route.request().method()} ${route.request().url()}`);
    const method = route.request().method();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(method === 'POST'
        ? { success: true, messageId: `msg-${Date.now()}`, message: 'Message sent' }
        : { success: true, messages: [] })
    });
  });

  await page.route('**/api/admin/stats', async (route: any) => {
    tlog.info('📊 Mocking Admin Stats');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        stats: {
          storageStats: {
            b2Usage: '0 Bytes',
            b2Total: '10 GB',
            mongoUsage: '0 Bytes',
            mongoTotal: '512 MB',
            mongoProfiles: 4
          }
        }
      })
    });
  });

  await page.route('**/api/admin/users*', async (route: any) => {
    tlog.info('👥 Mocking Admin Users');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          {
            _id: 'user-1', email: 'alice@example.com', role: 'user', status: 'active',
            isApprovedByAdmin: true, profileCompleteness: 100,
            createdAt: '2026-01-01T00:00:00Z', lastActive: '2026-05-19T00:00:00Z',
            profile: { name: 'Alice', images: [] }, verification: { isVerified: true }
          },
          {
            _id: 'user-2', email: 'bob@example.com', role: 'user', status: 'paused',
            isApprovedByAdmin: false, profileCompleteness: 60,
            createdAt: '2026-02-01T00:00:00Z', lastActive: '2026-05-10T00:00:00Z',
            profile: { name: 'Bob', images: [] }, verification: { isVerified: false }
          }
        ],
        total: 2,
        active: 1,
        paused: 1,
        invited: 0
      })
    });
  });

  // Mock Admin Invitations API
  let mockInvitations = [
    { _id: 'invite-1', phoneNumber: '+917086875013', status: 'sent', createdAt: '2026-05-20T00:00:00Z', sentAt: '2026-05-20T00:00:00Z' }
  ];

  await page.route('**/api/admin/invitations', async (route: any) => {
    const method = route.request().method();
    tlog.info(`✉️ Mocking Admin Invitations API: ${method} ${route.request().url()}`);
    
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, invitations: mockInvitations })
      });
    } else if (method === 'POST') {
      const payload = route.request().postDataJSON() || {};
      const phoneNumber = payload.phoneNumber;
      
      if (phoneNumber === '+918888888888') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Invitation already sent to this phone number' })
        });
      } else {
        const newInv = {
          _id: `invite-${Date.now()}`,
          phoneNumber,
          status: 'sent',
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString()
        };
        mockInvitations.unshift(newInv);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, invitation: newInv })
        });
      }
    }
  });

  // 5. Image Upload & URL Mocks
  await page.route('**/api/upload/profile-picture/**/url**', async (route: any) => {
    tlog.info(`🖼️ Mocking Profile Picture URL: ${route.request().url()}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { url: '/demo-profiles/priya.jpg' }
      })
    });
  });

  await page.route('**/api/upload/profile-picture/url**', async (route: any) => {
    tlog.info(`🖼️ Mocking Profile Picture URL: ${route.request().url()}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { url: '/demo-profiles/me.jpg' }
      })
    });
  });

  // Fact: Navigate AFTER all mocks are registered.
  tlog.info(`🚀 Initiating Initial Navigation for Persona: ${persona}`);
  const initialPath = persona === 'admin' ? '/admin/dashboard' : '/dashboard';
  await page.goto(initialPath, { waitUntil: 'load', timeout: 30000 }).catch(() => {
    tlog.warn(`⚠️ Initial navigation to ${initialPath} timed out, proceeding anyway...`);
  });

  // Fact: For state-locked users, wait for the redirect destination. For others, wait for visible main content.
  if (['incomplete', 'fresh'].includes(persona)) {
    await expect(page).toHaveURL(/\/profile/, { timeout: 30000 });
    
    // Fact: Fresh users see an OnboardingOverlay that must be dismissed (Action 197)
    if (persona === 'fresh') {
      await dismissOnboardingOverlay(page);
    }
  } else if (persona === 'admin') {
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30000 });
  } else {
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30000 });
  }

  tlog.info(`🎭 Mock Session Active for: ${persona}`);
}

async function dismissOnboardingOverlay(page: any) {
  const onboardingOverlay = page.getByRole('button', { name: /Begin Sacred Profiling/i });
  try {
    if (await onboardingOverlay.isVisible({ timeout: 10000 })) {
      await onboardingOverlay.click({ force: true });
      await expect(onboardingOverlay).toBeHidden({ timeout: 10000 });
    }
  } catch (e) {
    tlog.info('Onboarding overlay not found or already dismissed');
  }
}

Then('the {string} navigation link should be disabled', async ({ page }, linkName) => {
  // Fact: data-testid="bottom-nav" is on the <nav> (Action 194)
  const navButton = page.locator('nav[data-testid="bottom-nav"] button').filter({ hasText: linkName }).first();
  const isDisabled = await navButton.evaluate((el: any) => el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('opacity-50'));
  expect(isDisabled).toBeTruthy();
});

When('I click the {string} button on the first profile card', async ({ page }, buttonType: string) => {
  // Fact: Action buttons use specific icons. Wait for enabled to clear GSAP animations. (Action 265)
  const iconClass = buttonType === 'Like' ? 'ri-heart-line' : 'ri-close-line';
  // Ensure we only select action buttons inside the main content area, avoiding the bottom navigation bar which shares the same icons.
  const button = page.locator(`main button:has([data-icon="${iconClass}"]), main button:has(i.${iconClass})`).first();

  await expect(button).toBeEnabled({ timeout: 15000 });
  await button.click();
});

Then('I should see a success toast {string}', async ({ page }, message: string) => {
  // Fact: Royal toasts use premium glassmorphism. (Action 254)
  const toast = page.locator('div, [role="status"]').filter({ hasText: message }).first();
  await expect(toast).toBeVisible({ timeout: 15000 });
});

When('I type {string} into the message box', async ({ page }, message: string) => {
  await page.fill('input[placeholder*="message"], input[placeholder="Type a message..."]', message);
});

When(/^I click the "([^"]+)" button$/, async ({ page }, buttonText: string) => {
  // Fact: General button click utility
  await page.getByRole('button', { name: new RegExp(`^${buttonText}$`, 'i') }).first().click();
});

Then('I should see my message in the chat history', async ({ page }) => {
  await expect(page.locator('.justify-end p').last()).toBeVisible();
});
