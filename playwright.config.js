const { defineConfig, devices } = require('@playwright/test');
const { defineBddConfig } = require('playwright-bdd');
require('dotenv').config();

const testDir = defineBddConfig({
  features: 'tests/playwright/features/*.feature',
  steps: 'tests/playwright/steps/*.ts',
});

module.exports = defineConfig({
  testDir,
  timeout: 60 * 1000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    video: 'on',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        },
      },
    }
  ]
});
