#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import readline from 'readline';

const cwd = process.cwd();
const templateRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const args = process.argv.slice(2);
const positional = [];
const flags = new Set();
const options = new Map();

for (let i = 0; i < args.length; i += 1) {
  const token = args[i];

  if (!token.startsWith('--')) {
    positional.push(token);
    continue;
  }

  if (token.includes('=')) {
    const [key, value] = token.split('=');
    options.set(key, value);
    continue;
  }

  if (token === '--pm' || token === '--name' || token === '--badge-style' || token === '--branding') {
    const value = args[i + 1];
    if (value) {
      options.set(token, value);
      i += 1;
    }
    continue;
  }

  if (token === '--docs-mode' || token === '--mode') {
    const value = args[i + 1];
    if (value) {
      options.set('--docs-mode', value);
      i += 1;
    }
    continue;
  }

  flags.add(token);
}

const targetArg = positional[0] || 'docline-site';
const targetDir = path.resolve(cwd, targetArg);
const projectNameFromPath = path.basename(targetDir);
const projectName = options.get('--name') || projectNameFromPath;
const installDeps = !flags.has('--no-install');
const force = flags.has('--force');
const packageManager = options.get('--pm') || 'npm';
const docsMode = String(options.get('--docs-mode') || options.get('--mode') || 'versioned').toLowerCase();
const badgeStyle = String(options.get('--badge-style') || 'minimal').toLowerCase();
const brandingOption = options.get('--branding');

const EXCLUDED = new Set([
  '.git',
  '.gitignore',
  'node_modules',
  'dist',
  '.venv',
  '.DS_Store',
  'package-lock.json',
]);

function toPackageName(name) {
  return String(name || 'docline-site')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '') || 'docline-site';
}

function isDirEmpty(dirPath) {
  if (!fs.existsSync(dirPath)) return true;
  const entries = fs.readdirSync(dirPath).filter((entry) => entry !== '.DS_Store');
  return entries.length === 0;
}

function shouldExclude(name) {
  if (EXCLUDED.has(name)) return true;
  if (name.endsWith('.log')) return true;
  if (name.startsWith('.git')) return true;
  return false;
}

