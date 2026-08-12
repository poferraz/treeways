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
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Force WebGL on headless firefox via SwiftShader software rendering
        // (CI runners lack a GPU). Without these prefs firefox throws
        // "Failed to initialize WebGL" from the maplibre map, which our
        // app's startup treats as fatal and breaks every firefox e2e test.
        // webgl.forbid-hardware forces the SwiftShader software fallback
        // (default forbid-software is true so SwiftShader needs to be
        // explicitly allowed too).
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'webgl.disable-fail-if-major-performance-caveat': true,
            'webgl.forbid-hardware': true,
            'webgl.forbid-software': false,
            'layers.acceleration.force-enabled': true,
            'gfx.webrender.all': true
          }
        }
      }
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4174',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
