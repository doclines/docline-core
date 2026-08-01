#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { setTimeout as sleep } from 'timers/promises';

const host = '127.0.0.1';
const port = Number(process.env.DOCLINE_A11Y_PORT || (4400 + Math.floor(Math.random() * 200)));
const baseUrl = `http://${host}:${port}`;
const datasetPath = path.join(process.cwd(), 'src', 'generated', 'docline-content.json');

function resolveBrowserLaunchOptions() {
  const localChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (process.platform === 'darwin' && fs.existsSync(localChromePath)) {
    return { headless: true, executablePath: localChromePath };
  }
  return { headless: true };
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

async function main() {
  if (!fs.existsSync(datasetPath)) {
    console.error('[docline a11y] Missing generated dataset. Run npm run docs:compile first.');
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], {
    stdio: 'pipe',
    env: process.env,
  });

  preview.stdout.on('data', (c) => process.stdout.write(c));
  preview.stderr.on('data', (c) => process.stderr.write(c));

  try {
    const ready = await waitForServer(baseUrl);
    if (!ready) throw new Error('Preview server did not start');

    const browser = await chromium.launch(resolveBrowserLaunchOptions());
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();

    const contexts = dataset.contexts || [];
    const failures = [];

    for (const context of contexts.slice(0, 4)) {
      const entries = (dataset.searchIndex?.[context.key] || []).slice(0, 2);
      for (const entry of entries) {
        const url = `${baseUrl}/${entry.slug}?version=${context.version}&lang=${context.locale}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        const result = await new AxeBuilder({ page }).analyze();
        if ((result.violations || []).length > 0) {
          failures.push({
            url,
            violations: result.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
              targets: v.nodes.slice(0, 4).map((n) => n.target?.join(' ') || '(unknown)'),
            })),
          });
        }
      }
    }

    await context.close();
    await browser.close();

    if (failures.length > 0) {
      console.error('[docline a11y] Violations found:');
      for (const fail of failures) {
        console.error(`- ${fail.url}`);
        for (const violation of fail.violations) {
          console.error(`  - ${violation.id} (${violation.impact || 'unknown'}) nodes=${violation.nodes}`);
          for (const target of violation.targets || []) {
            console.error(`    target: ${target}`);
          }
        }
      }
      process.exit(1);
    }

    console.log('[docline a11y] No accessibility violations detected in sampled pages.');
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error('[docline a11y] Failed:', error.message || error);
  process.exit(1);
});