function copyRecursive(sourceDir, destinationDir) {
  fs.mkdirSync(destinationDir, { recursive: true });

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (shouldExclude(entry.name)) continue;

    if (entry.isDirectory()) {
      copyRecursive(sourcePath, destinationPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function writeProjectConfig(brandingMode) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Template package.json was not copied.');
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  pkg.name = toPackageName(projectName);
  pkg.version = '0.1.0';
  pkg.private = true;
  pkg.description = `${projectName} docs powered by docline`;
  delete pkg.bin;

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');

  const docsJsonPath = path.join(targetDir, 'docs.json');
  if (fs.existsSync(docsJsonPath)) {
    const docsConfig = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
    docsConfig.name = projectName;
    docsConfig.description = `${projectName} documentation`;
    docsConfig.branding = docsConfig.branding || {};
    docsConfig.branding.title = projectName;
    docsConfig.branding.subtitle = docsConfig.branding.subtitle || 'Developer Documentation';
    docsConfig.branding.logo = docsConfig.branding.logo || {};
    docsConfig.branding.logo.alt = projectName;
    docsConfig.branding.badgeStyle = badgeStyle;
    docsConfig.branding.attribution = brandingMode;
    docsConfig.contentMode = docsMode;

    if (docsMode === 'standard') {
      const firstEntry = docsConfig?.contentMatrix?.entries?.[0];
      const fallbackRoots = Array.isArray(firstEntry?.roots) && firstEntry.roots.length > 0
        ? firstEntry.roots
        : (Array.isArray(docsConfig?.content?.roots) && docsConfig.content.roots.length > 0
          ? docsConfig.content.roots
          : ['docs']);

      docsConfig.content = {
        ...(docsConfig.content || {}),
        roots: fallbackRoots,
      };

      docsConfig.navigation = firstEntry?.navigation || docsConfig.navigation || { tabs: [] };
      docsConfig.contentMatrix = {
        defaultVersion: '',
        defaultLocale: '',
        versions: [],
        locales: [],
        entries: [],
      };
    }

    if (docsMode === 'versioned') {
      docsConfig.contentMode = 'versioned';
    }

    fs.writeFileSync(docsJsonPath, `${JSON.stringify(docsConfig, null, 2)}\n`, 'utf-8');
  }
}

function runInstall() {
  const installCommands = {
    npm: ['npm', ['install']],
    pnpm: ['pnpm', ['install']],
    yarn: ['yarn', ['install']],
    bun: ['bun', ['install']],
  };

  const selected = installCommands[packageManager];
  if (!selected) {
    throw new Error(`Unsupported package manager '${packageManager}'. Use --pm npm|pnpm|yarn|bun.`);
  }

  const [command, commandArgs] = selected;
  const result = spawnSync(command, commandArgs, {
    cwd: targetDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Dependency install failed using ${packageManager}.`);
  }
}

function askBrandingChoice() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return Promise.resolve('keep');
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Branding attribution: keep or remove? (K/r): ', (answer) => {
      rl.close();
      const normalized = String(answer || '').trim().toLowerCase();
      if (normalized === 'remove' || normalized === 'r') {
        resolve('remove');
        return;
      }
      resolve('keep');
    });
  });
}

function printNextSteps(brandingMode) {
  const relTarget = path.relative(cwd, targetDir) || '.';
  const isStandardMode = docsMode === 'standard';
  console.log('');
  console.log('docline project ready.');
  console.log(`Mode: ${docsMode === 'standard' ? 'standard (single-context)' : 'versioned (multi-context)'}`);
  console.log(`Badge style: ${badgeStyle}`);
  console.log(`Branding attribution: ${brandingMode}`);
  console.log('');
  console.log('Mode preview:');
  if (isStandardMode) {
    console.log('  - Header: no Version/Language selector');
    console.log('  - URL style: /page-slug (no forced ?version=...&lang=...)');
    console.log('  - Config: contentMode="standard" + navigation/content.roots');
  } else {
    console.log('  - Header: Version + Language selector visible');
    console.log('  - URL style: /page-slug?version=v1&lang=en');
    console.log('  - Config: contentMode="versioned" + contentMatrix entries');
  }
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${relTarget}`);
  if (!installDeps) {
    console.log(`  ${packageManager} install`);
  }
  console.log(`  ${packageManager} run dev`);
  console.log('');
  console.log('Mintlify-style commands in this project:');
  console.log(`  ${packageManager} run dev           # preview locally`);
  console.log(`  ${packageManager} run validate      # strict config/content checks`);
  console.log(`  ${packageManager} run broken-links  # broken links and anchors`);
  console.log('');
}

async function main() {
  const brandingMode = String(brandingOption || await askBrandingChoice()).toLowerCase();

  if (docsMode !== 'standard' && docsMode !== 'versioned') {
    console.error(`Invalid --docs-mode value '${docsMode}'. Use standard or versioned.`);
    process.exit(1);
  }

  if (badgeStyle !== 'minimal' && badgeStyle !== 'full') {
    console.error(`Invalid --badge-style value '${badgeStyle}'. Use minimal or full.`);
    process.exit(1);
  }

  if (brandingMode !== 'keep' && brandingMode !== 'remove') {
    console.error(`Invalid --branding value '${brandingMode}'. Use keep or remove.`);
    process.exit(1);
  }

  if (fs.existsSync(targetDir) && !isDirEmpty(targetDir) && !force) {
    console.error(`Target directory is not empty: ${targetDir}`);
    console.error('Use --force to scaffold into an existing non-empty directory.');
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  copyRecursive(templateRoot, targetDir);
  writeProjectConfig(brandingMode);

  if (installDeps) {
    runInstall();
  }

  printNextSteps(brandingMode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
