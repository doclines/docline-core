#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { chromium } from 'playwright';

const cwd = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.DOCLINE_CAPTURE_PORT || 4173);
const baseUrl = `http://${host}:${port}`;

const outputDir = path.join(cwd, 'public', 'readme', 'generated');
const desktopPath = path.join(outputDir, 'docline-desktop.png');
const mobilePath = path.join(outputDir, 'docline-mobile.png');
const gifPath = path.join(outputDir, 'docline-preview.gif');
const effectsGifPath = path.join(outputDir, 'docline-effects.gif');

function resolveBrowserLaunchOptions() {
  const localChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(localChromePath)) {
    return { headless: true, executablePath: localChromePath };
  }

  return { headless: true };
}

function hasFfmpeg() {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    p.on('exit', (code) => resolve(code === 0));
    p.on('error', () => resolve(false));
  });
}

async function renderGifFromFrames(framesDir, destination) {
  await new Promise((resolve, reject) => {
    const ff = spawn(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        '1',
        '-i',
        path.join(framesDir, '%03d.png'),
        '-vf',
        'scale=1200:-1:flags=lanczos',
        '-loop',
        '0',
        destination,
      ],
      { stdio: 'inherit' }
    );
    ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))));
    ff.on('error', reject);
  });
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // keep waiting
    }
    await sleep(500);
  }
  return false;
}

async function capture() {
  fs.mkdirSync(outputDir, { recursive: true });

  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], {
    cwd,
    stdio: 'pipe',
    env: process.env,
  });

  preview.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  preview.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  try {
    const ready = await waitForServer(baseUrl);
    if (!ready) {
      throw new Error(`Preview server was not reachable at ${baseUrl}`);
    }

    const browser = await chromium.launch(resolveBrowserLaunchOptions());

    const desktopPage = await browser.newPage({ viewport: { width: 1600, height: 980 } });
    await desktopPage.goto(`${baseUrl}/introduction?version=v1&lang=en`, { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: desktopPath, fullPage: true });

    const mobilePage = await browser.newPage({ viewport: { width: 430, height: 932 } });
    await mobilePage.goto(`${baseUrl}/introduction?version=v1&lang=en`, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: mobilePath, fullPage: true });

    const ffmpegInstalled = await hasFfmpeg();
    if (ffmpegInstalled) {
      const framesDir = path.join(outputDir, '.frames');
      const effectsFramesDir = path.join(outputDir, '.effects-frames');
      fs.mkdirSync(framesDir, { recursive: true });
      fs.mkdirSync(effectsFramesDir, { recursive: true });

      const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
      await page.goto(`${baseUrl}/introduction?version=v1&lang=en`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(framesDir, '000.png') });

      await page.goto(`${baseUrl}/components?version=v1&lang=en`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(framesDir, '001.png') });

      await page.goto(`${baseUrl}/quickstart?version=v2&lang=es`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(framesDir, '002.png') });

      // Capture a second GIF showing the UI effect toggles through query params.
      await page.goto(`${baseUrl}/introduction?version=v1&lang=en&theme=ayu-light`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(effectsFramesDir, '000.png') });

      await page.goto(`${baseUrl}/introduction?version=v1&lang=en&theme=tokyo-night-storm`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(effectsFramesDir, '001.png') });

      await page.goto(`${baseUrl}/introduction?version=v1&lang=en&theme=dracula-pro&contrast=high`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(effectsFramesDir, '002.png') });

      await page.goto(`${baseUrl}/introduction?version=v1&lang=en&theme=night-owl&density=compact`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(effectsFramesDir, '003.png') });

      await page.goto(`${baseUrl}/introduction?version=v1&lang=en&theme=one-dark-pro&reading=on&performance=on`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(effectsFramesDir, '004.png') });

      await browser.close();

      await renderGifFromFrames(framesDir, gifPath);
      await renderGifFromFrames(effectsFramesDir, effectsGifPath);

      fs.rmSync(framesDir, { recursive: true, force: true });
      fs.rmSync(effectsFramesDir, { recursive: true, force: true });
      console.log(`[docline capture] Wrote ${gifPath}`);
      console.log(`[docline capture] Wrote ${effectsGifPath}`);
    } else {
      await browser.close();
      console.log('[docline capture] ffmpeg not found; skipped GIF generation.');
    }

    console.log(`[docline capture] Wrote ${desktopPath}`);
    console.log(`[docline capture] Wrote ${mobilePath}`);
  } finally {
    preview.kill('SIGTERM');
  }
}

capture().catch((error) => {
  console.error('[docline capture] Failed to capture README assets.');
  console.error(error.message || error);
  process.exit(1);
});
