#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

const cwd = process.cwd();
const distPath = path.join(cwd, 'dist');
const outDir = path.join(cwd, 'exports');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const zipName = `docline-export-${stamp}.zip`;
const zipPath = path.join(outDir, zipName);

if (!fs.existsSync(distPath)) {
  console.error('dist/ is missing. Run npm run build first.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docline-export-'));
const stageDist = path.join(stageDir, 'site');
fs.cpSync(distPath, stageDist, { recursive: true });

const docsConfigPath = path.join(cwd, 'docs.json');
if (fs.existsSync(docsConfigPath)) {
  fs.copyFileSync(docsConfigPath, path.join(stageDist, 'docs.json'));
}

const result = spawnSync('zip', ['-rq', zipPath, '.'], {
  cwd: stageDist,
  stdio: 'inherit',
});

fs.rmSync(stageDir, { recursive: true, force: true });

if (result.status !== 0) {
  console.error('[docline export] zip command failed. Ensure `zip` is installed.');
  process.exit(result.status || 1);
}

const size = fs.statSync(zipPath).size;
console.log(`[docline export] Created ${zipPath} (${size} bytes)`);
