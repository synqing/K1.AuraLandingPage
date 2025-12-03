/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              K1 CENTER ORIGIN VISUAL REGRESSION TESTS                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  These tests validate that ALL K1 visualization routes comply with the    ║
 * ║  CENTER ORIGIN MANDATE - light MUST emanate symmetrically from center.    ║
 * ║                                                                           ║
 * ║  ROUTES TESTED:                                                           ║
 * ║  - /           : Landing page with K1Engine (HERO preset)                 ║
 * ║  - /simulator  : Physics simulator with K1Engine (PHYSICAL preset)        ║
 * ║                                                                           ║
 * ║  USAGE:                                                                   ║
 * ║  1. Start dev server: npm run dev (port 3100)                             ║
 * ║  2. Run tests: npx playwright test tools/visual-regression/               ║
 * ║  3. Update snapshots: npx playwright test --update-snapshots              ║
 * ║                                                                           ║
 * ║  FAILURE INDICATES: Center origin mandate violation - investigate!        ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3100';

// Allow extra time for WebGL canvas to render and physics to settle
const PHYSICS_SETTLE_MS = 2500;

test.describe('K1 Center Origin Mandate Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Set a consistent viewport for visual regression
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Landing page (/) shows symmetric center-origin light', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Wait for canvas to be ready
    const canvas = await page.waitForSelector('canvas', { timeout: 10000 });
    expect(canvas).toBeTruthy();

    // Allow physics simulation to run and display symmetric light
    await page.waitForTimeout(PHYSICS_SETTLE_MS);

    // Visual snapshot comparison
    await expect(canvas).toHaveScreenshot('landing-hero-center-origin.png', {
      maxDiffPixelRatio: 0.05, // Allow 5% pixel difference for animation variance
    });
  });

  test('Simulator page (/simulator) shows symmetric center-origin light', async ({ page }) => {
    await page.goto(`${BASE_URL}/simulator`);

    const canvas = await page.waitForSelector('canvas', { timeout: 10000 });
    expect(canvas).toBeTruthy();

    await page.waitForTimeout(PHYSICS_SETTLE_MS);

    await expect(canvas).toHaveScreenshot('simulator-physical-center-origin.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('All routes have canvas elements (sanity check)', async ({ page }) => {
    const routes = ['/', '/simulator'];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      const canvas = await page.waitForSelector('canvas', { timeout: 10000 });
      expect(canvas).toBeTruthy();
    }
  });
});

/**
 * Manual Verification Guide:
 *
 * When reviewing screenshot diffs:
 *
 * CORRECT (Center Origin Compliant):
 * - Light columns appear symmetrically positioned around the horizontal center
 * - Both left and right sides of the LED strip show matching light patterns
 * - Light "breathes" outward from center toward edges
 *
 * WRONG (Center Origin Violation):
 * - Light concentrated at left edge only
 * - Light concentrated at right edge only
 * - Asymmetric light distribution
 * - Light "flowing" from one side to the other instead of expanding from center
 *
 * If tests fail with visual differences:
 * 1. Check if physics code was modified
 * 2. Verify motionMode is 'Center Origin' in all presets and timeline
 * 3. Check useK1Physics.ts for center-origin injection logic
 * 4. Review the diff images to see where light appears
 */
