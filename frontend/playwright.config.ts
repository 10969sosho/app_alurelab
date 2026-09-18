import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL || 'https://app.alurelab.com';

export default defineConfig({
  testDir: './qa',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'qa-report', open: 'never' }]],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
  },
  webServer: process.env.QA_START_LOCAL
    ? { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: true }
    : undefined,
});
