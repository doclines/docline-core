#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const docsConfigPath = path.join(cwd, 'docs.json');

function normalizeSlug(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/\/+$/, '');
}

function parseArgs(argv) {
  const args = [...argv];
  const oldSlug = normalizeSlug(args.shift());
  const newSlug = normalizeSlug(args.shift());

  const options = {
    context: 'all',
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === '--context') {
      options.context = String(args[i + 1] || 'all');
      i += 1;
    } else if (token.startsWith('--context=')) {
      options.context = token.slice('--context='.length);
    }
  }

  if (!oldSlug || !newSlug) {
    console.error('Usage: node scripts/rename-docline-page.mjs <old-slug> <new-slug> [--context v1:en|all]');
    process.exit(1);
  }

  return { oldSlug, newSlug, options };
}

function resolvePageFile(roots, slug) {
  const candidates = [];
  for (const root of roots) {
    const absoluteRoot = path.resolve(cwd, String(root || '').replace(/^\/+|\/+$/g, '') || '.');
    candidates.push(path.join(absoluteRoot, `${slug}.mdx`));
    candidates.push(path.join(absoluteRoot, `${slug}.md`));
    candidates.push(path.join(absoluteRoot, slug, 'index.mdx'));
    candidates.push(path.join(absoluteRoot, slug, 'index.md'));
  }
  return candidates.find((item) => fs.existsSync(item) && fs.statSync(item).isFile()) || null;
}

function updateNavigationPages(navigation, oldSlug, newSlug) {
  for (const tab of navigation?.tabs || []) {
    for (const group of tab?.groups || []) {
      for (const page of group?.pages || []) {
        if (typeof page === 'string' && normalizeSlug(page) === oldSlug) {
          const oldExt = String(page).toLowerCase().endsWith('.md') ? '.md' : String(page).toLowerCase().endsWith('.mdx') ? '.mdx' : '';
          const withExt = oldExt ? `${newSlug}${oldExt}` : newSlug;
          group.pages[group.pages.indexOf(page)] = withExt;
        }
        if (page && typeof page === 'object' && typeof page.path === 'string' && normalizeSlug(page.path) === oldSlug) {
          const oldExt = String(page.path).toLowerCase().endsWith('.md') ? '.md' : String(page.path).toLowerCase().endsWith('.mdx') ? '.mdx' : '';
          page.path = oldExt ? `${newSlug}${oldExt}` : newSlug;
        }
      }
    }
  }
}

function updateLinksInFile(filePath, oldSlug, newSlug) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const updated = raw
    .replace(new RegExp(`\
\((/?${oldSlug})(\\.mdx?|)(#[^)]+)?\)`, 'g'), (_m, p1, _p2, p3) => {
      return `(${p1.startsWith('/') ? `/${newSlug}` : newSlug}${p3 || ''})`;
    })
    .replace(new RegExp(`href=["']/?${oldSlug}(\\.mdx?|)(#[^"']+)?["']`, 'g'), (m) => {
      return m.replace(oldSlug, newSlug).replace(/\.mdx?|\.md/gi, '');
    });

  if (updated !== raw) {
    fs.writeFileSync(filePath, updated, 'utf-8');
    return true;
  }

  return false;
}

function walkDocsFiles(rootDir, out = []) {
  if (!fs.existsSync(rootDir)) return out;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkDocsFiles(full, out);
    } else if (/\.(md|mdx)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function ensureRedirect(config, from, to, contextKey) {
  if (!Array.isArray(config.redirects)) config.redirects = [];
  const exists = config.redirects.some((item) => normalizeSlug(item?.from) === from && normalizeSlug(item?.to) === to && (item?.context || 'all') === contextKey);
  if (!exists) {
    config.redirects.push({ from: `/${from}`, to: `/${to}`, context: contextKey, permanent: true });
  }
}

function main() {
  if (!fs.existsSync(docsConfigPath)) {
    console.error('docs.json not found.');
    process.exit(1);
  }

  const { oldSlug, newSlug, options } = parseArgs(process.argv.slice(2));
  const config = JSON.parse(fs.readFileSync(docsConfigPath, 'utf-8'));

  const contexts = Array.isArray(config?.contentMatrix?.entries) ? config.contentMatrix.entries : [];
  const selected = contexts.filter((ctx) => options.context === 'all' || `${ctx.version}:${ctx.locale}` === options.context);

  if (selected.length === 0) {
    console.error(`No matching context found for '${options.context}'.`);
    process.exit(1);
  }

  let movedCount = 0;
  for (const context of selected) {
    updateNavigationPages(context.navigation, oldSlug, newSlug);
    const filePath = resolvePageFile(context.roots || [], oldSlug);
    if (filePath) {
      const ext = path.extname(filePath);
      const rootBase = path.dirname(filePath).endsWith(oldSlug) ? path.dirname(path.dirname(filePath)) : path.dirname(filePath);
      const targetPath = path.join(rootBase, `${newSlug}${ext}`);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.renameSync(filePath, targetPath);
      movedCount += 1;
    }

    const contextKey = `${context.version}:${context.locale}`;
    ensureRedirect(config, oldSlug, newSlug, contextKey);
  }

  const docsRoots = new Set();
  for (const context of contexts) {
    for (const root of context.roots || []) docsRoots.add(path.resolve(cwd, root));
  }

  let rewritten = 0;
  for (const root of docsRoots) {
    const files = walkDocsFiles(root);
    for (const file of files) {
      if (updateLinksInFile(file, oldSlug, newSlug)) rewritten += 1;
    }
  }

  fs.writeFileSync(docsConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  console.log(`[docline rename] Updated ${movedCount} file(s), rewrote links in ${rewritten} file(s), and added redirects.`);
}

main();
