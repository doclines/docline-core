#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

const args = process.argv.slice(2);
const firstArg = args[0];

const RUNNABLE_COMMANDS = new Set([
  'dev',
  'start',
  'build',
  'preview',
  'docs:compile',
  'validate',
  'broken-links',
  'broken-links:external',
  'check',
  'readme:capture',
  'a11y',
  'export',
  'rename-page',
  'import:page',
]);

function printHelp() {
  console.log('docline CLI');
  console.log('');
  console.log('Usage:');
  console.log('  npx create-docline@latest new <project-dir> [--pm npm|pnpm|yarn|bun] [--docs-mode standard|versioned] [--badge-style minimal|full] [--branding keep|remove] [--no-install] [--force] [--name "My Docs"]');
  console.log('  npx create-docline@latest <project-dir> [--pm npm|pnpm|yarn|bun] [--docs-mode standard|versioned] [--badge-style minimal|full] [--branding keep|remove] [--no-install] [--force] [--name "My Docs"]');
  console.log('  npx create-docline@latest dev');
  console.log('  npx create-docline@latest validate');
  console.log('  npx create-docline@latest broken-links');
  console.log('  npx create-docline@latest rename-page old/path new/path --context v1:en');
  console.log('  npx create-docline@latest import:page --url <https://...> --context v1:en --slug imported/page');
  console.log('');
  console.log('Commands:');
  console.log('  new                 Scaffold a full docline project');
  console.log('  dev/start           Run local preview');
  console.log('  build               Build static site');
  console.log('  validate            Validate config/content consistency');
  console.log('  broken-links        Check internal links and anchors');
  console.log('  a11y                Run accessibility checks on sampled pages');
  console.log('  export              Create distributable zip from dist/');
  console.log('  rename-page         Rename a docs page and update links + redirects');
  console.log('  import:page         Import a web page into MDX and update navigation');
  console.log('  check               Run validate + broken-links');
  console.log('  preview             Serve production build');
  console.log('');
  console.log('Scaffold options:');
  console.log('  --docs-mode standard    Single-context docs (no version/lang selector)');
  console.log('  --docs-mode versioned   Version + locale matrix docs');
  console.log('  --badge-style minimal   Subtle permanent Powered by badge');
  console.log('  --badge-style full      Higher-contrast permanent Powered by badge');
  console.log('  --branding keep         Keep Powered by attribution');
  console.log('  --branding remove       Remove Powered by attribution');
  console.log('');
}

function detectPackageManager() {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(cwd, 'bun.lockb'))) return 'bun';
  return 'npm';
}

function parseCommonOptions(argv) {
  let pm;
  const passthrough = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--pm') {
      pm = argv[i + 1];
      i += 1;
      continue;
    }

    if (token.startsWith('--pm=')) {
      pm = token.slice('--pm='.length);
      continue;
    }

    passthrough.push(token);
  }

  return { pm, passthrough };
}

function runScript(scriptName, scriptArgs = [], pmOverride) {
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('No package.json found in current directory.');
    console.error('Run this inside a docline project, or use the new command first.');
    process.exit(1);
  }

  const pm = pmOverride || detectPackageManager();
  let command;
  let cmdArgs;

  if (pm === 'npm') {
    command = 'npm';
    cmdArgs = ['run', scriptName, ...scriptArgs];
  } else if (pm === 'pnpm') {
    command = 'pnpm';
    cmdArgs = ['run', scriptName, ...scriptArgs];
  } else if (pm === 'yarn') {
    command = 'yarn';
    cmdArgs = [scriptName, ...scriptArgs];
  } else if (pm === 'bun') {
    command = 'bun';
    cmdArgs = ['run', scriptName, ...scriptArgs];
  } else {
    console.error(`Unsupported package manager '${pm}'.`);
    process.exit(1);
  }

  const result = spawnSync(command, cmdArgs, {
    cwd,
    stdio: 'inherit',
  });

  process.exit(result.status ?? 1);
}

function runScaffold(scaffoldArgs) {
  const scaffoldScript = path.join(__dirname, 'scaffold-template.mjs');
  const result = spawnSync('node', [scaffoldScript, ...scaffoldArgs], {
    cwd,
    stdio: 'inherit',
  });

  process.exit(result.status ?? 1);
}

function main() {
  if (!firstArg || firstArg === '--help' || firstArg === '-h' || firstArg === 'help') {
    printHelp();
    return;
  }

  if (firstArg === 'new' || firstArg === 'init') {
    runScaffold(args.slice(1));
    return;
  }

  if (RUNNABLE_COMMANDS.has(firstArg)) {
    const { pm, passthrough } = parseCommonOptions(args.slice(1));
    runScript(firstArg, passthrough, pm);
    return;
  }

  // Backward-compatible default: treat unknown first argument as target directory for `new`.
  runScaffold(args);
}

main();
