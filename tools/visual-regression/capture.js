#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                K1 VISUAL REGRESSION - CENTER ORIGIN VALIDATION             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  This script captures golden frames from all K1 visualization routes      ║
 * ║  to validate CENTER ORIGIN MANDATE compliance.                            ║
 * ║                                                                           ║
 * ║  ROUTES TESTED:                                                           ║
 * ║  - /           : Landing page with K1Engine (HERO preset)                 ║
 * ║  - /simulator  : Physics simulator with K1Engine (PHYSICAL preset)        ║
 * ║                                                                           ║
 * ║  EXPECTED VISUAL:                                                         ║
 * ║  All routes should show SYMMETRIC LIGHT FROM CENTER, never at edges.      ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  console.error(
    '[visual-regression] playwright is not installed. Install with `npm install -D playwright` and rerun.'
  );
  process.exit(1);
}

const DEV_PORT = 3100;
const DEV_URL = `http://127.0.0.1:${DEV_PORT}`;

// Golden frame output directory
const GOLDEN_DIR = path.join('tests', 'golden', 'center-origin');

/**
 * Shots to capture - ALL K1 visualization routes
 * Each shot validates that center-origin mandate is visually correct
 */
const shots = [
  {
    name: 'landing-hero',
    url: `${DEV_URL}/`,
    file: path.join(GOLDEN_DIR, 'landing-hero.png'),
    settleMs: 2000, // Allow physics to run and show symmetric light
    selector: 'canvas',
    description: 'Landing page with HERO preset - symmetric light from center',
  },
  {
    name: 'simulator-physical',
    url: `${DEV_URL}/simulator`,
    file: path.join(GOLDEN_DIR, 'simulator-physical.png'),
    settleMs: 2000,
    selector: 'canvas',
    description: 'Simulator with PHYSICAL preset - symmetric light from center',
  },
];

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch (_) {
      // ignore until ready
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function ensureDirs() {
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });
  console.log(`[visual-regression] Golden frames will be saved to: ${GOLDEN_DIR}`);
}

async function startDevServer() {
  console.log('[visual-regression] Starting dev server on port', DEV_PORT);
  const proc = spawn(
    'npm',
    ['run', 'dev', '--workspace=apps/web-main', '--', '--hostname', '127.0.0.1', '--port', String(DEV_PORT)],
    { stdio: 'inherit' }
  );
  return proc;
}

async function stopDevServer(proc) {
  if (!proc) return;
  console.log('[visual-regression] Stopping dev server');
  proc.kill('SIGINT');
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  K1 VISUAL REGRESSION - CENTER ORIGIN VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');

  await ensureDirs();

  const devProc = await startDevServer();
  await waitForServer(DEV_URL);
  console.log('[visual-regression] Dev server ready');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('');
  console.log('Capturing golden frames...');
  console.log('');

  for (const shot of shots) {
    console.log(`  [${shot.name}] ${shot.description}`);
    console.log(`    URL: ${shot.url}`);
    console.log(`    File: ${shot.file}`);

    await page.goto(shot.url);
    await page.waitForTimeout(shot.settleMs);

    const target = shot.selector ? await page.waitForSelector(shot.selector) : null;
    if (target) {
      await target.screenshot({ path: shot.file });
    } else {
      await page.screenshot({ path: shot.file, fullPage: true });
    }

    console.log(`    ✓ Captured`);
    console.log('');
  }

  await browser.close();
  await stopDevServer(devProc);

  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  GOLDEN FRAMES CAPTURED SUCCESSFULLY');
  console.log('');
  console.log('  MANUAL VERIFICATION REQUIRED:');
  console.log('  Open each PNG and verify light emanates SYMMETRICALLY from CENTER.');
  console.log('');
  console.log('  EXPECTED: Symmetric columns of light from center');
  console.log('  WRONG: Light blobs at edges or asymmetric positions');
  console.log('═══════════════════════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
