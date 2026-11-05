const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/continuous',
  testMatch: '**/*.spec.js',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: '.local/qa/results',
  reporter: [['list'], ['html', { outputFolder: '.local/qa/report', open: 'never' }],
    ['junit', { outputFile: '.local/qa/junit.xml' }],
    ['json', { outputFile: '.local/qa/results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on', screenshot: 'on', video: 'retain-on-failure',
    launchOptions: { chromiumSandbox: true },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.env.QA_SYSTEM_CHROMIUM ? { launchOptions: { chromiumSandbox: true, executablePath: process.env.QA_SYSTEM_CHROMIUM } } : {}) } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'python3 scripts/staging.py',
    url: 'http://127.0.0.1:4173/__staging/status.json',
    reuseExistingServer: false,
    stdout: 'pipe', stderr: 'pipe', timeout: 30000,
  },
});
