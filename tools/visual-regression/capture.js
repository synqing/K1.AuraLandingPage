#!/usr/bin/env node
/*
 * Visual regression capture (manual targets for now).
 * Starts a dev server, loads canonical scenes, saves PNGs to tests/golden/manual.
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  console.error('[visual-regression] playwright is not installed. Install with `npm install -D playwright` and rerun.');
  process.exit(1);
}

const DEV_PORT = 3100;
const DEV_URL = `http://127.0.0.1:${DEV_PORT}`;

const shots = [
  {
    url: `${DEV_URL}/`,
    file: path.join('tests', 'golden', 'manual', 'K1Engine', 'hero', 'frame_0500.png'),
    settleMs: 1600,
    selector: 'canvas',
  },
  {
    url: `${DEV_URL}/simulator`,
    file: path.join('tests', 'golden', 'manual', 'K1Simulation', 'physical', 'frame_0500.png'),
    settleMs: 1600,
    selector: 'canvas',
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
  const dirs = [
    path.join('tests', 'golden', 'manual', 'K1Engine', 'hero'),
    path.join('tests', 'golden', 'manual', 'K1Simulation', 'physical'),
  ];
  dirs.forEach((d) => fs.mkdirSync(d, { recursive: true }));
}

async function startDevServer() {
  console.log('[visual-regression] starting dev server on port', DEV_PORT);
  const proc = spawn(
    'npm',
    ['run', 'dev', '--workspace=apps/web-main', '--', '--hostname', '127.0.0.1', '--port', String(DEV_PORT)],
    { stdio: 'inherit' }
  );
  return proc;
}

async function stopDevServer(proc) {
  if (!proc) return;
  console.log('[visual-regression] stopping dev server');
  proc.kill('SIGINT');
}

async function main() {
  await ensureDirs();

  const devProc = await startDevServer();
  await waitForServer(DEV_URL);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  for (const shot of shots) {
    console.log('[visual-regression] capturing', shot.url, '->', shot.file);
    await page.goto(shot.url);
    await page.waitForTimeout(shot.settleMs);
    const target = shot.selector ? await page.waitForSelector(shot.selector) : null;
    if (target) {
      await target.screenshot({ path: shot.file });
    } else {
      await page.screenshot({ path: shot.file, fullPage: true });
    }
  }

  await browser.close();
  await stopDevServer(devProc);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
