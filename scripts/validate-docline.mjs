#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const docsConfigPath = path.join(cwd, 'docs.json');
const generatedPath = path.join(cwd, 'src', 'generated', 'docline-content.json');

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.(md|mdx)$/i, '')
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '');
}

function resolvePageFile(roots, pagePath) {
  const candidates = [];
  for (const root of roots) {
    const cleanRoot = String(root || '').replace(/^\/+|\/+$/g, '');
    const absoluteRoot = path.resolve(cwd, cleanRoot || '.');
    candidates.push(path.join(absoluteRoot, `${pagePath}.mdx`));
    candidates.push(path.join(absoluteRoot, `${pagePath}.md`));
    candidates.push(path.join(absoluteRoot, pagePath, 'index.mdx'));
    candidates.push(path.join(absoluteRoot, pagePath, 'index.md'));
  }

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function flattenNavigation(navigation) {
  const pages = [];
  for (const tab of navigation?.tabs || []) {
    for (const group of tab?.groups || []) {
      for (const page of group?.pages || []) {
        if (typeof page === 'string') {
          const slug = toSlug(page);
          if (slug) pages.push(slug);
          continue;
        }

        if (page && typeof page.path === 'string') {
          const slug = toSlug(page.path);
          if (slug) pages.push(slug);
        }
      }
    }
  }
  return pages;
}

function main() {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(docsConfigPath)) {
    console.error('[docline validate] docs.json is missing.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(docsConfigPath, 'utf-8'));
  if (config.template !== 'docline') {
    warnings.push(`template is '${config.template}', expected 'docline'.`);
  }

  const matrix = config.contentMatrix;
  if (!matrix || !Array.isArray(matrix.entries) || matrix.entries.length === 0) {
    errors.push('contentMatrix.entries must be a non-empty array.');
  }

  const seenContextKeys = new Set();

  for (const entry of matrix?.entries || []) {
    const version = entry?.version;
    const locale = entry?.locale;
    const roots = Array.isArray(entry?.roots) ? entry.roots : [];
    const navigation = entry?.navigation;
    const contextKey = `${version}:${locale}`;

    if (!version || !locale) {
      errors.push('Each contentMatrix entry requires version and locale.');
      continue;
    }

    if (seenContextKeys.has(contextKey)) {
      errors.push(`Duplicate contentMatrix context '${contextKey}'.`);
    }
    seenContextKeys.add(contextKey);

    if (roots.length === 0) {
      errors.push(`Context '${contextKey}' has no roots.`);
      continue;
    }

    const pages = flattenNavigation(navigation);
    if (pages.length === 0) {
      errors.push(`Context '${contextKey}' has empty navigation pages.`);
      continue;
    }

    for (const pageSlug of pages) {
      const filePath = resolvePageFile(roots, pageSlug);
      if (!filePath) {
        errors.push(`Missing source doc for '${contextKey}' page '${pageSlug}'.`);
      }
    }
  }

  if (!fs.existsSync(generatedPath)) {
    errors.push('Generated dataset is missing. Run npm run docs:compile first.');
  } else {
    const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'));
    for (const contextKey of seenContextKeys) {
      const context = (generated.contexts || []).find((item) => item.key === contextKey);
      if (!context) {
        errors.push(`Generated dataset missing context '${contextKey}'.`);
      }
      if (!generated.pages?.[contextKey]) {
        errors.push(`Generated dataset missing pages for '${contextKey}'.`);
      }
      if (!generated.searchIndex?.[contextKey]) {
        errors.push(`Generated dataset missing search index for '${contextKey}'.`);
      }
    }
  }

  if (Array.isArray(config.redirects)) {
    for (const item of config.redirects) {
      const from = toSlug(item?.from || '');
      const to = toSlug(item?.to || '');
      if (!from || !to) {
        errors.push('redirects entries require non-empty from/to values.');
      }
      if (from === to) {
        warnings.push(`redirect '${from}' points to itself.`);
      }
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[docline validate] warning: ${warning}`);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[docline validate] error: ${error}`);
    }
    process.exit(1);
  }

  console.log('[docline validate] OK: config, source files, and generated dataset are consistent.');
}

main();
