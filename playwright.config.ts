import { defineConfig, devices } from '@playwright/test';

/**
 * K1 Visual Regression Test Configuration
 *
 * Run visual tests: npx playwright test tools/visual-regression/
 * Update snapshots: npx playwright test --update-snapshots
 */
export default defineConfig({
  testDir: './tools/visual-regression',
  fullyParallel: false, // Run sequentially for consistent visual output
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for visual consistency
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Expect dev server to be running on port 3100
  // Start with: npm run dev -- --port 3100
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
