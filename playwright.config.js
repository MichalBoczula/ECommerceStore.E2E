import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.js',
});

const retainDiagnostics = process.env.E2E_STOREFRONT_PRIVATE !== 'true';

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
    navigationTimeout: 90_000,
    trace: retainDiagnostics ? 'retain-on-failure' : 'off',
    screenshot: retainDiagnostics ? 'only-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      grepInvert: /@api\b/,
      use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_BASE_URL },
    },
    {
      name: 'users-api',
      testMatch: '**/features/users/**/*.feature.spec.js',
      grep: /@api\b/,
      use: { baseURL: process.env.E2E_USERS_API_URL },
    },
  ],
});
