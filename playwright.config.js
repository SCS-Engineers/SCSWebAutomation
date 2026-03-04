const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  timeout: 300000, // Increased to 300 seconds (5 minutes)
  expect: {
    timeout: 30000 // Increased to 30 seconds
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // Retry failed tests twice
  workers: 1, // Run tests one at a time to avoid multiple browsers opening
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  use: {
    baseURL: 'https://ajs.scsetools.com',
    headless: false, // Run in headed mode
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Enable detailed logging
    launchOptions: {
      logger: {
        isEnabled: (name, severity) => name === 'api',
        log: (name, severity, message, args) => console.log(`${name} ${message}`)
      }
    },
    actionTimeout: 30000, // Maximum wait for actions
    navigationTimeout: 120000, // Maximum wait for navigation (2 minutes)
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
