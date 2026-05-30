const { defineConfig, devices } = require('@playwright/test');

/** Minimal Playwright config for API-only edge-case specs (CI + local). */
module.exports = defineConfig({
  testDir: 'tests/playwright',
  testMatch: 'edge-cases.spec.ts',
  timeout: 60 * 1000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
  ],
});
