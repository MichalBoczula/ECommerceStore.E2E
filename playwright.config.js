import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.js',
});

export default defineConfig({
  testDir,
  timeout: 150_000,
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'TestResults/playwright-html', open: 'never' }],
    ['allure-playwright', { resultsDir: 'TestResults/allure-results' }],
  ],
  outputDir: 'TestResults/playwright-results',
  use: {
    baseURL: process.env.E2E_BASE_URL,
    navigationTimeout: 90_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
