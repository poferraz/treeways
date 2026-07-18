import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'light',
    reducedMotion: 'reduce'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4174',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
