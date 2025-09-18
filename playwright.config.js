const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/playwright',
  timeout: 60 * 1000,
  retries: 0,
  reporter: [['list']],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', headless: true }
    }
  ]
});
