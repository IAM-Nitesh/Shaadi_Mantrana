const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests/prod',
  // Production tests might take longer due to network and manual OTP entry
  timeout: 5 * 60 * 1000, 
  expect: {
    timeout: 15000
  },
  retries: 0,
  // We need to run linearly since it requires manual terminal input
  workers: 1,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-prod' }]
  ],
  use: {
    baseURL: 'https://www.shaadimantrana.live',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Helps bypass basic bot detections
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Can run headless, but non-headless might be easier if debugging is needed.
        // Keeping headless: true by default for terminal script.
        headless: false,
      },
    }
  ],
});
