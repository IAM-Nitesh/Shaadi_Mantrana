const { defineConfig, devices } = require('@playwright/test');
const { defineBddConfig } = require('playwright-bdd');
require('dotenv').config();

const testDir = defineBddConfig({
  features: 'tests/playwright/features/*.feature',
  steps: 'tests/playwright/steps/*.ts',
});

module.exports = defineConfig({
  testDir,
  timeout: 120 * 1000,
  retries: 0,
  workers: 5,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  globalTeardown: require.resolve('./tests/playwright/global-teardown'),

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on',
    screenshot: 'only-on-failure',
  },

  webServer: [
    {
      command: 'npm run dev:frontend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 180 * 1000,
    },
    {
      command: 'npm run dev:backend',
      url: 'http://localhost:4000/health/ping',
      reuseExistingServer: true,
      timeout: 180 * 1000,
    }
  ],

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        headless: true,
      },
    }
  ],
});
